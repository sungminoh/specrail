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

  it('NFR-PERF-2 — nHop traverses ALL 500 nodes in dense graph within 200ms (3-run median)', () => {
    const phases: Phase[] = [];
    const ids: string[] = [];
    for (let i = 1; i <= 500; i++) ids.push(`S1.1.${i}`);
    // Hub-and-spoke: id[0] (hub) connects to every other id. Every id is reachable in 1 hop.
    // Then add chain among non-hub ids for branching depth.
    const refs: Array<[string, string, number]> = [];
    for (let i = 1; i < ids.length; i++) {
      refs.push([ids[i]!, ids[0]!, i]); // i → hub
    }
    // additional chain: i → i+1 (creates branching factor)
    for (let i = 1; i + 1 < ids.length; i++) {
      refs.push([ids[i]!, ids[i + 1]!, i + 1000]);
    }
    phases.push(mkPhase(3, ids, refs));
    const g = buildGraph(phases, classifyKind);
    // 3-run median to smooth CPU jitter on CI.
    const samples: number[] = [];
    let lastSub: ReturnType<typeof nHop> | null = null;
    for (let run = 0; run < 3; run++) {
      const t0 = performance.now();
      // hop=99 → BFS exhausts the whole reachable component.
      lastSub = nHop(g, ids[0]!, 99);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const median = samples[1]!;
    expect(lastSub).not.toBeNull();
    // Must cover ALL nodes (not just neighbors of seed).
    expect(lastSub!.nodes).toHaveLength(500);
    expect(median).toBeLessThan(200);
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
