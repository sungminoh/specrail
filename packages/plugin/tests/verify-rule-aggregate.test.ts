import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-agg-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('cross-ref aggregation (US-V12)', () => {
  it('PAIN inherits Built from a cited Built R', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'a.ts'), 'export const ok = true;\n', 'utf8');
    await writeSpec(
      '02-pain.md',
      [
        '---',
        'phase: 2',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Pain ID | Description | Solved-by |',
        '|---|---|---|',
        '| PAIN-1 | the pain | R1 |',
      ].join('\n'),
    );
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: solves pain',
        '',
        '#### S1.1.1: leaf with file',
        '',
        '`src/a.ts` implementation.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('PAIN-1')?.reality).toBe('Built');
    expect(r.results.get('PAIN-1')?.evidence.some((e) => e.kind === 'aggregated-from')).toBe(true);
  });

  it('PAIN stays ManualReview when no IDs are cited near it', async () => {
    await writeSpec(
      '02-pain.md',
      [
        '---',
        'phase: 2',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Pain ID | Description |',
        '|---|---|',
        '| PAIN-99 | abstract pain — no solution cited |',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('PAIN-99')?.reality).toBe('ManualReview');
  });

  it('KPI / RISK use the same aggregator', async () => {
    await writeSpec(
      '12-tracker.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| KPI ID | Description | Refs |',
        '|---|---|---|',
        '| KPI-1 | usage metric | OPS-1 |',
        '',
        '<!-- specrail:deftable -->',
        '| RISK ID | Description | Mitigation |',
        '|---|---|---|',
        '| RISK-1 | a risk | NFR-PERF-1 |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('KPI-1')?.rule).toBe('kpi-cross-ref');
    expect(r.results.get('RISK-1')?.rule).toBe('risk-cross-ref');
  });
});

describe('ADR sign-off rule (US-V13)', () => {
  it('No sign-off → ManualReview', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '## ADR-1: stack choice',
        '',
        'body',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ADR-1');
    expect(ev?.reality).toBe('ManualReview');
    expect(ev?.evidence.some((e) => e.kind === 'no-signoff')).toBe(true);
  });

  it('Sign-off without sha/path → Built (best effort)', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '## ADR-2: another',
        '',
        '**Verification:** Manual review by maintainer 2026-05-14',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ADR-2');
    expect(ev?.reality).toBe('Built');
    expect(ev?.evidence.some((e) => e.kind === 'signoff')).toBe(true);
  });

  it('Sign-off with sha:<missing-file> → ManualReview (target missing)', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '## ADR-3: a decision',
        '',
        '**Verification:** Manual review by maintainer 2026-05-14 sha:abc1234 path:src/no/such.ts',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ADR-3');
    expect(ev?.reality).toBe('ManualReview');
  });
});
