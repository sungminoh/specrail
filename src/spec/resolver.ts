// F1.4 ID resolver — valid-list 노출 (AC-R1-2, TC-2)
// Reviewer C6 — 2-pass 전략:
//   M1: file-scan stub (이 파일)
//   M2 T2.1b: graph 기반으로 교체

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const ID_PATTERNS = [
  /\b([RFS]\d+(?:\.\d+){0,2})\b/g,
  /\b(ENT-[A-Za-z0-9_]+)\b/g,
  /\b(INV-\d+)\b/g,
  /\b(NFR-[A-Z]+-\d+)\b/g,
  /\b(ARCH-\d+)\b/g,
  /\b(EXT-\d+)\b/g,
  /\b(OPS-\d+)\b/g,
  /\b(ADR-\d+)\b/g,
  /\b(RISK-\d+)\b/g,
  /\b(TC-\d+)\b/g,
  /\b(EDGE-\d+)\b/g,
  /\b(AC-R\d+-\d+)\b/g,
  /\b(T\d+\.\d+)\b/g,
];

const HEADING_RE = /^#+\s+([A-Z][A-Za-z0-9.\-_]+):/;

export type IdTier = 'all' | 'R' | 'F' | 'S' | 'ENT' | 'INV' | 'NFR' | 'ARCH' | 'EXT' | 'OPS' | 'ADR' | 'RISK' | 'TC' | 'EDGE' | 'AC' | 'T';

export interface ResolverResult {
  ids: string[];
  bySource: Map<string, string>; // id → file
}

/**
 * Stub implementation: file-scan + regex.
 * M2 T2.1b에서 graph 기반으로 교체.
 */
export async function getValidIds(
  projectRoot: string,
  tier: IdTier = 'all',
): Promise<ResolverResult> {
  const specDir = join(projectRoot, 'docs', 'spec');
  let files: string[];
  try {
    files = (await readdir(specDir))
      .filter((f) => f.endsWith('.md'))
      .sort();
  } catch {
    return { ids: [], bySource: new Map() };
  }

  const defined = new Map<string, string>();

  for (const file of files) {
    const raw = await readFile(join(specDir, file), 'utf8');
    for (const line of raw.split('\n')) {
      const headingMatch = line.match(HEADING_RE);
      if (headingMatch) {
        const id = headingMatch[1];
        if (!defined.has(id) && matchesTier(id, tier)) {
          defined.set(id, file);
        }
      }
    }
  }

  return {
    ids: [...defined.keys()].sort(),
    bySource: defined,
  };
}

function matchesTier(id: string, tier: IdTier): boolean {
  if (tier === 'all') return true;
  if (tier === 'R') return /^R\d+$/.test(id);
  if (tier === 'F') return /^F\d+\.\d+$/.test(id);
  if (tier === 'S') return /^S\d+\.\d+\.\d+$/.test(id);
  return id.startsWith(tier + '-') || id.startsWith(tier);
}

export async function isDefined(projectRoot: string, id: string): Promise<boolean> {
  const { bySource } = await getValidIds(projectRoot);
  return bySource.has(id);
}

void ID_PATTERNS;
