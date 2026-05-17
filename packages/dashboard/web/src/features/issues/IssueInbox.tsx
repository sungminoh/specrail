import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import type { Issue, PatchProposal } from '@specrail/core';

export function IssueInbox({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: issues = [] } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => api.listIssues(projectId),
  });
  const refresh = useMutation({
    mutationFn: () => api.refreshIssues(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues', projectId] }),
  });
  const [filter, setFilter] = useState<{ source?: string; severity?: string }>({});
  const filtered = issues.filter(
    (i) =>
      (!filter.source || i.source === filter.source) &&
      (!filter.severity || i.severity === filter.severity),
  );
  return (
    <div className="inbox">
      <div className="inbox-toolbar">
        <span className="mono inbox-count">{filtered.length} of {issues.length}</span>
        <select
          className="mono"
          value={filter.source ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, source: e.target.value || undefined }))}
        >
          <option value="">all sources</option>
          <option value="plugin-self-check">plugin</option>
          <option value="cross-phase">cross-phase</option>
          <option value="ai-quality">ai-quality</option>
        </select>
        <select
          className="mono"
          value={filter.severity ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, severity: e.target.value || undefined }))}
        >
          <option value="">all severities</option>
          <option value="error">error</option>
          <option value="warn">warn</option>
          <option value="info">info</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn-primary mono" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          {refresh.isPending ? 'Running…' : 'Run check'}
        </button>
      </div>
      <ul className="inbox-list">
        {filtered.length === 0 && (
          <li className="placeholder">
            {issues.length === 0 ? 'No issues yet — click Run check' : 'No matches'}
          </li>
        )}
        {filtered.map((iss) => (
          <IssueRow key={iss.id} issue={iss} projectId={projectId} />
        ))}
      </ul>
    </div>
  );
}

function IssueRow({ issue, projectId }: { issue: Issue; projectId: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const sev = issue.severity === 'error' ? '✖' : issue.severity === 'warn' ? '▲' : 'ⓘ';
  const sevColor =
    issue.severity === 'error' ? 'var(--error)' : issue.severity === 'warn' ? 'var(--warning)' : 'var(--info)';
  const jumpToLocation = () => {
    const url = `/p/${projectId}/phase/${issue.location.phase}${issue.location.specId ? `#${encodeURIComponent(issue.location.specId)}` : ''}`;
    navigate(url);
  };
  return (
    <li className={`inbox-row${open ? ' open' : ''}`}>
      <button
        className="inbox-row-button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="inbox-row-top">
          <span className="src-chip mono" data-source={issue.source}>{issue.source}</span>
          <span className="sev" style={{ color: sevColor }}>{sev}</span>
          <span className="mono inbox-rule">{issue.ruleId}</span>
          <span className="inbox-loc mono">
            phase {String(issue.location.phase).padStart(2, '0')}
            {issue.location.line ? ` · line ${issue.location.line}` : ''}
            {issue.location.specId ? ` · ${issue.location.specId}` : ''}
          </span>
          <span className="inbox-toggle mono">{open ? '−' : '+'}</span>
        </div>
        <div className="inbox-msg">{issue.message}</div>
      </button>
      {open && (
        <div className="inbox-row-detail">
          <div className="inbox-row-actions">
            <button className="btn-ghost mono" onClick={jumpToLocation}>Open in phase view</button>
            {issue.suggestedPatch && (
              <SuggestedPatch projectId={projectId} patchId={issue.suggestedPatch} />
            )}
          </div>
          {!issue.suggestedPatch && (
            <div className="inbox-no-patch mono">
              No suggested patch (deterministic-check finding). Edit the phase to resolve.
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function SuggestedPatch({ projectId, patchId }: { projectId: string; patchId: string }) {
  const qc = useQueryClient();
  const { data: patch } = useQuery<PatchProposal>({
    queryKey: ['patch', projectId, patchId],
    queryFn: () => api.getPatch(projectId, patchId),
  });
  const accept = useMutation({
    mutationFn: () => api.acceptPatch(projectId, patchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patch', projectId, patchId] });
      qc.invalidateQueries({ queryKey: ['issues', projectId] });
      qc.invalidateQueries({ queryKey: ['phase', projectId] });
      qc.invalidateQueries({ queryKey: ['id-index', projectId] });
      qc.invalidateQueries({ queryKey: ['graph', projectId] });
    },
  });
  const reject = useMutation({
    mutationFn: () => api.rejectPatch(projectId, patchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patch', projectId, patchId] }),
  });
  if (!patch) return null;
  return (
    <div className="suggested-patch">
      <div className="patch-header mono">
        suggested patch · phase {patch.target.phase} · {patch.hunks.length} hunk{patch.hunks.length === 1 ? '' : 's'} · {patch.status}
      </div>
      {patch.hunks.slice(0, 1).map((h, i) => (
        <pre key={i} className="patch-diff">
          {h.before.split('\n').slice(0, 6).map((line, j) => (
            <span key={`-${j}`} className="diff-rem">- {line}{'\n'}</span>
          ))}
          {h.after.split('\n').slice(0, 6).map((line, j) => (
            <span key={`+${j}`} className="diff-add">+ {line}{'\n'}</span>
          ))}
        </pre>
      ))}
      {patch.status === 'proposed' && (
        <div className="patch-actions">
          <button className="btn-ghost mono" onClick={() => reject.mutate()} disabled={reject.isPending}>
            reject
          </button>
          <button className="btn-primary mono" onClick={() => accept.mutate()} disabled={accept.isPending}>
            {accept.isPending ? 'applying…' : 'accept'}
          </button>
        </div>
      )}
    </div>
  );
}
