/**
 * Bridge to the vitest test runner.
 *
 * Two responsibilities:
 *   1. Run vitest and parse its JSON output into a per-file pass/fail map.
 *   2. Scan test file CONTENT for spec ID references — used by rules to
 *      establish "this test exercises this AC/INV/TC".
 *
 * Both functions handle missing tooling / missing files gracefully (return
 * empty maps with a flag), so rules can skip cleanly when vitest is not
 * available.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, readFile, mkdtemp, rm } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import * as ts from 'typescript';
import { CITATION_RE } from '../spec/patterns.js';

const execFileP = promisify(execFile);

/** Per-file test outcome summary. */
export interface TestFileOutcome {
  readonly file: string;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  /** True if every assertion in the file passed (and at least one ran). */
  readonly allGreen: boolean;
}

export interface VitestRunResult {
  readonly ran: boolean;
  /** Map keyed by test file path relative to projectRoot. */
  readonly outcomes: ReadonlyMap<string, TestFileOutcome>;
  readonly note?: string;
}

/**
 * Invoke `vitest run --reporter=json` in `projectRoot` and parse the
 * result. Uses an outputFile in a temp dir to avoid mixing JSON with any
 * incidental stdout (esbuild warnings, etc.).
 */
export async function runVitest(projectRoot: string): Promise<VitestRunResult> {
  const tmp = await mkdtemp(join(tmpdir(), 'verify-vitest-'));
  const jsonPath = join(tmp, 'vitest.json');
  try {
    await execFileP(
      'npx',
      ['vitest', 'run', '--reporter=json', '--outputFile', jsonPath],
      {
        cwd: projectRoot,
        // Generous timeout — caller is non-interactive.
        timeout: 5 * 60_000,
        // Vitest writes a lot to stdout; uncapped buffer prevents truncation.
        maxBuffer: 100 * 1024 * 1024,
      },
    );
  } catch (err) {
    // Vitest exits non-zero when tests fail — we still want the JSON.
    // Only treat it as a hard failure when the JSON file is missing.
    const noJson = await readFile(jsonPath, 'utf8').catch(() => null);
    if (noJson === null) {
      await rm(tmp, { recursive: true, force: true });
      return {
        ran: false,
        outcomes: new Map(),
        note: `vitest invocation failed: ${(err as Error).message}`,
      };
    }
  }

  let raw: string;
  try {
    raw = await readFile(jsonPath, 'utf8');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ran: false,
      outcomes: new Map(),
      note: 'vitest JSON output was not valid JSON',
    };
  }

  return { ran: true, outcomes: parseVitestJson(parsed, projectRoot) };
}

interface VitestAssertion {
  status?: 'passed' | 'failed' | 'pending' | 'skipped' | 'todo';
}
interface VitestTestResult {
  name?: string;
  assertionResults?: VitestAssertion[];
}

/** Convert vitest's JSON reporter output into a per-file outcome map. */
export function parseVitestJson(
  parsed: unknown,
  projectRoot: string,
): Map<string, TestFileOutcome> {
  const outcomes = new Map<string, TestFileOutcome>();
  if (!parsed || typeof parsed !== 'object') return outcomes;
  const root = parsed as { testResults?: VitestTestResult[] };
  const list = Array.isArray(root.testResults) ? root.testResults : [];

  for (const tr of list) {
    const file = typeof tr.name === 'string' ? tr.name : '';
    if (!file) continue;
    const rel = relative(projectRoot, file);
    let passed = 0,
      failed = 0,
      skipped = 0;
    for (const ar of tr.assertionResults ?? []) {
      switch (ar.status) {
        case 'passed':
          passed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'pending':
        case 'skipped':
        case 'todo':
          skipped++;
          break;
        default:
          break;
      }
    }
    outcomes.set(rel, {
      file: rel,
      passed,
      failed,
      skipped,
      allGreen: failed === 0 && passed > 0,
    });
  }
  return outcomes;
}

/** Recursively walk a directory, yielding file paths. */
async function* walkFiles(dir: string): AsyncGenerator<string> {
  let entries: Dirent[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Dirent[];
  } catch {
    return;
  }
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walkFiles(p);
    } else if (ent.isFile()) {
      yield p;
    }
  }
}

/**
 * Scan every file under `testDir` for spec ID references via TS AST.
 *
 * Round-N architect flagged that the previous content-grep treated any
 * mention of an ID anywhere in the file as evidence — including string
 * literals inside assertions like `expect(opts.filter?.test('AC-R1-1'))`
 * which is testing the filter, not AC-R1-1. The attacker's free-text
 * exit was to drop `// AC-R1-1` in any test comment.
 *
 * The honest semantic: an ID is "mentioned by a test" only when it
 * appears as a string literal in the FIRST argument of an `it()` /
 * `test()` / `describe()` call (or their `.skip`/`.only`/`.todo`/`.each`
 * variants). The first argument is the test-name slot — the only place
 * the framework treats as identification.
 *
 * Returns `id → Set<relative path>` for ACTIVE tests only. Skipped /
 * todo'd tests do NOT count as Built evidence — the architect's
 * round-N audit pointed out the old `allGreen` would credit a file
 * containing `it.skip('AC-R1-1', ...)` plus an unrelated trivial pass.
 */
export async function scanTestFilesForIds(
  projectRoot: string,
  testDir = 'tests',
): Promise<Map<string, Set<string>>> {
  const root = join(projectRoot, testDir);
  const out = new Map<string, Set<string>>();

  for await (const file of walkFiles(root)) {
    if (!/\.(test|spec)\.(t|j)sx?$/.test(file)) continue;
    let content: string;
    try {
      content = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    const rel = relative(projectRoot, file);

    const sf = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );

    // Architect round-N+1 attack vector: locally-defined
    // `function test()` or `import { test } from 'node:test'` could
    // credit IDs even though vitest never runs those tests.
    //
    // Pre-pass: build the set of identifier names that come from
    // `vitest` imports. If the file has NO vitest import, it isn't a
    // vitest test file — skip it. If the file ALSO declares a local
    // function with one of the framework names (shadowing), treat the
    // file as poisoned and skip — we cannot tell at AST scope whether
    // a given call resolves to vitest or the shadow.
    const frameworkNames = collectVitestImportedNames(sf);
    if (frameworkNames.size === 0) continue;
    if (hasLocalFrameworkShadow(sf)) continue;

    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        isFrameworkTestCall(node, frameworkNames) &&
        !isSkippedCall(node)
      ) {
        const firstArg = node.arguments[0];
        const name = stringLiteralValue(firstArg);
        // Architect round-N+1 attack vector AV2: a test named after
        // an AC with no body assertion still credited Built. Require
        // at least one descendant `expect(...)` call before granting
        // coverage. `describe` blocks satisfy this via any nested
        // it/test body; bare `it` blocks must assert themselves.
        if (name && callHasAssertion(node)) {
          extractIdsFromString(name, rel, out);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return out;
}

/**
 * True when the call expression's tree contains at least one
 * NON-TAUTOLOGICAL `expect(...)` invocation. Walks the second argument
 * (test body or suite body) and any nested calls.
 *
 * Architect round-N+2: the previous "any `expect(`" check credited
 * tautological assertions like `expect(1).toBe(1)`, `expect(true)`
 * `.toBe(true)`, and `expect.assertions(0)` (which configures zero
 * assertions). Adversary cost was 17 keystrokes.
 *
 * Rejected forms:
 *   - `expect(literalA).matcher(literalA)` where the two literals are
 *     structurally identical (numeric, string, boolean, null) — the
 *     classic "I asserted nothing" reflex
 *   - `expect.assertions(0)` and `expect.assertions(<negative>)` — the
 *     assertion-count configurator with no actual assertions
 *
 * Accepted forms:
 *   - any expect chain with at least one non-tautological matcher call
 *   - `expect(value).toBe(value)` where value is an identifier / call
 *     expression / property access (cannot determine staticly)
 *
 * `assert`, `chai.expect`, `should.*` style helpers are NOT counted.
 * Spec convention pins specrail to vitest's `expect`.
 */
function callHasAssertion(call: ts.CallExpression): boolean {
  let found = false;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isCallExpression(n) && isRealExpectAssertion(n)) {
      found = true;
      return;
    }
    ts.forEachChild(n, visit);
  };
  for (const arg of call.arguments) ts.forEachChild(arg, visit);
  return found;
}

/**
 * True when the call expression is a vitest assertion that actually
 * exercises something. Recognised shapes:
 *
 *   - `expect(A).matcher(B)`     — chain form, must be non-tautological
 *   - `expect(A).not.matcher(B)` — negated chain, same rule
 *   - `expect.hasAssertions()`   — assertion-count enforcer (real claim)
 *   - `expect.fail(...)`         — explicit failure (counts as assertion)
 *
 * Bare `expect(value)` without a matcher does NOT count — it captures
 * a value but performs no check. `expect.assertions(N)` with N<=0 also
 * doesn't count (vacuous configurator).
 */
function isRealExpectAssertion(call: ts.CallExpression): boolean {
  const expr = call.expression;
  // Chain form: expect(A).matcher(B) — or `.not.matcher(B)`
  if (ts.isPropertyAccessExpression(expr)) {
    // Walk up the chain to find the head `expect(...)` call.
    let head: ts.Node = expr.expression;
    while (
      ts.isPropertyAccessExpression(head) &&
      head.name.text === 'not'
    ) {
      head = head.expression;
    }
    if (ts.isCallExpression(head)) {
      const root = getCallRootName(head.expression);
      if (root === 'expect') {
        // It IS an expect chain. Check tautology.
        return !isTautologicalAssertion(call);
      }
    }
    // expect.hasAssertions() / expect.fail() — static configurator forms
    if (
      ts.isIdentifier(expr.expression) &&
      expr.expression.text === 'expect' &&
      (expr.name.text === 'hasAssertions' || expr.name.text === 'fail')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Heuristic: returns true when the call is a known-empty assertion
 * shape that does not exercise behaviour.
 */
function isTautologicalAssertion(call: ts.CallExpression): boolean {
  // `expect.assertions(N)` configurator — vacuous when N === 0 or negative.
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.expression) &&
    call.expression.expression.text === 'expect' &&
    call.expression.name.text === 'assertions'
  ) {
    const arg = call.arguments[0];
    if (arg && ts.isNumericLiteral(arg) && Number(arg.text) <= 0) return true;
    return false;
  }
  // `expect.hasAssertions()` — actually a real claim, NOT tautological.
  // Only `expect(...).matcher(...)` form remains. We need a chain like
  // `expect(A).toBe(B)` — walk up to the head `expect(A)` and the
  // matcher's argument B.
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isCallExpression(call.expression.expression)
  ) {
    const head = call.expression.expression;
    // Skip the `.not` modifier — `expect(A).not.toBe(A)` is still
    // tautological (always false but exercises nothing about the SUT).
    let matcher = call;
    let matcherName = call.expression.name.text;
    if (
      matcherName === 'not' &&
      ts.isPropertyAccessExpression(matcher.expression)
    ) {
      // No call here yet; the `.not` itself isn't called. Skip.
      return false;
    }
    if (head.expression.kind === ts.SyntaxKind.Identifier && (head.expression as ts.Identifier).text === 'expect') {
      const lhs = head.arguments[0];
      const rhs = call.arguments[0];
      if (lhs && rhs && areStructurallyIdenticalLiterals(lhs, rhs)) {
        return true;
      }
    }
  }
  return false;
}

function areStructurallyIdenticalLiterals(a: ts.Node, b: ts.Node): boolean {
  if (a.kind !== b.kind) return false;
  if (ts.isNumericLiteral(a) && ts.isNumericLiteral(b)) {
    return Number(a.text) === Number(b.text);
  }
  if (ts.isStringLiteral(a) && ts.isStringLiteral(b)) {
    return a.text === b.text;
  }
  if (ts.isNoSubstitutionTemplateLiteral(a) && ts.isNoSubstitutionTemplateLiteral(b)) {
    return a.text === b.text;
  }
  if (
    (a.kind === ts.SyntaxKind.TrueKeyword && b.kind === ts.SyntaxKind.TrueKeyword) ||
    (a.kind === ts.SyntaxKind.FalseKeyword && b.kind === ts.SyntaxKind.FalseKeyword) ||
    (a.kind === ts.SyntaxKind.NullKeyword && b.kind === ts.SyntaxKind.NullKeyword)
  ) {
    return true;
  }
  return false;
}

/**
 * Walk top-level import declarations and return the set of LOCAL names
 * bound by `import {...} from 'vitest'`. Aliasing is honoured:
 *   `import { describe as desc } from 'vitest'` → set contains `desc`.
 */
function collectVitestImportedNames(sf: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (stmt.moduleSpecifier.text !== 'vitest') continue;
    const clause = stmt.importClause;
    if (!clause) continue;
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        // `import { it as foo }`: el.propertyName === 'it', el.name === 'foo'
        // `import { it }`:        el.propertyName undefined, el.name === 'it'
        const importedName = (el.propertyName ?? el.name).text;
        if (importedName === 'it' || importedName === 'test' || importedName === 'describe') {
          names.add(el.name.text);
        }
      }
    }
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      // `import * as v from 'vitest'` — calls reach via property access
      // `v.it(...)` / `v.test(...)`. Treat the namespace local name as
      // a root the call-walker accepts; getCallRootName already chases
      // PropertyAccess so `v.it.skip(...)` resolves to `v`.
      names.add(clause.namedBindings.name.text);
    }
  }
  return names;
}

/**
 * True when the file declares a top-level function named `it`, `test`,
 * or `describe`. Such shadowing is rare in real test files but is an
 * obvious lie-vector (drop in `function test(){...}` and the AST scan
 * cannot tell which `test(...)` call resolves to vitest). Treat the
 * whole file as untrusted in that case.
 */
function hasLocalFrameworkShadow(sf: ts.SourceFile): boolean {
  const shadowed = new Set(['it', 'test', 'describe']);
  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name && shadowed.has(stmt.name.text)) {
      return true;
    }
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && shadowed.has(decl.name.text)) {
          return true;
        }
      }
    }
    // Architect round-N+2: `class test {}` at top level also shadows.
    if (ts.isClassDeclaration(stmt) && stmt.name && shadowed.has(stmt.name.text)) {
      return true;
    }
    // Enum/type/interface named `test`/`it`/`describe` don't create
    // runtime bindings; they only live in the type namespace and
    // cannot shadow framework call sites. Skip.
  }
  return false;
}

/**
 * Recognise the names the test framework uses to register a test or
 * suite. Direct identifier (`it`, `test`, `describe`, or whatever local
 * alias they're imported under) AND any property access chain ending
 * in those names (`it.each`, `describe.skip`, ...). The allowed root
 * names come from the file's own `import {...} from 'vitest'` clause,
 * not a hardcoded list — aliasing is honoured. Skip/only/todo are
 * handled by `isSkippedCall` so they don't reach this allow-list as
 * false negatives.
 */
function isFrameworkTestCall(
  node: ts.CallExpression,
  allowedRootNames: ReadonlySet<string>,
): boolean {
  const root = getCallRootName(node.expression);
  return root !== null && allowedRootNames.has(root);
}

function getCallRootName(expr: ts.Expression): string | null {
  if (ts.isIdentifier(expr)) {
    return expr.text;
  }
  if (ts.isPropertyAccessExpression(expr)) {
    return getCallRootName(expr.expression);
  }
  if (ts.isCallExpression(expr)) {
    return getCallRootName(expr.expression);
  }
  return null;
}

function isSkippedCall(node: ts.CallExpression): boolean {
  // Recognise `it.skip`, `test.skip`, `describe.skip`, `.todo`, and
  // the table-driven `.each.skip(...)` variants. `.only` is NOT
  // skipped — those tests still run.
  let expr: ts.Expression = node.expression;
  while (ts.isPropertyAccessExpression(expr) || ts.isCallExpression(expr)) {
    if (ts.isPropertyAccessExpression(expr)) {
      if (expr.name.text === 'skip' || expr.name.text === 'todo') return true;
      expr = expr.expression;
    } else {
      expr = expr.expression;
    }
  }
  return false;
}

function stringLiteralValue(arg: ts.Node | undefined): string | null {
  if (!arg) return null;
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) return arg.text;
  if (ts.isTemplateExpression(arg)) {
    // Concatenate the literal portions; ID is unlikely to live inside
    // a ${expr} interpolation anyway. This is best-effort.
    return arg.head.text + arg.templateSpans.map((s) => s.literal.text).join('');
  }
  return null;
}

function extractIdsFromString(
  s: string,
  rel: string,
  out: Map<string, Set<string>>,
): void {
  // Spec author convention: dot-list shorthand `TC-5·32·41` packs
  // multiple TC IDs into one token (· = Korean middle dot, U+00B7).
  // Expand to `TC-5 TC-32 TC-41` before citation extraction so each
  // resolves individually.
  const expanded = s.replace(
    /\b([A-Z]+(?:-[A-Z]+)*-)(\d+(?:\.\d+)*)((?:·\d+(?:\.\d+)*)+)/g,
    (_, prefix, first, tail) => {
      const tails = tail.replace(/·(\d+(?:\.\d+)*)/g, ` ${prefix}$1`);
      return prefix + first + tails;
    },
  );
  const re = new RegExp(CITATION_RE.source, CITATION_RE.flags);
  for (const m of expanded.matchAll(re)) {
    const id = m[1];
    let set = out.get(id);
    if (!set) {
      set = new Set();
      out.set(id, set);
    }
    set.add(rel);
  }
}
