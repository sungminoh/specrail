import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readCache,
  writeCache,
  isCacheValid,
  cachePath,
  hashShort,
  cacheToResult,
} from '../src/verify/cache.js';
import type { VerifyResult } from '../src/verify/types.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-cache-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function syntheticResult(): VerifyResult {
  return {
    timestamp: '2026-05-14T10:00:00.000Z',
    projectRoot: dir,
    results: new Map([
      [
        'AC-R1-1',
        {
          id: 'AC-R1-1',
          idType: 'AC' as const,
          intent: 'Approved' as const,
          reality: 'Built' as const,
          evidence: [{ kind: 'test-pass', path: 'tests/x.test.ts' }],
          confidence: 'high' as const,
          rule: 'test-grep',
        },
      ],
    ]),
    initialized: true,
  };
}

describe('verification cache (US-V14)', () => {
  it('returns null when no cache exists', async () => {
    expect(await readCache(dir)).toBeNull();
  });

  it('writeCache + readCache round-trips the result', async () => {
    await writeCache(dir, syntheticResult(), 'hash-abc');
    const cache = await readCache(dir);
    expect(cache).not.toBeNull();
    expect(cache?.results['AC-R1-1']?.reality).toBe('Built');
    expect(cache?.vitestRunHash).toBe('hash-abc');
  });

  it('cachePath returns the expected location', () => {
    expect(cachePath(dir)).toBe(join(dir, '.specrail-cache', 'verification.json'));
  });

  it('hashShort is stable for the same input', () => {
    expect(hashShort('alpha')).toBe(hashShort('alpha'));
    expect(hashShort('alpha')).not.toBe(hashShort('beta'));
    expect(hashShort('alpha').length).toBe(16);
  });

  it('isCacheValid: valid when no source files have been modified', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'a.ts'), 'old', 'utf8');
    await writeCache(dir, syntheticResult());
    const cache = await readCache(dir);
    expect(cache).not.toBeNull();
    expect(await isCacheValid(dir, cache!)).toBe(true);
  });

  it('isCacheValid: invalid when a source file is modified after cache', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'a.ts'), 'old', 'utf8');
    await writeCache(dir, syntheticResult());
    const cache = await readCache(dir);
    // Touch the file so mtime jumps past cache time
    await new Promise((r) => setTimeout(r, 20));
    await writeFile(join(dir, 'src', 'a.ts'), 'new', 'utf8');
    expect(await isCacheValid(dir, cache!)).toBe(false);
  });

  it('cacheToResult reconstructs the VerifyResult shape', async () => {
    await writeCache(dir, syntheticResult());
    const cache = await readCache(dir);
    const result = cacheToResult(cache!, dir);
    expect(result.initialized).toBe(true);
    expect(result.results.get('AC-R1-1')?.reality).toBe('Built');
  });
});
