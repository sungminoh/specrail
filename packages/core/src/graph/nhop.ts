import type { SpecGraph, GraphEdge, GraphNode } from './build.js';

export interface SubGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Compute the N-hop subgraph starting from `seed` (BFS across both inbound and outbound).
 * hop=0 returns just the seed node (and no edges).
 */
export function nHop(graph: SpecGraph, seed: string, hop: number): SubGraph {
  // BFS where each iteration expands by exactly one edge.
  const visited = new Set<string>([seed]);
  let frontier: string[] = [seed];
  const edges: GraphEdge[] = [];
  const edgeKey = (e: GraphEdge) => `${e.from}→${e.to}@${e.phase}:${e.line}`;
  const edgeSet = new Set<string>();

  for (let h = 0; h < hop; h++) {
    const next: string[] = [];
    for (const id of frontier) {
      const outs = graph.outbound.get(id) ?? [];
      const ins = graph.inbound.get(id) ?? [];
      for (const e of outs) {
        if (!edgeSet.has(edgeKey(e))) {
          edgeSet.add(edgeKey(e));
          edges.push(e);
        }
        if (!visited.has(e.to)) {
          visited.add(e.to);
          next.push(e.to);
        }
      }
      for (const e of ins) {
        if (!edgeSet.has(edgeKey(e))) {
          edgeSet.add(edgeKey(e));
          edges.push(e);
        }
        if (!visited.has(e.from)) {
          visited.add(e.from);
          next.push(e.from);
        }
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }

  const nodes: GraphNode[] = [];
  for (const node of graph.nodes) {
    if (visited.has(node.id)) nodes.push(node);
  }
  return { nodes, edges };
}
