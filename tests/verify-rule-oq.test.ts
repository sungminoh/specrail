import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-oq-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('oq-resolution rule (US-V10)', () => {
  it('Built when the row references an ADR resolving it', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Resolution |',
        '|---|---|---|',
        '| OQ-1-1 | something | ADR-7 |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('OQ-1-1');
    expect(ev?.reality).toBe('Built');
    expect(ev?.rule).toBe('oq-resolution');
  });

  it('Built when Resolved/DEFERRED row carries a structural anchor (ADR, path, or milestone)', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-1-2 | thing 1 | Resolved — see ADR-7 |',
        '| OQ-1-3 | thing 2 | DEFERRED to M3 cycle |',
        '| OQ-1-4 | thing 3 | Resolved — `src/lint/secret.ts` |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('OQ-1-2')?.reality).toBe('Built'); // ADR ref
    expect(r.results.get('OQ-1-3')?.reality).toBe('Built'); // milestone ref
    expect(r.results.get('OQ-1-4')?.reality).toBe('Built'); // path ref
  });

  it('ManualReview when Resolved/DEFERRED row has NO anchor (architect round-N+2)', async () => {
    // The round-N+1 letter-count check passed `DEFERRED xxxxx` because
    // it counted bytes. The honest check requires a STRUCTURAL anchor:
    // a real ID/file/milestone reference — not 5 letters of padding.
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-77-1 | self-defer 1 | DEFERRED xxxxx |',
        '| OQ-77-2 | self-defer 2 | DEFERRED later |',
        '| OQ-77-3 | self-defer 3 | DEFERRED to next cycle |',
        '| OQ-77-4 | self-defer 4 | Resolved — see ADR notes |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('OQ-77-1')?.reality).toBe('ManualReview');
    expect(r.results.get('OQ-77-2')?.reality).toBe('ManualReview');
    expect(r.results.get('OQ-77-3')?.reality).toBe('ManualReview');
    expect(r.results.get('OQ-77-4')?.reality).toBe('ManualReview'); // "ADR" alone, no number
  });

  it('NotBuilt when the row says OPEN', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-9-1 | future thing | OPEN |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('OQ-9-1')?.reality).toBe('NotBuilt');
  });

  it('ManualReview when DEFERRED + random non-letter padding (round-N+1)', async () => {
    // Architect round-N+1: the previous 10-char check passed
    // `DEFERRED ttttttttt` (random chars) and `DEFERRED ||||||||||||` (pipes).
    // The honest check counts Unicode letters.
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-99-1 | random padding | DEFERRED ||||||||||||||||||||||||| |',
        '| OQ-99-2 | numeric padding | DEFERRED 12345678901234567890 |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('OQ-99-1')?.reality).toBe('ManualReview');
    expect(r.results.get('OQ-99-2')?.reality).toBe('ManualReview');
  });

  it('Built when DEFERRED rationale has Korean letters AND a structural anchor', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-99-3 | korean + milestone | DEFERRED → M5 향후 cycle |',
        '| OQ-99-4 | korean + ADR | Resolved → ADR-9 결정됨 |',
        '| OQ-99-5 | korean alone (no anchor) | DEFERRED → 향후 cycle |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('OQ-99-3')?.reality).toBe('Built');
    expect(r.results.get('OQ-99-4')?.reality).toBe('Built');
    expect(r.results.get('OQ-99-5')?.reality).toBe('ManualReview'); // no anchor
  });

  it('ManualReview when DEFERRED alone (self-defer attack — round-N P2 fix)', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-8-1 | bare deferral | DEFERRED |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('OQ-8-1');
    expect(ev?.reality).toBe('ManualReview');
    expect(ev?.evidence[0]?.note).toContain('keyword without rationale');
  });

  it('Built when DEFERRED has substantive rationale (10+ chars)', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-8-2 | needs deferral with reason | DEFERRED — v5+ cycle revisit |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('OQ-8-2')?.reality).toBe('Built');
  });

  it('ManualReview when no status keyword recognised', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Q ID | Question | Status |',
        '|---|---|---|',
        '| OQ-2-1 | ambiguous | maybe later |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('OQ-2-1')?.reality).toBe('ManualReview');
  });
});
