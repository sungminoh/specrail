// F1.4 ID resolver — valid-list 노출 (AC-R1-2, TC-2)
// T2.1b: graph 기반 (M1 file-scan stub에서 교체됨)

import { buildGraph } from '../graph/builder.js';

export type IdTier = 'all' | 'R' | 'F' | 'S' | 'ENT' | 'INV' | 'NFR' | 'ARCH' | 'EXT' | 'OPS' | 'ADR' | 'RISK' | 'TC' | 'EDGE' | 'AC' | 'T';

export interface ResolverResult {
  ids: string[];
  bySource: Map<string, string>; // id → file
}

export async function getValidIds(
  projectRoot: string,
  tier: IdTier = 'all',
): Promise<ResolverResult> {
  const graph = await buildGraph(projectRoot);
  const bySource = new Map<string, string>();

  for (const node of graph.nodes) {
    if (!bySource.has(node.specId) && matchesTier(node.specId, tier)) {
      bySource.set(node.specId, node.definedAt.file);
    }
  }

  return {
    ids: [...bySource.keys()].sort(),
    bySource,
  };
}

export function matchesTier(id: string, tier: IdTier): boolean {
  if (tier === 'all') return true;
  if (tier === 'R') return /^R\d+$/.test(id);
  if (tier === 'F') return /^F\d+\.\d+$/.test(id);
  if (tier === 'S') return /^S\d+\.\d+\.\d+$/.test(id);
  // Tiers like 'TC', 'ADR', 'NFR' use dash separator
  if (id.startsWith(tier + '-')) return true;
  // Single-char R/F/S handled above; for multi-char tiers, dash is required
  return false;
}

export async function isDefined(projectRoot: string, id: string): Promise<boolean> {
  const { bySource } = await getValidIds(projectRoot);
  return bySource.has(id);
}
