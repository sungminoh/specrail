import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import type { PhaseNumber } from '@specrail/core';
import { MarkdownView } from './MarkdownView.js';

export function PhaseRoute() {
  const { projectId = '', n = '1' } = useParams<{ projectId: string; n: string }>();
  const num = Number(n) as PhaseNumber;
  const { data, isLoading, error } = useQuery({
    queryKey: ['phase', projectId, num],
    queryFn: () => api.getPhase(projectId, num),
    enabled: !!projectId && num >= 1 && num <= 13,
  });
  if (isLoading) return <div className="placeholder">Loading phase {num}…</div>;
  if (error) return <div className="placeholder">Failed: {(error as Error).message}</div>;
  if (!data) return null;
  const status = typeof data.frontmatter['status'] === 'string' ? (data.frontmatter['status'] as string) : null;
  return (
    <article className="phase">
      <header className="phase-header">
        <h1 className="display">
          <span className="phase-num">Phase {String(num).padStart(2, '0')} —</span> {data.slug}
        </h1>
        <div className="phase-meta mono">
          {status && <span className="meta-pill">status {status}</span>}
          <span className="meta-pill">mtime {new Date(data.mtimeMs).toLocaleString()}</span>
          <span className="meta-pill">{data.parsedIds.length} ids · {data.parsedRefs.length} refs</span>
        </div>
      </header>
      <MarkdownView body={data.body} projectId={projectId} />
    </article>
  );
}
