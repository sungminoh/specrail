import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

/**
 * US-V04 — test-grep rule (AC / TC / INV / EDGE).
 *
 * Drives the runner with `skipTests: true` so we can simulate vitest
 * outcomes without actually running vitest. Each test constructs a tmp
 * project with a spec definition and a test fixture, then invokes
 * `verify()`. The shared rule classifies based on the testFileIds map +
 * vitest outcomes that the runner builds from the synthetic test files.
 *
 * Because `skipTests: true` means vitest does NOT run, the rule sees a
 * `ran=false` vitest result and the expected behaviour is
 * `ManualReview-Stale` (grep evidence, no pass/fail signal). To exercise
 * the Built/Partial paths we inject a vitest-result file by running
 * vitest on the tmp project for real — that path is reserved for the
 * full integration test in US-V18. For unit-level coverage of the rule
 * itself we test the no-ref / ManualReview-Stale paths here.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-grep-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  await mkdir(join(dir, 'tests'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}
async function writeTest(rel: string, content: string) {
  await writeFile(join(dir, 'tests', rel), content, 'utf8');
}

describe('test-grep rule (US-V04)', () => {
  it('AC with no test reference → NotBuilt', async () => {
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: example',
        '',
        '- **AC-R1-1:** GIVEN x WHEN y THEN z',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('AC-R1-1');
    expect(ev?.reality).toBe('NotBuilt');
    expect(ev?.rule).toBe('test-grep');
    expect(ev?.evidence[0]?.kind).toBe('no-test-ref');
  });

  it('AC with test reference but no vitest run → ManualReview-Stale', async () => {
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: example',
        '',
        '- **AC-R1-2:** GIVEN x WHEN y THEN z',
      ].join('\n'),
    );
    await writeTest('a.test.ts', '// covers AC-R1-2\n');

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('AC-R1-2');
    expect(ev?.reality).toBe('ManualReview-Stale');
    expect(ev?.rule).toBe('test-grep');
    expect(ev?.evidence[0]?.path).toBe('tests/a.test.ts');
  });

  it('classifies TC, INV, EDGE through the same rule', async () => {
    await writeSpec(
      '10-test-strategy.md',
      [
        '---',
        'phase: 10',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| TC ID | Description |',
        '|---|---|',
        '| TC-1 | a TC |',
        '',
        '- **INV-3:** invariant body',
        '',
        '<!-- specrail:deftable -->',
        '| EDGE ID | Edge | TC ID |',
        '|---|---|---|',
        '| EDGE-1 | timestamp boundary | TC-2 |',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    for (const id of ['TC-1', 'INV-3', 'EDGE-1', 'TC-2']) {
      const ev = r.results.get(id);
      expect(ev, `missing classification for ${id}`).toBeDefined();
      expect(ev?.rule).toBe('test-grep');
      expect(ev?.reality).toBe('NotBuilt');
    }
  });
});
