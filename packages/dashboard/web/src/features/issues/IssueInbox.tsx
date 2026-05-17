import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../lib/api.js';
import type { Issue } from '@specrail/core';

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
  const [filter, setFilter] = useState<{ source?: string; severity?: string; phase?: number }>({});
  const filtered = issues.filter((i) =>
    (!filter.source || i.source === filter.source) &&
    (!filter.severity || i.severity === filter.severity) &&
    (!filter.phase || i.location.phase === filter.phase),
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
        <button
          className="btn-primary mono"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
        >
          {refresh.isPending ? 'Running…' : 'Run check'}
        </button>
      </div>
      <ul className="inbox-list">
        {filtered.length === 0 && <li className="placeholder">{issues.length === 0 ? 'No issues yet — click Run check' : 'No matches'}</li>}
        {filtered.map((iss) => (
          <IssueRow key={iss.id} issue={iss} projectId={projectId} />
        ))}
      </ul>
    </div>
  );
}

function IssueRow({ issue, projectId }: { issue: Issue; projectId: string }) {
  void projectId;
  const sev = issue.severity === 'error' ? '✖' : issue.severity === 'warn' ? '▲' : 'ⓘ';
  const sevColor =
    issue.severity === 'error' ? 'var(--error)' : issue.severity === 'warn' ? 'var(--warning)' : 'var(--info)';
  return (
    <li className="inbox-row">
      <div className="inbox-row-top">
        <span className="src-chip mono" data-source={issue.source}>
          {issue.source}
        </span>
        <span className="sev" style={{ color: sevColor }}>
          {sev}
        </span>
        <span className="mono inbox-rule">{issue.ruleId}</span>
        <span className="inbox-loc mono">
          phase {String(issue.location.phase).padStart(2, '0')}
          {issue.location.line ? ` · line ${issue.location.line}` : ''}
          {issue.location.specId ? ` · ${issue.location.specId}` : ''}
        </span>
      </div>
      <div className="inbox-msg">{issue.message}</div>
    </li>
  );
}
