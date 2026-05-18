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

const PHASE_NAMES: Record<number, string> = {
  1: 'PRD', 2: 'Personas', 3: 'Features', 4: 'Domain', 5: 'User Flow',
  6: 'IA', 7: 'Wireframe', 8: 'Architecture', 9: 'NFR', 10: 'Test',
  11: 'Operations', 12: 'ADR · Risks', 13: 'Impl plan',
};
const PHASE_LIST = Object.keys(PHASE_NAMES).map(Number);

// Edge styling per OQ-DELTA-1 — gold accent only, differentiated by weight/dash/opacity.
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

type ViewMode = 'overview' | 'phase' | 'id' | 'quality';
const MODES: ReadonlyArray<{ key: ViewMode; label: string; hint: string }> = [
  { key: 'overview', label: 'Overview', hint: '전체 phase 흐름' },
  { key: 'phase',    label: 'Phase Focus', hint: '한 phase 안의 IDs' },
  { key: 'id',       label: 'ID Focus', hint: '특정 ID 의 ego graph' },
  { key: 'quality',  label: 'Quality', hint: 'orphans + dangling' },
];

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

  // Mode state synced with URL. Default = overview, OR id when ?focus= present (back-compat).
  const urlMode = search.get('mode') as ViewMode | null;
  const urlFocus = search.get('focus');
  const initialMode: ViewMode = urlMode ?? (urlFocus ? 'id' : 'overview');
  const [mode, setMode] = useState<ViewMode>(initialMode);

  // Per-mode state.
  const [focusedPhase, setFocusedPhase] = useState<number>(Number(search.get('phase')) || 1);
  const [selected, setSelected] = useState<string | null>(urlFocus);
  const [nhop, setNhop] = useState<number>(Number(search.get('hop')) || 2);
  const [focusInput, setFocusInput] = useState<string>(urlFocus ?? '');
  const [kindFilter, setKindFilter] = useState<string>('');
  const [showLegend, setShowLegend] = useState<boolean>(false); // closed by default (DELTA-3)
  const [layout, setLayout] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  // URL ← state sync.
  useEffect(() => {
    const sp = new URLSearchParams(search);
    sp.set('mode', mode);
    if (mode === 'phase') sp.set('phase', String(focusedPhase));
    else sp.delete('phase');
    if (mode === 'id' && selected) {
      sp.set('focus', selected);
      sp.set('hop', String(nhop));
    } else {
      sp.delete('focus');
      sp.delete('hop');
    }
    if (sp.toString() !== search.toString()) setSearch(sp, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, focusedPhase, selected, nhop]);

  // ── Compute the rendered subgraph per mode ───────────────────────────────
  const filtered = useMemo(() => {
    if (!data) return { nodes: [], edges: [], dimIds: new Set<string>() };

    if (mode === 'overview') return computeOverview(data);
    if (mode === 'phase')    return computePhaseFocus(data, focusedPhase, kindFilter);
    if (mode === 'quality')  return computeQuality(data);
    return computeIdFocus(data, selected, nhop);
  }, [data, mode, focusedPhase, kindFilter, selected, nhop]);

  // ── ELK layout ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (filtered.nodes.length === 0) {
      setLayout({ nodes: [], edges: [] });
      return;
    }
    const isOverview = mode === 'overview';
    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': isOverview ? '60' : '24',
        'elk.layered.spacing.nodeNodeBetweenLayers': isOverview ? '120' : '40',
        'elk.aspectRatio': isOverview ? '2.0' : '1.6',
      },
      children: filtered.nodes.map((n) => ({
        id: n.id,
        width: isOverview ? 200 : 120,
        height: isOverview ? 60 : 30,
      })),
      edges: filtered.edges.map((e, i) => ({ id: `e${i}`, sources: [e.from], targets: [e.to] })),
    };
    elk.layout(elkGraph).then((laid) => {
      const nodes: Node[] = (laid.children ?? []).map((n) => {
        const meta = filtered.nodes.find((m) => m.id === n.id);
        const status = (meta as { status?: string } | undefined)?.status;
        const dimmed = filtered.dimIds.has(n.id);
        const isPhase = n.id.startsWith('phase-');
        const data: Record<string, unknown> = {
          label: isPhase
            ? `Phase ${String(meta?.phase ?? 0).padStart(2, '0')} · ${PHASE_NAMES[meta?.phase ?? 0] ?? ''}`
            : n.id,
          phase: meta?.phase,
          kind: meta?.kind,
          status,
        };
        return {
          id: n.id,
          position: { x: n.x ?? 0, y: n.y ?? 0 },
          data,
          style: nodeStyleForKind(meta?.kind ?? null, status, dimmed, isPhase),
        };
      });
      const edges: Edge[] = filtered.edges.map((e, i) => {
        const kind = (e as { kind?: EdgeKind }).kind;
        const weight = (e as { weight?: number }).weight ?? 1;
        const style = kind ? EDGE_STYLE[kind] : UNTYPED_STYLE;
        // For overview: scale stroke by aggregate weight (1.5 → 6 px).
        const strokeWidth = mode === 'overview'
          ? Math.min(6, 1.5 + Math.log2(weight))
          : style.width;
        return {
          id: `e${i}`,
          source: e.from,
          target: e.to,
          animated: false,
          label: mode === 'overview' ? `${weight}` : kind,
          labelStyle: { fontSize: 10, fill: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' },
          labelShowBg: mode === 'overview',
          labelBgStyle: { fill: 'var(--surface)', fillOpacity: 0.85 },
          style: {
            stroke: 'var(--accent)',
            strokeWidth,
            strokeDasharray: getDash(style),
            opacity: style.opacity,
          },
        };
      });
      setLayout({ nodes, edges });
    });
  }, [filtered, mode]);

  if (isLoading) return <div className="placeholder">Loading graph…</div>;
  if (error) return <div className="placeholder">Graph failed: {(error as Error).message}</div>;
  if (!data) return null;

  // Sidebar is only shown for Phase Focus (phase chips + kind filter).
  const showSidebar = mode === 'phase';

  return (
    <div className={`graph-view${showSidebar ? '' : ' no-sidebar'}`}>
      {showSidebar && (
        <aside className="graph-filters">
          <h3 className="mono graph-filter-title">PHASE FOCUS</h3>
          <div className="graph-filter-block">
            <div className="mono filter-label">Phase</div>
            <div className="phase-chips">
              {PHASE_LIST.map((p) => (
                <button
                  key={p}
                  className={`phase-chip mono${p === focusedPhase ? ' on' : ''}`}
                  onClick={() => setFocusedPhase(p)}
                  title={PHASE_NAMES[p]}
                >
                  {String(p).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="mono filter-meta" style={{ marginTop: 6 }}>
              {PHASE_NAMES[focusedPhase]}
            </div>
          </div>
          <div className="graph-filter-block">
            <div className="mono filter-label">Kind filter (optional)</div>
            <select className="mono" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">all kinds</option>
              {['R', 'F', 'S', 'NFR', 'TC', 'AC', 'INV', 'ADR', 'RISK', 'KPI', 'PERSONA', 'SCEN', 'JNY', 'P-CC', 'W-CC', 'FLN', 'FLE', 'T', 'ARCH', 'EXT'].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </aside>
      )}
      <div className="graph-canvas">
        <div className="graph-toolbar">
          <div className="graph-mode-tabs" role="tablist">
            {MODES.map((m) => (
              <button
                key={m.key}
                role="tab"
                aria-selected={mode === m.key}
                className={`graph-mode-tab mono${mode === m.key ? ' active' : ''}`}
                onClick={() => {
                  setMode(m.key);
                  if (m.key !== 'id') {
                    setFocusInput('');
                    setSelected(null);
                  }
                }}
                title={m.hint}
              >
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'id' && (
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
          )}
          {mode === 'id' && selected && (
            <span className="graph-hop mono">
              <label>hop</label>
              <input type="range" min={0} max={5} value={nhop} onChange={(e) => setNhop(Number(e.target.value))} />
              <span>{nhop}</span>
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn-ghost mono graph-legend-toggle"
            onClick={() => setShowLegend((v) => !v)}
            title="Toggle legend"
          >
            legend {showLegend ? '▼' : '▶'}
          </button>
        </div>

        {/* Mode-specific hint banner */}
        <ModeBanner mode={mode} focusedPhase={focusedPhase} selected={selected} data={data} filtered={filtered} />

        {showLegend && <EdgeLegend mode={mode} />}

        {mode === 'quality' && filtered.nodes.length === 0 ? (
          <div className="graph-empty-clean">
            <div className="display">All clean.</div>
            <div className="mono">No orphans or dangling refs in this spec.</div>
          </div>
        ) : (
          <ReactFlow
            nodes={layout.nodes}
            edges={layout.edges}
            nodesDraggable={false}
            fitView
            onNodeClick={(_e, n) => {
              if (n.id.startsWith('phase-')) {
                const num = Number(n.id.slice(6));
                setMode('phase');
                setFocusedPhase(num);
                return;
              }
              // ID node click — switch to ID Focus mode with this id.
              setMode('id');
              setSelected(n.id);
              setFocusInput(n.id);
            }}
          >
            <Background gap={24} color="var(--border)" />
            <Controls />
          </ReactFlow>
        )}

        <div className="graph-status mono">
          mode {mode} · {filtered.nodes.length} nodes · {filtered.edges.length} edges
          {mode === 'id' && selected ? ` · focus ${selected}` : ''}
          {mode === 'phase' ? ` · phase ${String(focusedPhase).padStart(2, '0')}` : ''}
        </div>
      </div>
    </div>
  );
}

// ─── Mode-specific filter computations ──────────────────────────────────────

interface RenderedNode { id: string; phase: number; kind: string | null; status?: string }
interface RenderedEdge { from: string; to: string; phase: number; line: number; kind?: EdgeKind; weight?: number }
interface Filtered { nodes: RenderedNode[]; edges: RenderedEdge[]; dimIds: Set<string> }

type GraphData = {
  nodes: Array<{ id: string; phase: number; kind: string | null; status?: string }>;
  edges: Array<{ from: string; to: string; phase: number; line: number; kind?: EdgeKind }>;
};

function computeOverview(data: GraphData): Filtered {
  const phasesPresent = new Set<number>();
  for (const n of data.nodes) phasesPresent.add(n.phase);
  const phaseById = new Map(data.nodes.map((n) => [n.id, n.phase]));
  const weights = new Map<string, number>();
  for (const e of data.edges) {
    const fp = phaseById.get(e.from);
    const tp = phaseById.get(e.to);
    if (!fp || !tp || fp === tp) continue;
    const key = `${fp}→${tp}`;
    weights.set(key, (weights.get(key) ?? 0) + 1);
  }
  const phaseEdges: RenderedEdge[] = [];
  for (const [key, w] of weights) {
    const [fp, tp] = key.split('→').map(Number);
    phaseEdges.push({
      from: `phase-${fp}`,
      to: `phase-${tp}`,
      phase: fp,
      line: 0,
      weight: w,
    });
  }
  const nodes: RenderedNode[] = [...phasesPresent].sort((a, b) => a - b).map((p) => ({
    id: `phase-${p}`,
    phase: p,
    kind: 'phase-group',
  }));
  return { nodes, edges: phaseEdges, dimIds: new Set() };
}

function computePhaseFocus(data: GraphData, phase: number, kindFilter: string): Filtered {
  const inPhase = new Set<string>();
  for (const n of data.nodes) if (n.phase === phase) inPhase.add(n.id);

  // 1-hop boundary: any node connected to an in-phase node, but not in-phase.
  const boundary = new Set<string>();
  for (const e of data.edges) {
    if (inPhase.has(e.from) && !inPhase.has(e.to)) boundary.add(e.to);
    if (inPhase.has(e.to) && !inPhase.has(e.from)) boundary.add(e.from);
  }

  const allowed = new Set<string>([...inPhase, ...boundary]);
  let nodes = data.nodes.filter((n) => allowed.has(n.id));
  if (kindFilter) nodes = nodes.filter((n) => inPhase.has(n.id) ? n.kind === kindFilter : true);

  const renderedIds = new Set(nodes.map((n) => n.id));
  const edges = data.edges.filter((e) => renderedIds.has(e.from) && renderedIds.has(e.to));

  // Boundary nodes are dimmed for visual hierarchy.
  const dimIds = new Set([...boundary].filter((id) => renderedIds.has(id)));
  return { nodes, edges, dimIds };
}

function computeIdFocus(data: GraphData, selected: string | null, nhop: number): Filtered {
  if (!selected) {
    // No focus picked yet — show nothing meaningful; banner instructs user.
    return { nodes: [], edges: [], dimIds: new Set() };
  }
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
  const nodes = data.nodes.filter((n) => visited.has(n.id));
  const renderedIds = new Set(nodes.map((n) => n.id));
  const edges = data.edges.filter((e) => renderedIds.has(e.from) && renderedIds.has(e.to));
  return { nodes, edges, dimIds: new Set() };
}

function computeQuality(data: GraphData): Filtered {
  const nodeIds = new Set(data.nodes.map((n) => n.id));
  const inCount = new Map<string, number>();
  const outCount = new Map<string, number>();
  for (const e of data.edges) {
    outCount.set(e.from, (outCount.get(e.from) ?? 0) + 1);
    inCount.set(e.to, (inCount.get(e.to) ?? 0) + 1);
  }
  const orphans = data.nodes.filter(
    (n) => (inCount.get(n.id) ?? 0) === 0 && (outCount.get(n.id) ?? 0) === 0,
  );
  const danglingTargets = new Set<string>();
  for (const e of data.edges) if (!nodeIds.has(e.to)) danglingTargets.add(e.to);

  // Build synthetic nodes for dangling targets so they're visible.
  const danglingNodes: RenderedNode[] = [...danglingTargets].map((id) => ({
    id,
    phase: 0,
    kind: '⚠ dangling',
  }));
  const nodes = [...orphans, ...danglingNodes];
  const danglingEdges = data.edges.filter((e) => !nodeIds.has(e.to));
  const renderedIds = new Set(nodes.map((n) => n.id));
  // Source of dangling edges must also be in nodes — include the source node if it's not already.
  for (const e of danglingEdges) {
    if (!renderedIds.has(e.from)) {
      const src = data.nodes.find((n) => n.id === e.from);
      if (src) {
        nodes.push(src);
        renderedIds.add(src.id);
      }
    }
  }
  const edges = danglingEdges.filter((e) => renderedIds.has(e.from) && renderedIds.has(e.to));
  return { nodes, edges, dimIds: new Set() };
}

// ─── Mode banner ────────────────────────────────────────────────────────────

function ModeBanner({
  mode,
  focusedPhase,
  selected,
  data,
  filtered,
}: {
  mode: ViewMode;
  focusedPhase: number;
  selected: string | null;
  data: GraphData;
  filtered: Filtered;
}) {
  const total = data.nodes.length;
  if (mode === 'overview') {
    return (
      <div className="graph-banner mono">
        Overview · {total} IDs grouped into 13 phases · edge label = aggregate ref count · click a phase to drill in.
      </div>
    );
  }
  if (mode === 'phase') {
    return (
      <div className="graph-banner mono">
        Phase Focus · {PHASE_NAMES[focusedPhase]} ({filtered.nodes.length} nodes; dimmed = neighbors in other phases) · click an ID to switch to ID Focus.
      </div>
    );
  }
  if (mode === 'id' && !selected) {
    return (
      <div className="graph-banner mono">
        ID Focus · type an ID in the focus input or click any node to start.
      </div>
    );
  }
  if (mode === 'quality' && filtered.nodes.length > 0) {
    return (
      <div className="graph-banner mono">
        Quality · {filtered.nodes.length} nodes need attention (orphans = no in/out edges; ⚠ dangling = referenced but not defined).
      </div>
    );
  }
  return null;
}

// ─── Styling helpers ────────────────────────────────────────────────────────

function getDash(style: { dash?: string; width: number; opacity: number }): string {
  return style.dash ?? '0';
}

function nodeStyleForKind(
  kind: string | null,
  status?: string,
  dimmed = false,
  isPhase = false,
): React.CSSProperties {
  const base: React.CSSProperties = {
    background: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: isPhase ? 13 : 11,
    padding: isPhase ? '14px 18px' : '6px 12px',
    fontWeight: isPhase ? 600 : 400,
  };
  let styled = base;
  if (isPhase) {
    styled = { ...base, background: 'var(--surface)', borderColor: 'var(--accent)', color: 'var(--accent)' };
  } else if (kind === '⚠ dangling') {
    styled = { ...base, color: 'var(--warning)', borderColor: 'var(--warning)', borderStyle: 'dashed' };
  } else {
    switch (kind) {
      case 'R': case 'F': case 'S':
        styled = { ...base, color: 'var(--accent)', borderColor: 'var(--accent-mute)' }; break;
      case 'NFR':
        styled = { ...base, color: 'var(--success)' }; break;
      case 'TC': case 'AC':
        styled = { ...base, color: 'var(--info)' }; break;
      case 'ADR': case 'RISK':
        styled = { ...base, color: 'var(--warning)' }; break;
      default:
        styled = base;
    }
  }
  if (status) {
    const s = status.toLowerCase();
    if (s === 'draft' || s === 'proposed') {
      styled = { ...styled, borderColor: 'var(--warning)', borderStyle: 'dashed' };
    } else if (s === 'rejected') {
      styled = { ...styled, opacity: 0.4, textDecoration: 'line-through' };
    }
  }
  if (dimmed) styled = { ...styled, opacity: 0.45 };
  return styled;
}

// ─── Legend (mode-aware) ────────────────────────────────────────────────────

function EdgeLegend({ mode }: { mode: ViewMode }) {
  if (mode === 'overview') {
    return (
      <div className="graph-legend mono" role="complementary">
        <div className="legend-title">OVERVIEW</div>
        <ul>
          <li>Nodes = 13 phases (PRD → Impl plan)</li>
          <li>Edge label = aggregate ref count between phases</li>
          <li>Edge thickness scales with weight (log₂)</li>
          <li>Click a phase → Phase Focus</li>
        </ul>
      </div>
    );
  }
  if (mode === 'quality') {
    return (
      <div className="graph-legend mono" role="complementary">
        <div className="legend-title">QUALITY</div>
        <ul>
          <li>Orphans: 0 inbound + 0 outbound edges</li>
          <li>⚠ Dangling: referenced ID not defined anywhere</li>
          <li>Edge points from definition → dangling target</li>
        </ul>
      </div>
    );
  }
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

// ─── Focus input typeahead (used in ID Focus mode) ─────────────────────────

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
