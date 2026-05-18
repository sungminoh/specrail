import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import type { PhaseNumber } from '@specrail/core';
import { MarkdownView } from './MarkdownView.js';
import { EditMode } from './EditMode.js';
import { usePanel, togglePanel } from '../../shell/usePanelState.js';

export function PhaseRoute() {
  const { projectId = '', n = '1' } = useParams<{ projectId: string; n: string }>();
  const [search, setSearch] = useSearchParams();
  const editing = search.get('edit') === '1';
  const chatOpen = usePanel('chat');
  const connOpen = usePanel('connections');
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
  const toggleEdit = (next: boolean) => {
    const sp = new URLSearchParams(search);
    if (next) sp.set('edit', '1');
    else sp.delete('edit');
    setSearch(sp, { replace: true });
  };
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
          <div style={{ flex: 1 }} />
          <button
            className={`btn-ghost mono${connOpen ? ' on' : ''}`}
            onClick={() => togglePanel('connections')}
            title="Toggle Connections panel"
          >
            CONNECTIONS
          </button>
          <button
            className={`btn-ghost mono${chatOpen ? ' on' : ''}`}
            onClick={() => togglePanel('chat')}
            title="Toggle AI chat"
          >
            AI CHAT
          </button>
          <button className="btn-ghost mono" onClick={() => toggleEdit(!editing)}>
            {editing ? 'READ' : 'EDIT'}
          </button>
        </div>
      </header>
      <div className="phase-body">
        <div className="phase-body-main">
          {editing ? (
            <EditMode
              projectId={projectId}
              num={num}
              initialContent={data.body}
              initialMtimeMs={data.mtimeMs}
              onSaved={() => toggleEdit(false)}
              onCancel={() => toggleEdit(false)}
            />
          ) : (
            <MarkdownView body={data.body} projectId={projectId} />
          )}
        </div>
      </div>
    </article>
  );
}
