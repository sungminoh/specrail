import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { api } from '../../lib/api.js';
import { useIdIndex } from '../phases/useIdIndex.js';
import type { EdgeKind } from '../connections/useGraphConnections.js';

const elk = new ELK();

const PHASES = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

// Per OQ-DELTA-1: DESIGN.md "Reading Room" — gold-accent only.
// Differentiate by stroke weight / dasharray / opacity, NOT by adding new hues.
// Four families (grouped meaning) × visual axis:
//   relational ties (parent/depends/linked-arch)  → solid, thicker
//   coverage ties (tested-by/covers-ac)           → dashed
//   value ties    (solves/solves-pains/mitigates) → dotted
//   feature link  (linked-features/linked-ac/...) → solid, thin
const EDGE_STYLE: Record<EdgeKind, { dash?: string; width: number; opacity: number }> = {
  parent:           { width: 2.2, opacity: 0.95 },
  'parent-f':       { width: 2.2, opacity: 0.95 },
  'parent-r':       { width: 2.2, opacity: 0.95 },
  'parent-zone':    { width: 2.2, opacity: 0.95 },
  'depends-on':     { width: 2.0, opacity: 0.9 },
  'linked-arch':    { width: 1.8, opacity: 0.85 },
  'tested-by':      { width: 1.4, opacity: 0.85, dash: '6 3' },
  'covers-ac':      { width: 1.4, opacity: 0.85, dash: '6 3' },
  solves:           { width: 1.4, opacity: 0.85, dash: '1 3' },
  'solves-pains':   { width: 1.4, opacity: 0.85, dash: '1 3' },
  mitigates:        { width: 1.4, opacity: 0.85, dash: '1 3' },
  'linked-features':{ width: 1.0, opacity: 0.75 },
  'linked-ac':      { width: 1.0, opacity: 0.75 },
  'linked-r':       { width: 1.0, opacity: 0.75 },
};
const UNTYPED_STYLE = { width: 0.8, opacity: 0.4 };

export function GraphView() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['graph', projectId],
    queryFn: () => api.getGraph(projectId),
    enabled: !!projectId,
  });
  const { data: idIndex } = useIdIndex(projectId);
  const [phaseFilter, setPhaseFilter] = useState<Set<number>>(new Set(PHASES));
  const [kindFilter, setKindFilter] = useState<string>('');
  const [showOrphans, setShowOrphans] = useState(false);
  const [showDangling, setShowDangling] = useState(false);
  const urlFocus = search.get('focus');
  const urlHop = Number(search.get('hop') ?? '2');
  const [selected, setSelected] = useState<string | null>(urlFocus);
  const [nhop, setNhop] = useState(Number.isFinite(urlHop) ? Math.min(5, Math.max(0, urlHop)) : 2);
  const [focusInput, setFocusInput] = useState(urlFocus ?? '');
  const [showLegend, setShowLegend] = useState(true);
  const [layout, setLayout] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  // URL ↔ state sync (one-way: state → URL on change).
  useEffect(() => {
    const sp = new URLSearchParams(search);
    if (selected) {
      sp.set('focus', selected);
      sp.set('hop', String(nhop));
    } else {
      sp.delete('focus');
      sp.delete('hop');
    }
    if (sp.toString() !== search.toString()) setSearch(sp, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, nhop]);

  const filtered = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    const nodeIds = new Set(data.nodes.map((n) => n.id));
    const inboundCount = new Map<string, number>();
    const outboundCount = new Map<string, number>();
    for (const e of data.edges) {
      outboundCount.set(e.from, (outboundCount.get(e.from) ?? 0) + 1);
      inboundCount.set(e.to, (inboundCount.get(e.to) ?? 0) + 1);
    }

    let nodes = data.nodes.filter((n) => phaseFilter.has(n.phase));
    if (kindFilter) nodes = nodes.filter((n) => n.kind === kindFilter);
    if (showOrphans)
      nodes = nodes.filter((n) => (inboundCount.get(n.id) ?? 0) === 0 && (outboundCount.get(n.id) ?? 0) === 0);

    let edges = data.edges.filter((e) => {
      if (showDangling) return !nodeIds.has(e.to);
      return true;
    });

    if (selected) {
      // Compute N-hop subgraph from selected.
      const visited = new Set<string>([selected]);
      let frontier = [selected];
      for (let i = 0; i < nhop; i++) {
        const next: string[] = [];
        for (const id of frontier) {
          for (const e of data.edges) {
            if (e.from === id && !visited.has(e.to)) { visited.add(e.to); next.push(e.to); }
            if (e.to === id && !visited.has(e.from)) { visited.add(e.from); next.push(e.from); }
          }
        }
        frontier = next;
        if (frontier.length === 0) break;
      }
      nodes = nodes.filter((n) => visited.has(n.id));
      edges = edges.filter((e) => visited.has(e.from) && visited.has(e.to));
    }

    // Cap at 250 for layout cost — collapse to phase-level when too many.
    // Also keep inter-phase edges (folded into phase→phase aggregates) so the
    // user sees real dependency flow even at the bird's-eye view.
    if (nodes.length > 250) {
      const phasesPresent = new Set<number>();
      for (const n of nodes) phasesPresent.add(n.phase);
      const phaseById = new Map(data.nodes.map((n) => [n.id, n.phase]));
      const phaseEdgeSet = new Set<string>();
      const phaseEdges: typeof edges = [];
      for (const e of edges) {
        const fromPhase = phaseById.get(e.from);
        const toPhase = phaseById.get(e.to);
        if (!fromPhase || !toPhase || fromPhase === toPhase) continue;
        const key = `${fromPhase}→${toPhase}`;
        if (phaseEdgeSet.has(key)) continue;
        phaseEdgeSet.add(key);
        phaseEdges.push({
          from: `phase-${fromPhase}`,
          to: `phase-${toPhase}`,
          phase: fromPhase,
          line: 0,
        });
      }
      nodes = [...phasesPresent].sort((a, b) => a - b).map((p) => ({
        id: `phase-${p}`,
        phase: p,
        kind: 'phase-group' as string | null,
      }));
      edges = phaseEdges;
    }

    // Final safety: drop edges whose endpoints aren't in the rendered node set.
    // (Prevents ELK "Referenced shape does not exist" when a typed-ref points at
    // an ID that isn't defined in this project's spec — e.g. PAIN-* in dashboard.)
    const renderedIds = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => renderedIds.has(e.from) && renderedIds.has(e.to));

    return { nodes, edges };
  }, [data, phaseFilter, kindFilter, showOrphans, showDangling, selected, nhop]);

  useEffect(() => {
    if (filtered.nodes.length === 0) {
      setLayout({ nodes: [], edges: [] });
      return;
    }
    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '24',
        'elk.layered.spacing.nodeNodeBetweenLayers': '40',
      },
      children: filtered.nodes.map((n) => ({ id: n.id, width: 120, height: 30 })),
      edges: filtered.edges.map((e, i) => ({ id: `e${i}`, sources: [e.from], targets: [e.to] })),
    };
    elk.layout(elkGraph).then((laid) => {
      const nodes: Node[] = (laid.children ?? []).map((n) => {
        const meta = filtered.nodes.find((m) => m.id === n.id);
        const status = (meta as { status?: string } | undefined)?.status;
        return {
          id: n.id,
          position: { x: n.x ?? 0, y: n.y ?? 0 },
          data: { label: n.id, phase: meta?.phase, kind: meta?.kind, status },
          style: nodeStyleForKind(meta?.kind ?? null, status),
        };
      });
      const edges: Edge[] = filtered.edges.map((e, i) => {
        const kind = (e as { kind?: EdgeKind }).kind;
        const style = kind ? EDGE_STYLE[kind] : UNTYPED_STYLE;
        return {
          id: `e${i}`,
          source: e.from,
          target: e.to,
          animated: false,
          label: kind,
          labelStyle: { fontSize: 9, fill: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' },
          labelShowBg: false,
          style: {
            stroke: kind ? 'var(--accent)' : 'var(--border)',
            strokeWidth: style.width,
            strokeDasharray: getDash(style),
            opacity: style.opacity,
          },
        };
      });
      setLayout({ nodes, edges });
    });
  }, [filtered]);

  if (isLoading) return <div className="placeholder">Loading graph…</div>;
  if (error) return <div className="placeholder">Graph failed: {(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="graph-view">
      <aside className="graph-filters">
        <h3 className="mono graph-filter-title">FILTERS</h3>
        <div className="graph-filter-block">
          <div className="mono filter-label">Phase</div>
          <div className="phase-chips">
            {[...PHASES].map((p) => (
              <button
                key={p}
                className={`phase-chip mono${phaseFilter.has(p) ? ' on' : ''}`}
                onClick={() =>
                  setPhaseFilter((prev) => {
                    const next = new Set(prev);
                    if (next.has(p)) next.delete(p); else next.add(p);
                    return next;
                  })
                }
              >
                {String(p).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
        <div className="graph-filter-block">
          <div className="mono filter-label">Kind</div>
          <select className="mono" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="">all</option>
            {['R', 'F', 'S', 'NFR', 'TC', 'AC', 'INV', 'ADR', 'RISK', 'KPI', 'PERSONA', 'SCEN', 'JNY', 'P-CC', 'W-CC', 'FLN', 'FLE', 'T', 'ARCH', 'EXT'].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="graph-filter-block">
          <label className="mono filter-label">
            <input type="checkbox" checked={showOrphans} onChange={(e) => setShowOrphans(e.target.checked)} /> orphans only
          </label>
        </div>
        <div className="graph-filter-block">
          <label className="mono filter-label">
            <input type="checkbox" checked={showDangling} onChange={(e) => setShowDangling(e.target.checked)} /> dangling refs only
          </label>
        </div>
        {selected && (
          <div className="graph-filter-block">
            <div className="mono filter-label">N-hop from {selected}</div>
            <input type="range" min={0} max={5} value={nhop} onChange={(e) => setNhop(Number(e.target.value))} />
            <div className="mono filter-meta">{nhop} hops</div>
            <button className="btn-ghost mono" onClick={() => setSelected(null)}>clear selection</button>
          </div>
        )}
      </aside>
      <div className="graph-canvas">
        <div className="graph-toolbar">
          <FocusInput
            projectId={projectId}
            idIndex={idIndex}
            value={focusInput}
            onChange={setFocusInput}
            onCommit={(id) => {
              setSelected(id);
              setFocusInput(id);
            }}
            onClear={() => {
              setSelected(null);
              setFocusInput('');
            }}
          />
          {selected && (
            <span className="graph-hop mono">
              <label>hop</label>
              <input type="range" min={0} max={5} value={nhop} onChange={(e) => setNhop(Number(e.target.value))} />
              <span>{nhop}</span>
            </span>
          )}
          <button
            type="button"
            className="btn-ghost mono graph-legend-toggle"
            onClick={() => setShowLegend((v) => !v)}
            title="Toggle legend"
          >
            legend {showLegend ? '▼' : '▶'}
          </button>
        </div>
        {data && data.nodes.length > 250 && filtered.nodes.length <= 13 && !selected && (
          <div className="graph-banner mono">
            Showing phase-level overview ({data.nodes.length} IDs collapsed into {filtered.nodes.length} phase nodes).
            Click a phase to drill into its IDs · type an ID in focus · or filter by Kind / Phase.
          </div>
        )}
        {showLegend && <EdgeLegend />}
        <ReactFlow
          nodes={layout.nodes}
          edges={layout.edges}
          nodesDraggable={false}
          fitView
          onNodeClick={(_e, n) => {
            if (n.id.startsWith('phase-')) {
              const num = Number(n.id.slice(6));
              navigate(`/p/${projectId}/phase/${num}`);
              return;
            }
            setSelected(n.id);
            setFocusInput(n.id);
          }}
        >
          <Background gap={24} color="var(--border)" />
          <Controls />
        </ReactFlow>
        <div className="graph-status mono">
          {filtered.nodes.length} nodes · {filtered.edges.length} edges
          {selected ? ` · focus ${selected}` : ''}
        </div>
      </div>
    </div>
  );
}

function getDash(style: { dash?: string; width: number; opacity: number }): string {
  return style.dash ?? '0';
}

function nodeStyleForKind(kind: string | null, status?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    background: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
    padding: '6px 12px',
  };
  let styled = base;
  switch (kind) {
    case 'R':
    case 'F':
    case 'S':
      styled = { ...base, color: 'var(--accent)', borderColor: 'var(--accent-mute)' }; break;
    case 'NFR':
      styled = { ...base, color: 'var(--success)' }; break;
    case 'TC':
    case 'AC':
      styled = { ...base, color: 'var(--info)' }; break;
    case 'ADR':
    case 'RISK':
      styled = { ...base, color: 'var(--warning)' }; break;
    case 'phase-group':
      styled = { ...base, color: 'var(--text)', background: 'var(--surface)', borderColor: 'var(--accent)' }; break;
    default:
      styled = base;
  }
  // Status tint overrides border / opacity / decoration per OQ-DELTA-1.
  if (status) {
    const s = status.toLowerCase();
    if (s === 'draft' || s === 'proposed') {
      styled = { ...styled, borderColor: 'var(--warning)', borderStyle: 'dashed' };
    } else if (s === 'rejected') {
      styled = { ...styled, opacity: 0.4, textDecoration: 'line-through' };
    }
    // 'approved' / 'accepted' → no override (default state).
  }
  return styled;
}

// Floating legend showing the edge-styling system (OQ-DELTA-1).
function EdgeLegend() {
  return (
    <div className="graph-legend mono" role="complementary">
      <div className="legend-title">EDGE STYLING</div>
      <ul>
        <li><span className="swatch sw-parent" />parent / depends-on / linked-arch</li>
        <li><span className="swatch sw-coverage" />tested-by / covers-ac</li>
        <li><span className="swatch sw-value" />solves / mitigates</li>
        <li><span className="swatch sw-linked" />linked-features / linked-ac / linked-r</li>
        <li><span className="swatch sw-untyped" />(prose mention, no kind)</li>
      </ul>
      <div className="legend-title">STATUS TINT</div>
      <ul>
        <li><span className="status-chip status-approved" />Approved · Accepted</li>
        <li><span className="status-chip status-draft" />Draft · Proposed (dashed border)</li>
        <li><span className="status-chip status-rejected" />Rejected (muted + strikethrough)</li>
      </ul>
    </div>
  );
}

// Typeahead focus input — drives the graph's ego mode without requiring node click.
function FocusInput({
  projectId,
  idIndex,
  value,
  onChange,
  onCommit,
  onClear,
}: {
  projectId: string;
  idIndex: Map<string, { id: string; phase: number; kind: string | null }> | undefined;
  value: string;
  onChange: (v: string) => void;
  onCommit: (id: string) => void;
  onClear: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const suggestions = useMemo(() => {
    if (!value.trim() || !idIndex) return [] as Array<{ id: string; kind: string | null; phase: number }>;
    const q = value.trim().toLowerCase();
    const out: Array<{ id: string; kind: string | null; phase: number }> = [];
    for (const [id, meta] of idIndex) {
      if (id.toLowerCase().includes(q)) out.push({ id, kind: meta.kind, phase: meta.phase });
      if (out.length >= 8) break;
    }
    return out;
  }, [value, idIndex]);

  return (
    <div className="graph-focus-input">
      <input
        type="text"
        className="mono"
        placeholder="focus an ID…  (e.g. R1, NFR-PERF-2)"
        value={value}
        onChange={(e) => { onChange(e.target.value); setActiveIdx(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(suggestions.length - 1, i + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
          else if (e.key === 'Enter') {
            e.preventDefault();
            const pick = suggestions[activeIdx]?.id ?? value.trim();
            if (pick) onCommit(pick);
          } else if (e.key === 'Escape') {
            onClear();
          }
        }}
        aria-label="Focus an ID"
        // suppress unused projectId warning in lint
        data-project={projectId}
      />
      {value && (
        <button type="button" className="graph-focus-clear mono" onClick={onClear} title="Clear focus">×</button>
      )}
      {suggestions.length > 0 && (
        <ul className="graph-focus-suggestions mono">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              className={i === activeIdx ? 'active' : ''}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => onCommit(s.id)}
            >
              <span className="sug-id">{s.id}</span>
              <span className="sug-meta">{s.kind ?? '?'} · phase {String(s.phase).padStart(2, '0')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
