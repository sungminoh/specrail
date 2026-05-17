import { describe, it, expect } from 'vitest';
import { buildGraph } from '../src/graph/build.js';
import { nHop } from '../src/graph/nhop.js';
import { findOrphans, findDanglingRefs } from '../src/graph/orphan.js';
import { classifyKind } from '../src/spec/ids.js';
import type { Phase } from '../src/spec/types.js';

function mkPhase(num: 1 | 2 | 3 | 4, defines: string[], refs: Array<[string, string, number]>): Phase {
  return {
    projectId: 'aaaaaaaaaaaaaaaa',
    number: num,
    slug: `phase-${num}`,
    filePath: `docs/spec/0${num}-x.md`,
    frontmatter: { phase: num, status: 'Approved' },
    body: '',
    parsedIds: defines,
    parsedRefs: refs.map(([from, to, line]) => ({ from, to, line })),
    mtimeMs: 0,
  };
}

describe('buildGraph', () => {
  it('builds nodes, edges, inbound/outbound', () => {
    const phases = [
      mkPhase(1, ['R1'], []),
      mkPhase(3, ['F1.1'], [['F1.1', 'R1', 5]]),
      mkPhase(10, ['TC-1'], [['TC-1', 'F1.1', 8]]),
    ];
    const g = buildGraph(phases, classifyKind);
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['F1.1', 'R1', 'TC-1']);
    expect(g.edges).toHaveLength(2);
    expect(g.inbound.get('R1')).toHaveLength(1);
    expect(g.outbound.get('TC-1')).toHaveLength(1);
  });
});

describe('nHop', () => {
  it('hop=0 returns seed only', () => {
    const phases = [mkPhase(1, ['R1'], []), mkPhase(3, ['F1.1'], [['F1.1', 'R1', 1]])];
    const g = buildGraph(phases, classifyKind);
    const sub = nHop(g, 'R1', 0);
    expect(sub.nodes.map((n) => n.id)).toEqual(['R1']);
    expect(sub.edges).toEqual([]);
  });

  it('hop=1 includes inbound + outbound neighbors', () => {
    const phases = [
      mkPhase(1, ['R1'], []),
      mkPhase(3, ['F1.1', 'F1.2'], [['F1.1', 'R1', 1], ['F1.2', 'R1', 2]]),
      mkPhase(10, ['TC-1'], [['TC-1', 'F1.1', 1]]),
    ];
    const g = buildGraph(phases, classifyKind);
    const sub = nHop(g, 'R1', 1);
    expect(sub.nodes.map((n) => n.id).sort()).toEqual(['F1.1', 'F1.2', 'R1']);
    expect(sub.edges).toHaveLength(2);
  });

  it('handles 500-node graph within budget', () => {
    const phases: Phase[] = [];
    const ids: string[] = [];
    for (let i = 1; i <= 500; i++) ids.push(`S1.1.${i}`);
    phases.push(mkPhase(3, ids, ids.slice(1).map((id, idx) => [id, ids[idx]!, idx + 1])));
    const g = buildGraph(phases, classifyKind);
    const t0 = performance.now();
    const sub = nHop(g, ids[0]!, 3);
    const dt = performance.now() - t0;
    expect(sub.nodes.length).toBeGreaterThan(1);
    expect(dt).toBeLessThan(200);
  });
});

describe('orphan / dangling', () => {
  it('detects orphan (no in or out edges)', () => {
    const phases = [mkPhase(1, ['R1', 'R2'], []), mkPhase(3, ['F1.1'], [['F1.1', 'R1', 1]])];
    const g = buildGraph(phases, classifyKind);
    expect(findOrphans(g)).toEqual(['R2']);
  });

  it('detects dangling refs (to unknown id)', () => {
    const phases = [mkPhase(3, ['F1.1'], [['F1.1', 'R99', 7]])];
    const g = buildGraph(phases, classifyKind);
    const dangling = findDanglingRefs(g);
    expect(dangling).toHaveLength(1);
    expect(dangling[0]?.to).toBe('R99');
    expect(dangling[0]?.line).toBe(7);
  });
});
