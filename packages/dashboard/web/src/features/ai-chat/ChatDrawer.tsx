import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import type { PhaseNumber, PatchProposal } from '@specrail/core';

interface Props {
  projectId: string;
  currentPhase: PhaseNumber;
}

interface StreamingState {
  sessionId: string | null;
  buffer: string;
  patchIds: string[];
  status: 'idle' | 'streaming' | 'done' | 'error';
  error?: string;
}

export function ChatDrawer({ projectId, currentPhase }: Props) {
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [state, setState] = useState<StreamingState>({
    sessionId: null,
    buffer: '',
    patchIds: [],
    status: 'idle',
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (ev: Event) => {
      type P = { sessionId?: string; delta?: string; patchIds?: string[]; message?: string };
      const e = ev as CustomEvent<{ type: string; payload: P | null }>;
      const t = e.detail?.type;
      const p = e.detail?.payload;
      if (!state.sessionId || !p || p.sessionId !== state.sessionId) return;
      if (t === 'ai.token') {
        setState((s) => ({ ...s, buffer: s.buffer + (p.delta ?? '') }));
      } else if (t === 'ai.done') {
        setState((s) => ({ ...s, status: 'done', patchIds: p.patchIds ?? [] }));
      } else if (t === 'ai.error') {
        setState((s) => ({ ...s, status: 'error', error: String(p.message ?? '') }));
      }
    };
    window.addEventListener('specrail:sse', handler as EventListener);
    return () => window.removeEventListener('specrail:sse', handler as EventListener);
  }, [state.sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.buffer]);

  // Reset chat state when the phase context changes — the session is bound to
  // a specific phase, so showing the previous phase's reply alongside the new
  // "context auto-attached: phase N" prompt is confusing.
  useEffect(() => {
    setState({ sessionId: null, buffer: '', patchIds: [], status: 'idle' });
    setInput('');
  }, [currentPhase]);

  const send = useMutation({
    mutationFn: async () => {
      const session = await api.createSession(projectId, 'chat');
      setState({ sessionId: session.id, buffer: '', patchIds: [], status: 'streaming' });
      await api.sendMessage(projectId, session.id, { phase: currentPhase, content: input });
    },
    onSuccess: () => {
      setInput('');
    },
  });

  return (
    <aside className="chat-drawer">
      <header className="chat-header mono">
        <span>AI chat · phase {String(currentPhase).padStart(2, '0')}</span>
      </header>
      <div className="chat-messages">
        {state.status === 'idle' && !state.buffer && (
          <p className="placeholder">컨텍스트 자동 첨부: phase {currentPhase} — 무엇을 검토할까요?</p>
        )}
        {state.buffer && <pre className="chat-bubble assistant">{state.buffer}</pre>}
        {state.patchIds.map((pid) => (
          <PatchCard key={pid} projectId={projectId} patchId={pid} onSettled={() => qc.invalidateQueries({ queryKey: ['phase', projectId] })} />
        ))}
        {state.error && <div className="chat-error mono">⚠ {state.error}</div>}
        <div ref={bottomRef} />
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) send.mutate();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Claude about this phase…"
          disabled={state.status === 'streaming'}
        />
        <button type="submit" className="btn-primary mono" disabled={!input.trim() || state.status === 'streaming'}>
          {state.status === 'streaming' ? 'streaming…' : 'send'}
        </button>
        {state.status === 'streaming' && state.sessionId && (
          <button
            type="button"
            className="btn-ghost mono"
            onClick={() => state.sessionId && api.abortSession(projectId, state.sessionId)}
          >
            stop
          </button>
        )}
      </form>
    </aside>
  );
}

function PatchCard({ projectId, patchId, onSettled }: { projectId: string; patchId: string; onSettled: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery<PatchProposal>({
    queryKey: ['patch', projectId, patchId],
    queryFn: () => api.getPatch(projectId, patchId),
    refetchInterval: false,
  });
  const accept = useMutation({
    mutationFn: () => api.acceptPatch(projectId, patchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patch', projectId, patchId] });
      qc.invalidateQueries({ queryKey: ['id-index', projectId] });
      qc.invalidateQueries({ queryKey: ['graph', projectId] });
      qc.invalidateQueries({ queryKey: ['issues', projectId] });
      onSettled();
    },
  });
  const reject = useMutation({
    mutationFn: () => api.rejectPatch(projectId, patchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patch', projectId, patchId] }),
  });
  if (!data) return null;
  return (
    <div className="patch-card">
      <div className="patch-header mono">
        patch · phase {data.target.phase} · {data.hunks.length} hunk{data.hunks.length === 1 ? '' : 's'} · {data.status}
      </div>
      {data.hunks.map((h, i) => (
        <pre key={i} className="patch-diff">
          {h.before.split('\n').map((line, j) => (
            <span key={`-${j}`} className="diff-rem">- {line}{'\n'}</span>
          ))}
          {h.after.split('\n').map((line, j) => (
            <span key={`+${j}`} className="diff-add">+ {line}{'\n'}</span>
          ))}
        </pre>
      ))}
      {data.rationale && <div className="patch-rationale">{data.rationale}</div>}
      {data.status === 'proposed' && (
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
