import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

const KINDS = [
  'file.changed', 'file.added', 'file.deleted',
  'issues.updated',
  'patch.proposed', 'patch.accepted', 'patch.rejected',
  'ai.token', 'ai.tool', 'ai.done', 'ai.error',
  'open', 'heartbeat',
] as const;

export function useProjectSSE(projectId: string | null): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (!projectId) return;
    const es = new EventSource(api.eventsUrl(projectId), { withCredentials: true });
    const makeHandler = (kind: string) => (ev: MessageEvent) => {
      let payload: unknown = null;
      try { payload = JSON.parse(ev.data); } catch { /* non-JSON ping */ }
      if (kind.startsWith('file.')) {
        qc.invalidateQueries({ queryKey: ['phase', projectId] });
        qc.invalidateQueries({ queryKey: ['phases', projectId] });
      }
      if (kind === 'issues.updated') {
        qc.invalidateQueries({ queryKey: ['issues', projectId] });
      }
      // ai.* and patch.* are forwarded for feature-specific hooks (ChatDrawer).
      window.dispatchEvent(new CustomEvent('specrail:sse', { detail: { type: kind, payload } }));
    };
    for (const kind of KINDS) {
      es.addEventListener(kind, makeHandler(kind) as EventListener);
    }
    return () => es.close();
  }, [projectId, qc]);
}
