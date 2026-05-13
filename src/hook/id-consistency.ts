// F2.3 ID consistency hook (INV-2 환각 ID 차단)
// T2.1b 완료 (verifier 발견): graph 기반 (file-scan stub 대체)

import { buildGraph } from '../graph/builder.js';

export interface ConsistencyResult {
  defined: Set<string>;
  cited: Set<string>;
  dangling: string[];
}

export async function checkIdConsistency(projectRoot: string): Promise<ConsistencyResult> {
  const graph = await buildGraph(projectRoot);

  const cited = new Set<string>();
  for (const e of graph.edges) cited.add(e.to);
  for (const d of graph.danglingCitations) cited.add(d.to);

  const dangling = graph.danglingCitations
    .map((d) => d.to)
    .filter((id, idx, arr) => arr.indexOf(id) === idx)
    .sort();

  return { defined: graph.definedIds, cited, dangling };
}

export async function runHook(projectRoot: string): Promise<{ ok: boolean; message: string }> {
  // US-T6.3 (M6): Distinguish 'docs/spec not initialized' from 'initialized + clean'.
  // Without this, missing docs/spec silently returns 0 dangling — vacuous INV-2 OK.
  const graph = await buildGraph(projectRoot);
  if (!graph.initialized) {
    return { ok: true, message: 'INV-2 skipped: docs/spec not initialized' };
  }
  const r = await checkIdConsistency(projectRoot);
  if (r.dangling.length === 0) {
    return { ok: true, message: 'INV-2 OK: ' + r.defined.size + ' defined, ' + r.cited.size + ' cited, 0 dangling' };
  }
  const lines = [
    'INV-2 violation: ' + r.dangling.length + ' cited IDs not defined:',
    ...r.dangling.slice(0, 20).map((id) => '  - ' + id),
  ];
  if (r.dangling.length > 20) lines.push('  ... and ' + (r.dangling.length - 20) + ' more');
  lines.push('', 'Valid defined IDs (first 20):');
  for (const id of [...r.defined].sort().slice(0, 20)) lines.push('  - ' + id);
  return { ok: false, message: lines.join('\n') };
}
