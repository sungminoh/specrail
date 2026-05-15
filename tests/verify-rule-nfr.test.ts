import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

/**
 * US-V08 — NFR family classification.
 *
 * NFRs reuse the test-grep rule. Any NFR-{DOMAIN}-{n} whose ID is
 * referenced in some test file with all assertions passing is Built;
 * NotBuilt otherwise (per US-V04 semantics).
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-nfr-'));
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

describe('NFR rule dispatch (US-V08)', () => {
  it('NFR-PERF / NFR-SEC / NFR-A11Y all route to test-grep rule', async () => {
    await writeSpec(
      '09-nfr.md',
      [
        '---',
        'phase: 9',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| NFR ID | Description |',
        '|---|---|',
        '| NFR-PERF-1 | parse < 500ms |',
        '| NFR-SEC-2 | secret detect |',
        '| NFR-A11Y-3 | keyboard nav |',
      ].join('\n'),
    );
    await writeTest(
      'a.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('NFR-PERF-1: parse <500ms', () => { it('runs', () => { expect(1).toBe(1); }); });\n",
    );
    await writeTest(
      'b.test.ts',
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('NFR-SEC-2: secret detection', () => { it('runs', () => { expect(1).toBe(1); }); });\n",
    );

    const r = await verify(dir, { skipTests: true });

    expect(r.results.get('NFR-PERF-1')?.rule).toBe('test-grep');
    expect(r.results.get('NFR-SEC-2')?.rule).toBe('test-grep');
    expect(r.results.get('NFR-A11Y-3')?.rule).toBe('test-grep');

    // PERF and SEC have test refs (ManualReview-Stale because skipTests).
    expect(r.results.get('NFR-PERF-1')?.reality).toBe('ManualReview-Stale');
    expect(r.results.get('NFR-SEC-2')?.reality).toBe('ManualReview-Stale');
    // A11Y has no test ref → NotBuilt.
    expect(r.results.get('NFR-A11Y-3')?.reality).toBe('NotBuilt');
  });
});
