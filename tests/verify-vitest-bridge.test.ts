import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseVitestJson, scanTestFilesForIds } from '../src/verify/vitest-bridge.js';

/**
 * US-V02 — vitest bridge.
 *
 * Runs are exercised indirectly: we test the pure JSON parser with a
 * synthetic vitest result payload, and we test the file-scanner with
 * temp test files. The full `runVitest()` path is integration-tested
 * once a real rule needs it (US-V04+).
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-vbridge-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('parseVitestJson() (US-V02)', () => {
  it('returns an empty map for malformed input', () => {
    expect(parseVitestJson(null, dir).size).toBe(0);
    expect(parseVitestJson({}, dir).size).toBe(0);
    expect(parseVitestJson({ testResults: 'nope' }, dir).size).toBe(0);
  });

  it('maps vitest result entries to TestFileOutcomes', () => {
    const payload = {
      testResults: [
        {
          name: join(dir, 'tests', 'pass.test.ts'),
          assertionResults: [
            { status: 'passed' },
            { status: 'passed' },
            { status: 'passed' },
          ],
        },
        {
          name: join(dir, 'tests', 'mix.test.ts'),
          assertionResults: [
            { status: 'passed' },
            { status: 'failed' },
            { status: 'skipped' },
          ],
        },
      ],
    };
    const out = parseVitestJson(payload, dir);
    expect(out.size).toBe(2);
    const pass = out.get('tests/pass.test.ts');
    expect(pass?.passed).toBe(3);
    expect(pass?.failed).toBe(0);
    expect(pass?.allGreen).toBe(true);
    const mix = out.get('tests/mix.test.ts');
    expect(mix?.passed).toBe(1);
    expect(mix?.failed).toBe(1);
    expect(mix?.skipped).toBe(1);
    expect(mix?.allGreen).toBe(false);
  });

  it('treats 0-passed-0-failed (empty file) as not-allGreen', () => {
    const payload = {
      testResults: [
        { name: join(dir, 'tests', 'empty.test.ts'), assertionResults: [] },
      ],
    };
    const out = parseVitestJson(payload, dir);
    expect(out.get('tests/empty.test.ts')?.allGreen).toBe(false);
  });
});

describe('scanTestFilesForIds() (US-V02)', () => {
  async function writeTest(rel: string, body: string) {
    const full = join(dir, rel);
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, body, 'utf8');
  }

  it('returns an empty map when tests/ is missing', async () => {
    const out = await scanTestFilesForIds(dir);
    expect(out.size).toBe(0);
  });

  it('extracts IDs that appear in describe/it/test first-argument strings', async () => {
    await writeTest(
      'tests/a.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        'describe("AC-R1-1: foo", () => { it("checks AC-R1-1", () => { expect(1 + 1).toBe(2); }); });',
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R1-1')?.has('tests/a.test.ts')).toBe(true);
  });

  it('does NOT extract IDs that appear only in comments (architect round-N attack vector #1)', async () => {
    await writeTest(
      'tests/b.test.ts',
      '// covers AC-R1-2 and INV-3\nimport {} from "x";\n' +
        'describe("unrelated", () => { it("trivial", () => {}); });\n',
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R1-2')).toBeUndefined();
    expect(out.get('INV-3')).toBeUndefined();
  });

  it('does NOT extract IDs that appear inside assertion string arguments', async () => {
    // The exact case from the live dogfood: AC-R1-1 in `.test('AC-R1-1')`
    // expression inside an assertion is NOT a test name.
    await writeTest(
      'tests/c.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('parseArgs', () => {\n" +
        "  it('rejects unknown ids', () => {\n" +
        "    expect(filter.test('AC-R1-1')).toBe(false);\n" +
        "  });\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R1-1')).toBeUndefined();
  });

  it('does NOT extract IDs from skipped/todo tests', async () => {
    await writeTest(
      'tests/d.test.ts',
      "import { describe, it, test } from 'vitest';\n" +
        "describe('s', () => {\n" +
        "  it.skip('AC-R5-1: not yet', () => {});\n" +
        "  test.todo('AC-R5-2: planned');\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R5-1')).toBeUndefined();
    expect(out.get('AC-R5-2')).toBeUndefined();
  });

  it('extracts from `.only` (those tests do run)', async () => {
    await writeTest(
      'tests/e.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('s', () => { it.only('AC-R6-1: focused', () => { expect(1 + 1).toBe(2); }); });\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R6-1')?.has('tests/e.test.ts')).toBe(true);
  });

  it('extracts from `.each` table-driven tests', async () => {
    await writeTest(
      'tests/f.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('s', () => { it.each([1,2])('AC-R7-1 case %s', () => { expect(1 + 1).toBe(2); }); });\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R7-1')?.has('tests/f.test.ts')).toBe(true);
  });

  it('honours nested test directories', async () => {
    await writeTest(
      'tests/unit/x.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('TC-42: scenario', () => { it('runs', () => { expect(1 + 1).toBe(2); }); });\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('TC-42')?.has('tests/unit/x.test.ts')).toBe(true);
  });

  it('REJECTS tautological assertions like expect(1).toBe(1) (architect round-N+2)', async () => {
    // expect(literal).toBe(samelitral) doesn't test behaviour.
    await writeTest(
      'tests/taut.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('s', () => {\n" +
        "  it('AC-R7-99: vacuous numeric', () => { expect(1).toBe(1); });\n" +
        "  it('AC-R7-98: vacuous boolean', () => { expect(true).toBe(true); });\n" +
        "  it('AC-R7-97: vacuous string', () => { expect('a').toBe('a'); });\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R7-99')).toBeUndefined();
    expect(out.get('AC-R7-98')).toBeUndefined();
    expect(out.get('AC-R7-97')).toBeUndefined();
  });

  it('REJECTS expect.assertions(0) configurator (architect round-N+2)', async () => {
    await writeTest(
      'tests/zero-assert.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('s', () => {\n" +
        "  it('AC-R7-96: zero assertions configured', () => { expect.assertions(0); });\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R7-96')).toBeUndefined();
  });

  it('ACCEPTS expect(varname).toBe(varname) (cannot statically prove tautology)', async () => {
    // Identifiers might point at different values at runtime — only
    // structural-literal equality counts as tautological.
    await writeTest(
      'tests/non-taut.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('s', () => {\n" +
        "  it('AC-R7-95: variable comparison', () => { const x = computeX(); expect(x).toBe(x); });\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R7-95')?.has('tests/non-taut.test.ts')).toBe(true);
  });

  it('ACCEPTS expect(literal).toBe(differentLiteral) (real assertion)', async () => {
    await writeTest(
      'tests/real.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('s', () => {\n" +
        "  it('AC-R7-94: 1 vs 2', () => { expect(1 + 1).toBe(2); });\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R7-94')?.has('tests/real.test.ts')).toBe(true);
  });

  it('REJECTS test name without assertion body (architect AV2)', async () => {
    // Round-N+1: an `it('AC-X', () => {})` with no body assertion
    // claimed coverage. The scanner now requires at least one
    // `expect(...)` call somewhere under the it/test/describe tree.
    await writeTest(
      'tests/empty-body.test.ts',
      "import { describe, it } from 'vitest';\n" +
        "describe('s', () => {\n" +
        "  it('AC-R8-99: empty body claims coverage', () => {});\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R8-99')).toBeUndefined();
  });

  it('CREDITS test name when body has at least one expect()', async () => {
    await writeTest(
      'tests/asserted.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('s', () => {\n" +
        "  it('AC-R8-98: has real expect', () => { expect(1 + 1).toBe(2); });\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R8-98')?.has('tests/asserted.test.ts')).toBe(true);
  });

  it('describe block credits its name when ANY nested it has expect', async () => {
    await writeTest(
      'tests/nested.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('AC-R8-97: suite name with nested assert', () => {\n" +
        "  it('runs', () => { expect(1 + 1).toBe(2); });\n" +
        "});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R8-97')?.has('tests/nested.test.ts')).toBe(true);
  });

  it('REJECTS files with class test shadow (architect round-N+2)', async () => {
    await writeTest(
      'tests/class-shadow.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "class test { run(name: string, fn: () => void) { fn(); } }\n" +
        "new test().run('AC-R9-93: class shadow attack', () => { expect(1 + 1).toBe(2); });\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R9-93')).toBeUndefined();
  });

  it('REJECTS files with locally-defined function test() (architect AV1)', async () => {
    // Round-N+1 attack: drop `function test(){...}` in a test file and
    // claim coverage without ever invoking vitest. Resolver-aware
    // scanner refuses to credit files that shadow the framework name.
    await writeTest(
      'tests/shadow.test.ts',
      "import { describe } from 'vitest';\n" +
        "function test(name: string, fn: () => void) { /* swallow */ }\n" +
        "test('AC-R9-99: fake covers this', () => {});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R9-99')).toBeUndefined();
  });

  it('REJECTS files that import test from a non-vitest runner (architect AV1)', async () => {
    // `import { test } from 'node:test'` runs against Node's built-in
    // runner, not vitest. The scanner now requires the framework name
    // to come from a vitest import.
    await writeTest(
      'tests/wrong-runner.test.ts',
      "import { test } from 'node:test';\n" +
        "test('AC-R9-98: not really vitest', () => {});\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R9-98')).toBeUndefined();
  });

  it('REJECTS test files with no vitest import at all', async () => {
    await writeTest(
      'tests/noimport.test.ts',
      "describe('AC-R9-97 looks like a test', () => { it('AC-R9-97', () => {}); });\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R9-97')).toBeUndefined();
  });

  it('HONOURS aliased vitest imports', async () => {
    // `import { describe as desc } from 'vitest'` is a real legitimate
    // pattern. The scanner allows it because the local name is now in
    // the allowedRootNames set.
    await writeTest(
      'tests/aliased.test.ts',
      "import { describe as desc, it as ut, expect } from 'vitest';\n" +
        "desc('AC-R9-96: aliased describe', () => { ut('AC-R9-95: aliased it', () => { expect(1 + 1).toBe(2); }); });\n",
    );
    const out = await scanTestFilesForIds(dir);
    expect(out.get('AC-R9-96')?.has('tests/aliased.test.ts')).toBe(true);
    expect(out.get('AC-R9-95')?.has('tests/aliased.test.ts')).toBe(true);
  });

  it('skips non-test files', async () => {
    await writeTest('tests/notes.md', 'TC-99 mentioned but not a test');
    await writeTest('tests/code.ts', 'export const x = "TC-99 inside helper";');
    const out = await scanTestFilesForIds(dir);
    expect(out.get('TC-99')).toBeUndefined();
  });
});
