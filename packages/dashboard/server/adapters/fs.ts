// Filesystem adapter: read phase files, atomic write with mtime guard, watcher kept in watcher.ts.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import writeFileAtomic from 'write-file-atomic';
import { parsePhaseMarkdown, extractDefinedIds, extractIds, extractRefs } from '@specrail/core';
import type { Phase, PhaseNumber } from '@specrail/core';
import { safeJoin } from '../lib/path-allowlist.js';

export class MtimeConflictError extends Error {
  constructor(
    public readonly expected: number,
    public readonly actual: number,
  ) {
    super(`mtime mismatch: expected=${expected} actual=${actual}`);
    this.name = 'MtimeConflictError';
  }
}

const PHASE_FILE_RE = /^(\d{2})-(.+)\.md$/;

export async function readAllPhases(projectRoot: string, projectId: string): Promise<Phase[]> {
  const specDir = safeJoin(projectRoot, 'docs/spec');
  const files = await readdir(specDir);
  const phases: Phase[] = [];
  for (const f of files.sort()) {
    const m = f.match(PHASE_FILE_RE);
    if (!m) continue;
    const num = Number(m[1]);
    if (num < 1 || num > 13) continue;
    const slug = m[2] ?? '';
    const filePath = join(specDir, f);
    const phase = await readPhaseFile(projectRoot, projectId, num as PhaseNumber, slug, filePath);
    phases.push(phase);
  }
  return phases;
}

export async function readPhaseFile(
  projectRoot: string,
  projectId: string,
  number: PhaseNumber,
  slug: string,
  filePath: string,
): Promise<Phase> {
  const raw = await readFile(filePath, 'utf8');
  const s = await stat(filePath);
  const parsed = parsePhaseMarkdown(raw);
  const definedIds = extractDefinedIds(parsed.body);
  // Source-side: pin refs to the first defined id in the file (or a phase pseudo).
  const anchor = definedIds[0] ?? `phase-${number}`;
  const allRefs = extractRefs(parsed.body, { definedIds: new Set(definedIds), from: anchor });
  // Keep all distinct (to, line) entries — these surface dangling targets even when
  // the to-id is mentioned multiple times in the body.
  const refs = allRefs.filter((r) => r.to !== anchor);
  void extractIds;
  return {
    projectId,
    number,
    slug,
    filePath: filePath.replace(projectRoot + '/', '').replace(/\\/g, '/'),
    frontmatter: parsed.frontmatter,
    body: raw,
    parsedIds: definedIds,
    parsedRefs: refs,
    mtimeMs: s.mtimeMs,
  };
}

const recentSelfWrites = new Set<string>();
export function isSelfWrite(absPath: string): boolean {
  const hit = recentSelfWrites.has(absPath);
  if (hit) recentSelfWrites.delete(absPath);
  return hit;
}

export async function writePhaseFile(
  absPath: string,
  newContent: string,
  basedOnMtimeMs: number,
): Promise<{ mtimeMs: number }> {
  try {
    const s = await stat(absPath);
    if (Math.floor(s.mtimeMs) !== Math.floor(basedOnMtimeMs)) {
      throw new MtimeConflictError(basedOnMtimeMs, s.mtimeMs);
    }
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (e instanceof MtimeConflictError) throw e;
    if (err.code !== 'ENOENT') throw e;
    if (basedOnMtimeMs !== 0) throw new MtimeConflictError(basedOnMtimeMs, 0);
  }
  recentSelfWrites.add(absPath);
  await writeFileAtomic(absPath, newContent);
  const s2 = await stat(absPath);
  return { mtimeMs: s2.mtimeMs };
}
