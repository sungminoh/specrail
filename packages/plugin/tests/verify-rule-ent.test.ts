import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

/**
 * US-V06 — ENT symbol-existence rule.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-ent-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('ent-symbol rule (US-V06)', () => {
  it('Built when an interface with the entity name exists', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(
      join(dir, 'src', 'types.ts'),
      'export interface Project { id: string }\n',
      'utf8',
    );
    await writeSpec(
      '04-domain.md',
      [
        '---',
        'phase: 4',
        'status: Approved',
        '---',
        '',
        '### ENT-Project',
        '',
        'body',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ENT-Project');
    expect(ev?.reality).toBe('Built');
    expect(ev?.rule).toBe('ent-symbol');
    expect(ev?.evidence.some((e) => e.kind === 'symbol-found')).toBe(true);
  });

  it('NotBuilt when no matching symbol exists', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'types.ts'), '// nothing here', 'utf8');
    await writeSpec(
      '04-domain.md',
      [
        '---',
        'phase: 4',
        'status: Approved',
        '---',
        '',
        '### ENT-Phantom',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ENT-Phantom');
    expect(ev?.reality).toBe('NotBuilt');
    expect(ev?.evidence.some((e) => e.kind === 'symbol-missing')).toBe(true);
  });

  it('handles ENT-Name with trailing parenthesised tail', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(
      join(dir, 'src', 'change.ts'),
      'export type Change = { topic: string }\n',
      'utf8',
    );
    await writeSpec(
      '04-domain.md',
      [
        '---',
        'phase: 4',
        'status: Approved',
        '---',
        '',
        '### ENT-Change (DELTA mode)',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ENT-Change');
    expect(ev?.reality).toBe('Built');
  });

  it('ManualReview for IDs whose entity name is unparseable', async () => {
    // Synthetic case — the citation pattern allows ENT-[A-Za-z0-9_]+ so
    // this is mostly defensive against future format drift.
    await writeSpec(
      '04-domain.md',
      [
        '---',
        'phase: 4',
        'status: Approved',
        '---',
        '',
        '### ENT-12345',  // starts with a digit → unparseable
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ENT-12345');
    expect(ev?.reality).toBe('ManualReview');
  });
});
