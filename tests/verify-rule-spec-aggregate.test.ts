import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';
import { rollup } from '../src/verify/id-rules/spec.js';

/**
 * US-V11 — R/F/S aggregation.
 *
 * R{n} rolls up its AC + F children. F{n}.{m} rolls up its S children.
 * S{n}.{m}.{l} leaves use the path rule directly.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-rfs-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('rollup() (US-V11)', () => {
  const stub = (
    reality:
      | 'Built'
      | 'Partial'
      | 'NotBuilt'
      | 'ManualReview'
      | 'ManualReview-Stale',
  ) => ({
    id: 'x',
    idType: 'AC' as const,
    intent: 'Approved' as const,
    reality,
    evidence: [],
    confidence: 'high' as const,
    rule: 'stub',
  });

  it('all Built → Built', () => {
    expect(rollup([stub('Built'), stub('Built')]).reality).toBe('Built');
  });
  it('all NotBuilt → NotBuilt', () => {
    expect(rollup([stub('NotBuilt'), stub('NotBuilt')]).reality).toBe('NotBuilt');
  });
  it('mixed → Partial', () => {
    expect(rollup([stub('Built'), stub('NotBuilt')]).reality).toBe('Partial');
  });
  it('empty → ManualReview', () => {
    expect(rollup([]).reality).toBe('ManualReview');
  });
  it('ManualReview-Stale propagates only when no concrete children', () => {
    // Architect feedback: a single stale ADR sign-off shouldn't poison
    // an otherwise-Built R. With at least one concrete child state the
    // rollup softens to Partial.
    expect(rollup([stub('Built'), stub('ManualReview-Stale')]).reality).toBe(
      'Partial',
    );
    // Pure-stale aggregation still propagates.
    expect(rollup([stub('ManualReview-Stale')]).reality).toBe('ManualReview-Stale');
  });
});

describe('R/F aggregation pass (US-V11)', () => {
  it('aggregates F from its S children', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'a.ts'), '// ok', 'utf8');
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: r1',
        '',
        '### F1.1: f1.1',
        '',
        '#### S1.1.1: s with file',
        '',
        '`src/a.ts` is the implementation.',
        '',
        '#### S1.1.2: s without file',
        '',
        'No paths declared.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    // S1.1.1 has a real file → Built. S1.1.2 has no paths → ManualReview.
    // F1.1 aggregates: Built + ManualReview → ManualReview-Stale? Actually
    // ManualReview (no Stale). The rollup logic returns ManualReview when
    // pure-ManualReview, but here we have Built + ManualReview = mixed.
    // Per rollup: manualReview > 0 → propagate only when no built/partial/notBuilt;
    // otherwise mixed → Partial.
    expect(r.results.get('S1.1.1')?.reality).toBe('Built');
    expect(r.results.get('S1.1.2')?.reality).toBe('ManualReview');
    expect(r.results.get('F1.1')?.reality).toBe('Partial');
  });

  it('R aggregates over both AC and F children', async () => {
    await mkdir(join(dir, 'tests'), { recursive: true });
    await writeFile(
      join(dir, 'tests', 'a.test.ts'),
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('AC-R2-1: given x when y then z', () => { it('runs', () => { expect(1 + 1).toBe(2); }); });\n",
      'utf8',
    );
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R2: r2',
        '',
        '- **AC-R2-1:** GIVEN x WHEN y THEN z',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    // AC-R2-1 is ManualReview-Stale (test refs but skipTests=true). R2
    // rolls up over [AC-R2-1] which propagates ManualReview-Stale.
    expect(r.results.get('AC-R2-1')?.reality).toBe('ManualReview-Stale');
    expect(r.results.get('R2')?.reality).toBe('ManualReview-Stale');
    expect(r.results.get('R2')?.rule).toBe('rfs-aggregate');
  });
});
