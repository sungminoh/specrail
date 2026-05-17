import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

interface ParsedEvent {
  type: string;
  payload: unknown;
  lastEventId: string;
}

export function useProjectSSE(projectId: string | null): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (!projectId) return;
    const url = api.eventsUrl(projectId);
    const es = new EventSource(url, { withCredentials: true });
    const handler = (kind: string) => (ev: MessageEvent) => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        // ignore
      }
      if (kind.startsWith('file.')) {
        qc.invalidateQueries({ queryKey: ['phase', projectId] });
        qc.invalidateQueries({ queryKey: ['phases', projectId] });
      }
      if (kind === 'issues.updated') {
        qc.invalidateQueries({ queryKey: ['issues', projectId] });
      }
      // ai.*, patch.* events handled by feature-specific hooks.
      window.dispatchEvent(new CustomEvent('specrail:sse', { detail: { type: kind, payload } as ParsedEvent }));
    };
    for (const kind of [
      'file.changed', 'file.added', 'file.deleted',
      'issues.updated',
      'patch.proposed', 'patch.accepted', 'patch.rejected',
      'ai.token', 'ai.tool', 'ai.done', 'ai.error',
      'open', 'heartbeat',
    ]) {
      es.addEventListener(kind, handler(kind) as EventListener);
    }
    return () => es.close();
  }, [projectId, qc]);
}
