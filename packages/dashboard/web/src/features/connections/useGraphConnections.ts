// Derives neighbor lists for a focused ID from the cached /api/graph query.
// No new API roundtrip — reads from TanStack Query's existing data.

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

export const EDGE_KINDS = [
  'solves',
  'linked-features',
  'parent',
  'tested-by',
  'covers-ac',
  'mitigates',
  'linked-arch',
  'depends-on',
  'parent-f',
  'parent-r',
  'parent-zone',
  'linked-ac',
  'linked-r',
  'solves-pains',
] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number];

export interface Neighbor {
  id: string;
  phase: number;
  kind: string | null;
  status?: string;
  edgeKind?: EdgeKind;
  direction: 'in' | 'out';
}

export interface Connections {
  focus: string;
  focusPhase?: number;
  focusKind?: string | null;
  focusStatus?: string;
  /** Grouped by edgeKind (typed edges). The order matches EDGE_KINDS. */
  typedOut: Array<{ kind: EdgeKind; neighbors: Neighbor[] }>;
  typedIn: Array<{ kind: EdgeKind; neighbors: Neighbor[] }>;
  /** Prose-mention refs that aren't already covered by typed edges. */
  untypedOut: Neighbor[];
  untypedIn: Neighbor[];
  totalOut: number;
  totalIn: number;
}

export function useGraphConnections(projectId: string, focus: string | null): Connections | null {
  const { data } = useQuery({
    queryKey: ['graph', projectId],
    queryFn: () => api.getGraph(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  return useMemo(() => {
    if (!data || !focus) return null;
    const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
    const focusNode = nodeById.get(focus);

    const outRaw = data.edges.filter((e) => e.from === focus);
    const inRaw = data.edges.filter((e) => e.to === focus);

    const groupByKind = (
      edges: typeof outRaw,
      pickOther: (e: { from: string; to: string }) => string,
      direction: 'in' | 'out',
    ): {
      typed: Array<{ kind: EdgeKind; neighbors: Neighbor[] }>;
      untyped: Neighbor[];
    } => {
      const typedMap = new Map<EdgeKind, Map<string, Neighbor>>();
      const untypedMap = new Map<string, Neighbor>();
      for (const e of edges) {
        const otherId = pickOther(e);
        const node = nodeById.get(otherId);
        const neighbor: Neighbor = {
          id: otherId,
          phase: node?.phase ?? 0,
          kind: node?.kind ?? null,
          status: node?.status,
          edgeKind: e.kind,
          direction,
        };
        if (e.kind) {
          const m = typedMap.get(e.kind) ?? new Map<string, Neighbor>();
          if (!m.has(otherId)) m.set(otherId, neighbor);
          typedMap.set(e.kind, m);
        } else {
          if (!untypedMap.has(otherId)) untypedMap.set(otherId, neighbor);
        }
      }
      // Strip untyped duplicates that are already represented in typed.
      const allTypedIds = new Set<string>();
      for (const m of typedMap.values()) for (const id of m.keys()) allTypedIds.add(id);
      for (const id of allTypedIds) untypedMap.delete(id);

      const typed = EDGE_KINDS
        .filter((k) => typedMap.has(k))
        .map((k) => ({
          kind: k,
          neighbors: Array.from(typedMap.get(k)!.values()).sort((a, b) =>
            a.phase - b.phase || a.id.localeCompare(b.id),
          ),
        }));
      const untyped = Array.from(untypedMap.values()).sort(
        (a, b) => a.phase - b.phase || a.id.localeCompare(b.id),
      );
      return { typed, untyped };
    };

    const out = groupByKind(outRaw, (e) => e.to, 'out');
    const inn = groupByKind(inRaw, (e) => e.from, 'in');

    return {
      focus,
      focusPhase: focusNode?.phase,
      focusKind: focusNode?.kind ?? null,
      focusStatus: focusNode?.status,
      typedOut: out.typed,
      typedIn: inn.typed,
      untypedOut: out.untyped,
      untypedIn: inn.untyped,
      totalOut: outRaw.length,
      totalIn: inRaw.length,
    };
  }, [data, focus]);
}
