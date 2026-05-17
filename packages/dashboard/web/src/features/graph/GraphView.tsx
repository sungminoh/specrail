import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { api } from '../../lib/api.js';

const elk = new ELK();

const PHASES = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

export function GraphView() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['graph', projectId],
    queryFn: () => api.getGraph(projectId),
    enabled: !!projectId,
  });
  const [phaseFilter, setPhaseFilter] = useState<Set<number>>(new Set(PHASES));
  const [kindFilter, setKindFilter] = useState<string>('');
  const [showOrphans, setShowOrphans] = useState(false);
  const [showDangling, setShowDangling] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [nhop, setNhop] = useState(2);
  const [layout, setLayout] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

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
    if (nodes.length > 250) {
      const phasesPresent = new Set<number>();
      for (const n of nodes) phasesPresent.add(n.phase);
      nodes = [...phasesPresent].map((p) => ({
        id: `phase-${p}`,
        phase: p,
        kind: 'phase-group' as string | null,
      }));
      edges = [];
    }

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
        return {
          id: n.id,
          position: { x: n.x ?? 0, y: n.y ?? 0 },
          data: { label: n.id, phase: meta?.phase, kind: meta?.kind },
          style: nodeStyleForKind(meta?.kind ?? null),
        };
      });
      const edges: Edge[] = filtered.edges.map((e, i) => ({
        id: `e${i}`,
        source: e.from,
        target: e.to,
        animated: false,
        style: { stroke: 'var(--border)' },
      }));
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
          }}
        >
          <Background gap={24} color="var(--border)" />
          <Controls />
        </ReactFlow>
        <div className="graph-status mono">
          {filtered.nodes.length} nodes · {filtered.edges.length} edges
          {selected ? ` · selected ${selected}` : ''}
        </div>
      </div>
    </div>
  );
}

function nodeStyleForKind(kind: string | null): React.CSSProperties {
  const base: React.CSSProperties = {
    background: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
    padding: '6px 12px',
  };
  switch (kind) {
    case 'R':
    case 'F':
    case 'S':
      return { ...base, color: 'var(--accent)', borderColor: 'var(--accent-mute)' };
    case 'NFR':
      return { ...base, color: 'var(--success)' };
    case 'TC':
      return { ...base, color: 'var(--info)' };
    case 'AC':
      return { ...base, color: 'var(--info)' };
    case 'ADR':
    case 'RISK':
      return { ...base, color: 'var(--warning)' };
    case 'phase-group':
      return { ...base, color: 'var(--text)', background: 'var(--surface)', borderColor: 'var(--accent)' };
    default:
      return base;
  }
}
