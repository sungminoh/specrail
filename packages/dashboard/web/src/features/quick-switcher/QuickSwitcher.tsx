// cmd+k fuzzy switcher across phases + spec IDs (AC-R1-4 / NFR-PERF-5).
import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdIndex } from '../phases/useIdIndex.js';

const PHASE_LABELS = [
  '01 PRD', '02 Personas', '03 Features', '04 Domain', '05 User Flow',
  '06 IA', '07 Wireframe', '08 Architecture', '09 NFR', '10 Test',
  '11 Operations', '12 ADR · Risks', '13 Impl plan',
];

interface Hit {
  kind: 'phase' | 'id';
  label: string;
  detail: string;
  goto: string;
}

export function QuickSwitcher({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: idIndex } = useIdIndex(projectId);

  // Open/close on cmd+k or ctrl+k
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((v) => !v);
        setQ('');
        setCursor(0);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const fuse = useMemo(() => {
    const items: Hit[] = PHASE_LABELS.map((label, idx) => ({
      kind: 'phase' as const,
      label,
      detail: 'phase',
      goto: `/p/${projectId}/phase/${idx + 1}`,
    }));
    if (idIndex) {
      for (const [id, p] of idIndex) {
        items.push({
          kind: 'id',
          label: id,
          detail: `${p.kind ?? '?'} · phase ${String(p.phase).padStart(2, '0')}`,
          goto: `/p/${projectId}/phase/${p.phase}#${encodeURIComponent(id)}`,
        });
      }
    }
    return new Fuse(items, {
      keys: ['label', 'detail'],
      threshold: 0.35,
      ignoreLocation: true,
      includeScore: true,
    });
  }, [idIndex, projectId]);

  const results: Hit[] = useMemo(() => {
    if (!open) return [];
    if (!q) {
      // Default: show phases.
      return PHASE_LABELS.map((label, idx) => ({
        kind: 'phase' as const,
        label,
        detail: 'phase',
        goto: `/p/${projectId}/phase/${idx + 1}`,
      }));
    }
    return fuse.search(q, { limit: 12 }).map((r) => r.item);
  }, [fuse, q, open, projectId]);

  if (!open) return null;
  const choose = (h: Hit) => {
    setOpen(false);
    navigate(h.goto);
  };
  return (
    <div className="cmdk-overlay" role="dialog" aria-modal onClick={() => setOpen(false)}>
      <div className="cmdk-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input mono"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCursor((c) => Math.min(results.length - 1, c + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCursor((c) => Math.max(0, c - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const hit = results[cursor];
              if (hit) choose(hit);
            }
          }}
          placeholder="Find a phase or spec ID…  (esc to close)"
          autoComplete="off"
        />
        <ul className="cmdk-results">
          {results.length === 0 && <li className="placeholder">No match</li>}
          {results.map((h, i) => (
            <li
              key={`${h.kind}-${h.label}-${i}`}
              className={`cmdk-row${i === cursor ? ' active' : ''}`}
              onMouseEnter={() => setCursor(i)}
              onClick={() => choose(h)}
            >
              <span className={`cmdk-kind kind-${h.kind}`}>{h.kind === 'phase' ? 'PH' : 'ID'}</span>
              <span className="cmdk-label mono">{h.label}</span>
              <span className="cmdk-detail mono">{h.detail}</span>
            </li>
          ))}
        </ul>
        <div className="cmdk-footer mono">↑/↓ navigate · ⏎ open · esc close</div>
      </div>
    </div>
  );
}
