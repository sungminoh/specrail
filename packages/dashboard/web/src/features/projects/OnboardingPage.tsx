import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api.js';

export function OnboardingPage() {
  const [path, setPath] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (rootPath: string) => api.registerProject(rootPath),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/p/${project.id}/phase/1`);
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) {
        try {
          const body = JSON.parse(e.message.replace(/^API \d+: /, ''));
          setErr(body.error ?? e.message);
        } catch {
          setErr(e.message);
        }
      } else {
        setErr(String(e));
      }
    },
  });
  return (
    <div className="page narrow">
      <header className="page-header">
        <h1 className="display">Add a specrail project</h1>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErr(null);
          if (path) mut.mutate(path);
        }}
      >
        <label className="form-label mono">Absolute project root path</label>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/Users/you/Development/your-spec-project"
          autoFocus
        />
        <p className="form-hint mono">docs/spec/01-prd.md must exist at that path.</p>
        {err && <div className="form-error mono">⚠ {err}</div>}
        <div className="form-actions">
          <button type="submit" className="btn-primary mono" disabled={mut.isPending}>
            {mut.isPending ? 'Adding…' : 'Add project'}
          </button>
        </div>
      </form>
    </div>
  );
}
