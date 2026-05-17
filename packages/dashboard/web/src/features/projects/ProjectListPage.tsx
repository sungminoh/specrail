import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../../lib/api.js';

export function ProjectListPage() {
  const navigate = useNavigate();
  // Bootstrap CSRF cookie via /api/health
  useQuery({ queryKey: ['health'], queryFn: () => api.health() });
  const { data = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.listProjects(),
  });
  useEffect(() => {
    if (!isLoading && data.length === 0) navigate('/onboarding', { replace: true });
  }, [isLoading, data.length, navigate]);
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="display">Your projects</h1>
        <Link to="/onboarding" className="btn-primary mono">+ Add project</Link>
      </header>
      <ul className="card-list">
        {data.map((p) => (
          <li key={p.id} className="card">
            <Link to={`/p/${p.id}/phase/1`} className="card-link">
              <div className="card-title display">{p.name}</div>
              <div className="card-path mono">{p.rootPath}</div>
              <div className="card-meta mono">opened {new Date(p.lastOpenedAt as string).toLocaleString()}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
