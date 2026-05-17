/**
 * Verification cache — stores the last verifier run output at
 * `.specrail-cache/verification.json`. Re-used between invocations to
 * skip the expensive vitest run when source state hasn't changed.
 *
 * Invalidation: any file under src/, tests/, docs/spec/ whose mtime is
 * newer than the cache's timestamp triggers a recompute. The
 * `vitestRunHash` is recorded but not used for invalidation; it's there
 * so external tooling can correlate runs.
 */

import { readFile, writeFile, mkdir, stat, readdir, rm } from 'node:fs/promises';
import type { Dirent, Stats } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import type { IdEvidence, VerifyResult } from './types.js';

const CACHE_DIR = '.specrail-cache';
const CACHE_FILE = 'verification.json';
// Expanded per architect feedback: any directory whose contents can
// change a verifier verdict must invalidate the cache.
const WATCHED_ROOTS = [
  'src',
  'tests',
  'docs/spec',
  'schemas',
  'skills',
  '.github',
] as const;

export interface CacheFile {
  readonly version: 1;
  readonly timestamp: string;
  readonly sourceMtimeMax: number;
  readonly vitestRunHash: string;
  readonly results: Record<string, IdEvidence>;
}

export async function readCache(projectRoot: string): Promise<CacheFile | null> {
  const path = join(projectRoot, CACHE_DIR, CACHE_FILE);
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as CacheFile;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCache(
  projectRoot: string,
  result: VerifyResult,
  vitestRunHash = '',
): Promise<void> {
  const dirPath = join(projectRoot, CACHE_DIR);
  await mkdir(dirPath, { recursive: true });
  const sourceMtimeMax = await maxSourceMtime(projectRoot);
  const file: CacheFile = {
    version: 1,
    timestamp: result.timestamp,
    sourceMtimeMax,
    vitestRunHash,
    results: Object.fromEntries(result.results),
  };
  await writeFile(
    join(dirPath, CACHE_FILE),
    JSON.stringify(file, null, 2),
    'utf8',
  );
}

/** Returns true iff the cache is current — no source file has been
 *  modified since the cache was written. */
export async function isCacheValid(
  projectRoot: string,
  cache: CacheFile,
): Promise<boolean> {
  const current = await maxSourceMtime(projectRoot);
  return current <= cache.sourceMtimeMax;
}

/** Walk WATCHED_ROOTS and return the maximum mtime epoch millis. */
async function maxSourceMtime(projectRoot: string): Promise<number> {
  let max = 0;
  for (const rel of WATCHED_ROOTS) {
    const abs = join(projectRoot, rel);
    max = Math.max(max, await walkMaxMtime(abs));
  }
  return max;
}

async function walkMaxMtime(absDir: string): Promise<number> {
  let max = 0;
  let entries: Dirent[];
  try {
    entries = (await readdir(absDir, { withFileTypes: true })) as Dirent[];
  } catch {
    return 0;
  }
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    if (ent.name === 'node_modules' || ent.name === 'dist') continue;
    const p = join(absDir, ent.name);
    if (ent.isDirectory()) {
      max = Math.max(max, await walkMaxMtime(p));
    } else if (ent.isFile()) {
      let s: Stats;
      try {
        s = await stat(p);
      } catch {
        continue;
      }
      max = Math.max(max, s.mtimeMs);
    }
  }
  return max;
}

/** Hash any string into a stable short identifier. Used for
 *  vitestRunHash and similar opaque identifiers. */
export function hashShort(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/** Convert a CacheFile back into the structural VerifyResult shape. */
export function cacheToResult(cache: CacheFile, projectRoot: string): VerifyResult {
  const results = new Map<string, IdEvidence>();
  for (const [k, v] of Object.entries(cache.results)) results.set(k, v);
  return {
    timestamp: cache.timestamp,
    projectRoot,
    results,
    initialized: true,
  };
}

/** Path the cache lives at (exposed for cleanup / debugging). */
export function cachePath(projectRoot: string): string {
  return join(projectRoot, CACHE_DIR, CACHE_FILE);
}

/**
 * Remove the entire `.specrail-cache/` directory for this project. Returns
 * `true` when something was deleted, `false` when nothing was present.
 *
 * Use this when a stale cache survives a real change — e.g. when the user
 * changes a verifier rule and wants to force a recompute without having
 * to bump every watched file's mtime.
 */
export async function clearCache(projectRoot: string): Promise<boolean> {
  const dirPath = join(projectRoot, CACHE_DIR);
  try {
    await stat(dirPath);
  } catch {
    return false;
  }
  await rm(dirPath, { recursive: true, force: true });
  return true;
}

