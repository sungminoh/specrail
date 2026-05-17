import type { SpecGraph } from './build.js';

/** Nodes that are referenced by no other node (no inbound edges) AND reference no other (no outbound). */
export function findOrphans(graph: SpecGraph): string[] {
  const orphans: string[] = [];
  for (const node of graph.nodes) {
    const inboundCount = graph.inbound.get(node.id)?.length ?? 0;
    const outboundCount = graph.outbound.get(node.id)?.length ?? 0;
    if (inboundCount === 0 && outboundCount === 0) orphans.push(node.id);
  }
  return orphans;
}

/** Edges whose `to` id is not defined anywhere. */
export function findDanglingRefs(graph: SpecGraph): Array<{ from: string; to: string; phase: number; line: number }> {
  const out: Array<{ from: string; to: string; phase: number; line: number }> = [];
  for (const e of graph.edges) {
    if (!graph.nodeIds.has(e.to)) out.push(e);
  }
  return out;
}
