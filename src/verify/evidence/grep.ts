/**
 * Filesystem grep helpers used by verification rules.
 *
 * Pure read-only file walkers. Errors (missing dir, unreadable file) are
 * swallowed and yield empty results so rules never throw.
 */

import { readdir, readFile } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';

export interface GrepHit {
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
}

async function* walkFiles(dir: string): AsyncGenerator<string> {
  let entries: Dirent[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Dirent[];
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    if (ent.name === 'node_modules' || ent.name === 'dist') continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walkFiles(p);
    } else if (ent.isFile()) {
      yield p;
    }
  }
}

/**
 * Scan every file under `searchRoot` for the given regex. Returns the
 * relative-to-projectRoot paths and the matching line. Caller is
 * responsible for filtering by extension if needed.
 */
export async function scanForRegex(
  projectRoot: string,
  searchRoot: string,
  regex: RegExp,
  options: { extensions?: readonly string[] } = {},
): Promise<GrepHit[]> {
  const hits: GrepHit[] = [];
  const exts = options.extensions;
  for await (const file of walkFiles(join(projectRoot, searchRoot))) {
    if (exts && !exts.some((e) => file.endsWith(e))) continue;
    let content: string;
    try {
      content = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const re = new RegExp(regex.source, regex.flags.replace('g', ''));
      if (re.test(line)) {
        hits.push({
          file: relative(projectRoot, file),
          line: idx + 1,
          snippet: line.length > 200 ? line.slice(0, 197) + '...' : line,
        });
      }
    });
  }
  return hits;
}

/**
 * Convenience: scan for occurrences of a specific spec ID as a whole
 * word. Returns hit-list (multiple hits per file possible).
 */
export async function scanForId(
  projectRoot: string,
  searchRoot: string,
  id: string,
  options: { extensions?: readonly string[] } = {},
): Promise<GrepHit[]> {
  // Match the ID with word-boundary on both sides; escape any regex-special chars.
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`);
  return scanForRegex(projectRoot, searchRoot, re, options);
}
