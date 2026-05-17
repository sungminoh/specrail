import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from './AppShell.js';
import { api, ApiError } from '../lib/api.js';
import { useProjectSSE } from '../lib/sse.js';

export function ProjectRoute() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.openProject(projectId),
    enabled: !!projectId,
  });
  useProjectSSE(projectId);
  useEffect(() => {
    if (error instanceof ApiError && error.status === 404) navigate('/', { replace: true });
  }, [error, navigate]);
  if (!data) return <div className="placeholder">Loading project…</div>;
  return (
    <AppShell projectId={projectId}>
      <Outlet />
    </AppShell>
  );
}
