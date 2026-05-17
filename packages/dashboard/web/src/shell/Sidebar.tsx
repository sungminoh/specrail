import { useQuery } from '@tanstack/react-query';
import { NavLink, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

const PHASE_LABELS = [
  'PRD',
  'Personas',
  'Features',
  'Domain',
  'User Flow',
  'IA',
  'Wireframe',
  'Architecture',
  'NFR',
  'Test',
  'Operations',
  'ADR · Risks',
  'Impl plan',
];

export function Sidebar({ projectId }: { projectId: string }) {
  const { data = [] } = useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => api.listPhases(projectId),
    enabled: !!projectId,
  });
  const { data: issues = [] } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => api.listIssues(projectId),
    enabled: !!projectId,
  });
  const params = useParams<{ n?: string }>();
  const activeN = params.n ? Number(params.n) : null;
  return (
    <aside className="sidebar">
      <div className="sidebar-section mono">Phases</div>
      {PHASE_LABELS.map((label, idx) => {
        const num = idx + 1;
        const phaseInfo = data.find((p) => p.number === num);
        const status = phaseInfo?.status;
        return (
          <NavLink
            key={num}
            to={`/p/${projectId}/phase/${num}`}
            className={({ isActive }) => `sidebar-row${isActive || activeN === num ? ' active' : ''}`}
          >
            <span className="sidebar-num display">{String(num).padStart(2, '0')}</span>
            <span className="sidebar-label">{label}</span>
            {status && <StatusDot status={status} />}
          </NavLink>
        );
      })}
      <div className="sidebar-section mono">Sources</div>
      <NavLink to={`/p/${projectId}/issues`} className={({ isActive }) => `sidebar-row${isActive ? ' active' : ''}`}>
        <span className="sidebar-num display">·</span>
        <span className="sidebar-label">Issues</span>
        {issues.length > 0 && <span className="sidebar-badge mono">{issues.length}</span>}
      </NavLink>
    </aside>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'Approved' || status === 'Accepted'
      ? 'var(--success)'
      : status === 'Draft' || status === 'Proposed' || status === 'Empty'
        ? 'var(--warning)'
        : 'var(--text-dim)';
  return <span className="sidebar-dot" style={{ background: color }} title={status} />;
}
