import type { Phase } from '../spec/types.js';

export interface GraphNode {
  id: string;
  phase: number;
  kind: string | null;
}

export interface GraphEdge {
  from: string;
  to: string;
  phase: number;
  line: number;
}

export interface SpecGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Set of all node ids for O(1) existence check. */
  nodeIds: Set<string>;
  /** Map: id → outbound edges. */
  outbound: Map<string, GraphEdge[]>;
  /** Map: id → inbound edges. */
  inbound: Map<string, GraphEdge[]>;
}

export function buildGraph(phases: Phase[], classify: (id: string) => string | null): SpecGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const outbound = new Map<string, GraphEdge[]>();
  const inbound = new Map<string, GraphEdge[]>();

  for (const phase of phases) {
    for (const id of phase.parsedIds) {
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        nodes.push({ id, phase: phase.number, kind: classify(id) });
      }
    }
  }
  for (const phase of phases) {
    for (const ref of phase.parsedRefs) {
      const edge: GraphEdge = {
        from: ref.from,
        to: ref.to,
        phase: phase.number,
        line: ref.line,
      };
      edges.push(edge);
      const o = outbound.get(ref.from);
      if (o) o.push(edge);
      else outbound.set(ref.from, [edge]);
      const i = inbound.get(ref.to);
      if (i) i.push(edge);
      else inbound.set(ref.to, [edge]);
    }
  }

  return { nodes, edges, nodeIds, outbound, inbound };
}
