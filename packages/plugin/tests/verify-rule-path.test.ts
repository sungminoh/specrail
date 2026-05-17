import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

/**
 * US-V05 — path-existence rule for ARCH/EXT.
 *
 * Spec defines ARCH via heading or table-row body that mentions one or
 * more repository paths. Rule reads a few lines around the definition
 * and checks pathExists for each token.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-path-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('path-exists rule (US-V05)', () => {
  it('Built when all path tokens exist', async () => {
    await mkdir(join(dir, 'src', 'hook'), { recursive: true });
    await writeFile(join(dir, 'src', 'hook', 'pre-commit.ts'), '// ok', 'utf8');
    await writeSpec(
      '08-arch.md',
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## ARCH-3: Hook Scripts',
        '',
        '`src/hook/pre-commit.ts` enforces gate.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ARCH-3');
    expect(ev?.reality).toBe('Built');
    expect(ev?.rule).toBe('path-exists');
    expect(ev?.evidence.some((e) => e.kind === 'file-exists' && e.path === 'src/hook/pre-commit.ts')).toBe(true);
  });

  it('NotBuilt when every path token is missing', async () => {
    await writeSpec(
      '08-arch.md',
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## ARCH-99: Phantom container',
        '',
        '`src/never/exists.ts` is the host.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ARCH-99');
    expect(ev?.reality).toBe('NotBuilt');
    expect(ev?.evidence.some((e) => e.kind === 'file-missing')).toBe(true);
  });

  it('Partial when some paths resolve and some do not', async () => {
    await mkdir(join(dir, 'src', 'a'), { recursive: true });
    await writeFile(join(dir, 'src', 'a', 'real.ts'), '// ok', 'utf8');
    await writeSpec(
      '08-arch.md',
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## ARCH-5: Mixed container',
        '',
        '`src/a/real.ts` and `src/b/missing.ts`.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ARCH-5');
    expect(ev?.reality).toBe('Partial');
  });

  it('ManualReview when no path tokens are found in the window', async () => {
    await writeSpec(
      '08-arch.md',
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## ARCH-1: Abstract container',
        '',
        'No path declared — purely conceptual.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('ARCH-1');
    expect(ev?.reality).toBe('ManualReview');
    expect(ev?.evidence.some((e) => e.kind === 'no-path-tokens')).toBe(true);
  });

  it('classifies EXT-{n} the same way', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'client.ts'), '// ok', 'utf8');
    await writeSpec(
      '08-arch.md',
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## EXT-1: Third-party service',
        '',
        'Implemented via `src/client.ts`.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('EXT-1');
    expect(ev?.reality).toBe('Built');
    expect(ev?.rule).toBe('path-exists');
  });
});
