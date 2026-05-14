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

  it('extracts IDs from test file content via CITATION_RE', async () => {
    await writeTest(
      'tests/a.test.ts',
      'describe("AC-R1-1: foo", () => { it("checks AC-R1-1", () => {}); });',
    );
    await writeTest(
      'tests/b.test.ts',
      '// covers AC-R1-2 and INV-3\nimport {} from "x";\n',
    );

    const out = await scanTestFilesForIds(dir);

    expect(out.get('AC-R1-1')?.has('tests/a.test.ts')).toBe(true);
    expect(out.get('AC-R1-2')?.has('tests/b.test.ts')).toBe(true);
    expect(out.get('INV-3')?.has('tests/b.test.ts')).toBe(true);
  });

  it('honours nested test directories', async () => {
    await writeTest('tests/unit/x.test.ts', '// TC-42\n');
    const out = await scanTestFilesForIds(dir);
    expect(out.get('TC-42')?.has('tests/unit/x.test.ts')).toBe(true);
  });

  it('skips non-test files', async () => {
    await writeTest('tests/notes.md', 'TC-99 mentioned but not a test');
    await writeTest('tests/code.ts', 'export const x = "TC-99 inside helper";');
    const out = await scanTestFilesForIds(dir);
    expect(out.get('TC-99')).toBeUndefined();
  });
});
