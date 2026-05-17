// F4.2 transitive downstream extractor (AC-R4-2, TC-8)
// 변경된 ID set → 그 ID 인용하는 phase 모두 (직간접 — BFS on edges)

import { buildGraph, type DependencyGraph } from './builder.js';

export interface DownstreamResult {
  affectedPhases: string[];
  affectedIds: string[];
  paths: { phase: string; via: string }[];
}

export async function extractDownstream(
  projectRoot: string,
  changedIds: string[],
): Promise<DownstreamResult> {
  const graph = await buildGraph(projectRoot);
  return extractDownstreamFromGraph(graph, changedIds);
}

export function extractDownstreamFromGraph(
  graph: DependencyGraph,
  changedIds: string[],
): DownstreamResult {
  const visited = new Set<string>(changedIds);
  const affectedPhases = new Set<string>();
  const paths: { phase: string; via: string }[] = [];

  // BFS: each level = IDs that cite something in 'visited' set
  let frontier = new Set<string>(changedIds);
  while (frontier.size > 0) {
    const nextFrontier = new Set<string>();

    for (const e of graph.edges) {
      if (frontier.has(e.to)) {
        affectedPhases.add(e.from);
        paths.push({ phase: e.from, via: e.to });

        // Find all IDs defined in e.from phase (treat 'from' as phase id)
        const definedInFromPhase = graph.nodes
          .filter((n) => n.phaseId === e.from)
          .map((n) => n.specId);

        for (const id of definedInFromPhase) {
          if (!visited.has(id)) {
            visited.add(id);
            nextFrontier.add(id);
          }
        }
      }
    }

    frontier = nextFrontier;
  }

  return {
    affectedPhases: [...affectedPhases].sort(),
    affectedIds: [...visited].sort(),
    paths,
  };
}
