import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useThemeToggle } from './theme.js';

export function TopBar({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });
  const active = projects.find((p) => p.id === projectId);
  const { theme, toggle } = useThemeToggle();
  return (
    <header className="topbar">
      <div className="topbar-project">
        <select
          className="topbar-switcher"
          value={projectId}
          onChange={(e) => navigate(`/p/${e.target.value}/phase/1`)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {active?.id === p.id ? '' : `(${p.rootPath})`}
            </option>
          ))}
        </select>
        <span className="topbar-path mono">{active?.rootPath}</span>
      </div>
      <div className="topbar-actions">
        <button className="btn-ghost mono" onClick={toggle} title="toggle theme">
          {theme === 'dark' ? '☾ DARK' : '☀ LIGHT'}
        </button>
        <button className="btn-ghost mono" onClick={() => navigate('/')} title="all projects">
          PROJECTS
        </button>
      </div>
    </header>
  );
}
