// W-CC-CONNECTIONS — Inline right-rail in PhaseView. AC-R2-6.
// Reads from cached graph query (no new roundtrip). Refresh budget: NFR-PERF-6 (≤16ms).

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGraphConnections, type Neighbor, type EdgeKind } from './useGraphConnections.js';
import { usePanel, setPanel } from '../../shell/usePanelState.js';

const KIND_LABEL: Record<EdgeKind, string> = {
  solves: 'solves',
  'linked-features': 'linked features',
  parent: 'parent',
  'tested-by': 'tested by',
  'covers-ac': 'covers AC',
  mitigates: 'mitigates',
  'linked-arch': 'linked arch',
  'depends-on': 'depends on',
  'parent-f': 'parent feature',
  'parent-r': 'parent req',
  'parent-zone': 'parent zone',
  'linked-ac': 'linked AC',
  'linked-r': 'linked req',
  'solves-pains': 'solves pains',
};

interface Props {
  projectId: string;
}

/**
 * Listens for ID chip focus events on the document and renders typed neighbors
 * grouped by edge kind. Focus is set on chip click (or via panel internal nav).
 */
export function ConnectionsPanel({ projectId }: Props) {
  const [focus, setFocus] = useState<string | null>(null);
  const open = usePanel('connections');
  const navigate = useNavigate();
  const conn = useGraphConnections(projectId, focus);

  // Auto-pick a focus when chips appear. Order of preference:
  //   1. URL fragment (#R1, etc.) — set on chip click for navigation
  //   2. First `.id-chip` on the page
  // ConnectionsPanel mounts in AppShell BEFORE PhaseRoute renders chips
  // (phase fetch is async), so we observe the DOM until chips show up.
  useEffect(() => {
    if (focus) return;

    const pickFromHash = (): string | null => {
      const h = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      return h && /^[A-Z][A-Za-z0-9\-.]*\d/.test(h) ? h : null;
    };
    const pickFirstChip = (): string | null =>
      document.querySelector('.id-chip')?.textContent?.trim() ?? null;

    const initial = pickFromHash() ?? pickFirstChip();
    if (initial) {
      setFocus(initial);
      return;
    }
    // Chips not in DOM yet — observe and pick when they appear.
    const observer = new MutationObserver(() => {
      const id = pickFirstChip();
      if (id) {
        setFocus(id);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [focus]);

  // Phase navigation invalidates the focus (different page, different chips).
  // Reset to null so the auto-pick logic above re-runs against the new DOM.
  useEffect(() => {
    const onHashChange = () => {
      const h = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (h && /^[A-Z][A-Za-z0-9\-.]*\d/.test(h)) setFocus(h);
    };
    const onPop = () => {
      // Wait a tick for the new route to mount, then re-pick from URL hash or chips.
      setTimeout(() => {
        const h = decodeURIComponent(window.location.hash.replace(/^#/, ''));
        if (h && /^[A-Z][A-Za-z0-9\-.]*\d/.test(h)) setFocus(h);
        else {
          const first = document.querySelector('.id-chip')?.textContent?.trim();
          if (first) setFocus(first);
        }
      }, 50);
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  // Subscribe to chip click events (document-level capture).
  useEffect(() => {
    const onChipClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.matches !== 'function' || !target.matches('.id-chip')) return;
      const id = target.textContent?.trim();
      if (id) setFocus(id);
    };
    document.addEventListener('click', onChipClick, true);
    return () => document.removeEventListener('click', onChipClick, true);
  }, []);

  if (!open) return null;

  return (
    <aside className="connections-panel">
      <header className="conn-header">
        <button
          type="button"
          className="conn-toggle mono"
          onClick={() => setPanel('connections', false)}
          aria-label="Close connections panel"
          title="Close connections panel"
        >
          ✕
        </button>
        <span className="conn-title mono">CONNECTIONS</span>
      </header>

      {!focus && <div className="conn-empty mono">Click any ID chip to focus.</div>}

      {conn && (
        <>
          <div className="conn-focus">
            <span className="conn-focus-id mono">{conn.focus}</span>
            {conn.focusKind && <span className="conn-focus-kind mono">{conn.focusKind}</span>}
            {conn.focusStatus && (
              <span className={`conn-status-pill status-${conn.focusStatus.toLowerCase()} mono`}>
                {conn.focusStatus}
              </span>
            )}
            {conn.focusPhase != null && (
              <span className="conn-focus-phase mono">phase {String(conn.focusPhase).padStart(2, '0')}</span>
            )}
          </div>

          <div className="conn-counts mono">
            {conn.totalOut} out · {conn.totalIn} in
          </div>

          {conn.typedOut.length === 0 &&
            conn.typedIn.length === 0 &&
            conn.untypedOut.length === 0 &&
            conn.untypedIn.length === 0 && (
              <div className="conn-empty mono">No connections.</div>
            )}

          {(conn.typedOut.length > 0 || conn.untypedOut.length > 0) && (
            <section className="conn-direction">
              <h4 className="conn-dir-label mono">▶ OUT</h4>
              {conn.typedOut.map((g) => (
                <NeighborGroup key={`out-${g.kind}`} label={KIND_LABEL[g.kind]} neighbors={g.neighbors} onPick={setFocus} projectId={projectId} />
              ))}
              {conn.untypedOut.length > 0 && (
                <NeighborGroup label="(prose mention)" neighbors={conn.untypedOut} onPick={setFocus} projectId={projectId} dim />
              )}
            </section>
          )}

          {(conn.typedIn.length > 0 || conn.untypedIn.length > 0) && (
            <section className="conn-direction">
              <h4 className="conn-dir-label mono">◀ IN</h4>
              {conn.typedIn.map((g) => (
                <NeighborGroup key={`in-${g.kind}`} label={KIND_LABEL[g.kind]} neighbors={g.neighbors} onPick={setFocus} projectId={projectId} />
              ))}
              {conn.untypedIn.length > 0 && (
                <NeighborGroup label="(prose mention)" neighbors={conn.untypedIn} onPick={setFocus} projectId={projectId} dim />
              )}
            </section>
          )}

          <footer className="conn-footer">
            <button
              type="button"
              className="btn-ghost mono"
              onClick={() => navigate(`/p/${projectId}/graph?focus=${encodeURIComponent(conn.focus)}&hop=2`)}
            >
              open in graph ↗
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}

function NeighborGroup({
  label,
  neighbors,
  onPick,
  projectId,
  dim,
}: {
  label: string;
  neighbors: Neighbor[];
  onPick: (id: string) => void;
  projectId: string;
  dim?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className={`conn-group${dim ? ' dim' : ''}`}>
      <div className="conn-group-label mono">{label}</div>
      <ul className="conn-neighbors">
        {neighbors.map((n) => (
          <li key={`${n.direction}-${n.id}`} className="conn-neighbor">
            <button
              type="button"
              className="conn-neighbor-id mono"
              onClick={() => onPick(n.id)}
              title="focus on this id"
            >
              {n.id}
            </button>
            {n.status && (
              <span className={`conn-status-dot status-${n.status.toLowerCase()}`} title={n.status} />
            )}
            <button
              type="button"
              className="conn-neighbor-jump mono"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/p/${projectId}/phase/${n.phase}#${encodeURIComponent(n.id)}`);
              }}
              title="jump to its phase"
            >
              ↗
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

