// Hook: aggregates all phases for a project into a single id→preview index.
// Cached via React Query so all consumers share it.
import { useQuery } from '@tanstack/react-query';
import type { Phase, PhaseNumber } from '@specrail/core';
import { api } from '../../lib/api.js';
import { buildIdIndex, type IdPreview } from './idIndex.js';

const PHASES: PhaseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function useIdIndex(projectId: string | null) {
  return useQuery({
    queryKey: ['id-index', projectId],
    enabled: !!projectId,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, IdPreview>> => {
      if (!projectId) return new Map();
      const phases = (
        await Promise.all(
          PHASES.map((n) =>
            api.getPhase(projectId, n).catch(() => null),
          ),
        )
      ).filter((p): p is Phase => p !== null);
      return buildIdIndex(phases);
    },
  });
}
