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
 * Scan every file under `testDir` for spec ID references. Returns a map
 * `id → Set<relative path>` so rules can ask "which test files mention
 * AC-R1-1?". File content is scanned with CITATION_RE (the shared
 * citation regex) — same semantics the graph builder uses.
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
    const re = new RegExp(CITATION_RE.source, CITATION_RE.flags);
    for (const m of content.matchAll(re)) {
      const id = m[1];
      let set = out.get(id);
      if (!set) {
        set = new Set();
        out.set(id, set);
      }
      set.add(rel);
    }
  }

  return out;
}
