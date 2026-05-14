import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runHook } from '../src/hook/verify-status.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-hook-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('verify-status pre-commit hook (US-V17)', () => {
  it('skips when docs/spec is missing', async () => {
    const fresh = await mkdtemp(join(tmpdir(), 'verify-hook-empty-'));
    try {
      const r = await runHook(fresh);
      expect(r.ok).toBe(true);
      expect(r.message).toContain('skipped');
    } finally {
      await rm(fresh, { recursive: true, force: true });
    }
  });

  it('passes when all path evidence resolves', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'real.ts'), 'export const ok = true;', 'utf8');
    await writeFile(
      join(dir, 'docs', 'spec', '08-arch.md'),
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## ARCH-1: container',
        '',
        '`src/real.ts` is the entry.',
      ].join('\n'),
      'utf8',
    );

    const r = await runHook(dir);
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/0 broken-evidence/);
  });

  it('fails when an ARCH spec references a missing path', async () => {
    await writeFile(
      join(dir, 'docs', 'spec', '08-arch.md'),
      [
        '---',
        'phase: 8',
        'status: Approved',
        '---',
        '',
        '## ARCH-99: phantom',
        '',
        '`src/never/exists.ts` is the entry.',
      ].join('\n'),
      'utf8',
    );

    const r = await runHook(dir);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('ARCH-99');
    expect(r.message).toContain('src/never/exists.ts');
  });

  it('does NOT fail on plain NotBuilt items without broken evidence', async () => {
    await writeFile(
      join(dir, 'docs', 'spec', '03-features.md'),
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
      'utf8',
    );

    const r = await runHook(dir);
    expect(r.ok).toBe(true);
  });
});
