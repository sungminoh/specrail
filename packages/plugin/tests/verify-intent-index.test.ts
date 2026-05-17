import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

/**
 * IntentIndex regression — the two-axis model is honest.
 *
 * Before this fix, every rule hardcoded `intent: 'Approved'`. That made
 * every NotBuilt look like a broken promise even when the phase was
 * still Draft, defeating the purpose of the two-axis model. The runner
 * now builds an IntentIndex from the phase frontmatter `status:` and
 * each rule reads from it.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-intent-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('IntentIndex — intent reflects phase frontmatter status', () => {
  it('Approved frontmatter propagates to every ID defined in that phase', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Approved',
        '---',
        '',
        '## ADR-1: a decision',
        'body',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('ADR-1')?.intent).toBe('Approved');
  });

  it('Draft frontmatter propagates — NotBuilt rows are not lies', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Draft',
        '---',
        '',
        '## ADR-2: still being drafted',
        'body',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ADR-2');
    expect(ev?.intent).toBe('Draft');
    // The reality is whatever the rule says (Built/NotBuilt/etc), but
    // intent must NOT be silently coerced to Approved.
    expect(ev?.intent).not.toBe('Approved');
  });

  it('Empty frontmatter is honoured (not coerced upward)', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Empty',
        '---',
        '',
        '## ADR-3: placeholder',
        'body',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('ADR-3')?.intent).toBe('Empty');
  });

  it('Missing status frontmatter defaults to Draft (charitable, not Approved)', async () => {
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        '---',
        '',
        '## ADR-4: no status field',
        'body',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('ADR-4')?.intent).toBe('Draft');
  });

  it('Different phases can carry different intents in one run', async () => {
    await writeSpec(
      '08-arch.md',
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## ARCH-1: shipped',
        '',
        '`src/never-exists.ts` would be the host.',
      ].join('\n'),
    );
    await writeSpec(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        'status: Draft',
        '---',
        '',
        '## ADR-5: still drafting',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('ARCH-1')?.intent).toBe('Approved');
    expect(r.results.get('ADR-5')?.intent).toBe('Draft');
  });
});
