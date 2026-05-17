// T-CSA.4 — typed edges from attrs blocks
// Linked TC: TC-80 (per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md)
// Linked AC: AC-R-CSA-4 (unknown kind → ERROR)
//
// Maps YAML field names (plural-noun, author-facing) → edge kind
// (singular-verb, closed enum 8, proposal §3.4):
//   solves-pains      → solves
//   linked-features   → linked-features
//   linked-tests      → tested-by
//   linked-ac         → covers-ac
//   mitigates-risks   → mitigates
//   linked-arch       → linked-arch
//   parent-r / -f / -t→ parent
//   depends-on        → depends-on

import { describe, it, expect } from 'vitest';
import { buildTypedEdges, FIELD_TO_KIND_MAP, type TypedEdge } from '../src/graph/builder.js';
import type { AttrsBlock } from '../src/markdown/attrs.js';

function block(
  entityId: string,
  payload: Record<string, unknown>,
  sourceFile = 'test.md',
  start = 10,
): AttrsBlock {
  return {
    entityId,
    payload,
    lineRange: { start, end: start + 5 },
    sourceFile,
  };
}

describe('FIELD_TO_KIND_MAP (T-CSA.4, proposal §3.4)', () => {
  it('maps all known plural-noun fields to singular-verb kinds', () => {
    expect(FIELD_TO_KIND_MAP['solves-pains']).toBe('solves');
    expect(FIELD_TO_KIND_MAP['linked-features']).toBe('linked-features');
    expect(FIELD_TO_KIND_MAP['linked-tests']).toBe('tested-by');
    expect(FIELD_TO_KIND_MAP['linked-ac']).toBe('covers-ac');
    expect(FIELD_TO_KIND_MAP['mitigates-risks']).toBe('mitigates');
    expect(FIELD_TO_KIND_MAP['linked-arch']).toBe('linked-arch');
    expect(FIELD_TO_KIND_MAP['parent-r']).toBe('parent');
    expect(FIELD_TO_KIND_MAP['parent-f']).toBe('parent');
    expect(FIELD_TO_KIND_MAP['parent-t']).toBe('parent');
    expect(FIELD_TO_KIND_MAP['depends-on']).toBe('depends-on');
  });

  it('does not map scalar-metadata fields (linked-r, state-machine, etc.)', () => {
    // Per proposal §5: ENT-* `linked-r` is scalar metadata, not a typed edge.
    expect(FIELD_TO_KIND_MAP['linked-r']).toBeUndefined();
    expect(FIELD_TO_KIND_MAP['linked-ext']).toBeUndefined();
    expect(FIELD_TO_KIND_MAP['linked-nfr']).toBeUndefined();
    expect(FIELD_TO_KIND_MAP['state-machine']).toBeUndefined();
    expect(FIELD_TO_KIND_MAP['status']).toBeUndefined();
    expect(FIELD_TO_KIND_MAP['importance']).toBeUndefined();
  });
});

describe('buildTypedEdges — list-valued fields (T-CSA.4, TC-80)', () => {
  it('emits one edge per item in solves-pains list', () => {
    const edges = buildTypedEdges([
      block('R3', { 'solves-pains': ['PAIN-3', 'PAIN-7'] }),
    ]);
    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({ from: 'R3', to: 'PAIN-3', kind: 'solves' });
    expect(edges[1]).toMatchObject({ from: 'R3', to: 'PAIN-7', kind: 'solves' });
  });

  it('emits edges from linked-features', () => {
    const edges = buildTypedEdges([
      block('R1', { 'linked-features': ['F-R1.1', 'F-R1.2'] }),
    ]);
    expect(edges).toHaveLength(2);
    expect(edges.every((e) => e.kind === 'linked-features')).toBe(true);
    expect(edges.map((e) => e.to)).toEqual(['F-R1.1', 'F-R1.2']);
  });

  it('emits edges from linked-tests as tested-by', () => {
    const edges = buildTypedEdges([
      block('R5', { 'linked-tests': ['TC-12', 'TC-13'] }),
    ]);
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'R5', to: 'TC-12', kind: 'tested-by' }),
        expect.objectContaining({ from: 'R5', to: 'TC-13', kind: 'tested-by' }),
      ]),
    );
  });

  it('emits edges from mitigates-risks', () => {
    const edges = buildTypedEdges([
      block('ARCH-15', { 'mitigates-risks': ['RISK-CSA-1', 'RISK-CSA-3'] }),
    ]);
    expect(edges).toHaveLength(2);
    expect(edges.every((e) => e.kind === 'mitigates')).toBe(true);
  });
});

describe('buildTypedEdges — scalar fields (T-CSA.4)', () => {
  it('emits parent edge from scalar parent-r', () => {
    const edges = buildTypedEdges([
      block('F-R1.1', { 'parent-r': 'R1' }),
    ]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ from: 'F-R1.1', to: 'R1', kind: 'parent' });
  });

  it('emits parent edge from scalar parent-f', () => {
    const edges = buildTypedEdges([
      block('S1.1.1', { 'parent-f': 'F-R1.1' }),
    ]);
    expect(edges).toHaveLength(1);
    expect(edges[0].kind).toBe('parent');
  });
});

describe('buildTypedEdges — depends-on (T-CSA.4)', () => {
  it('emits depends-on edges between tasks', () => {
    const edges = buildTypedEdges([
      block('T-CSA.5', { 'depends-on': ['T-CSA.1', 'T-CSA.3'] }),
    ]);
    expect(edges).toHaveLength(2);
    expect(edges.every((e) => e.kind === 'depends-on')).toBe(true);
    expect(edges.map((e) => e.to)).toEqual(['T-CSA.1', 'T-CSA.3']);
  });
});

describe('buildTypedEdges — scalar-metadata fields produce NO typed edges', () => {
  it('linked-r on ENT-* does NOT emit typed edge (scalar metadata)', () => {
    const edges = buildTypedEdges([
      block('ENT-Project', { status: 'Approved', 'aggregate-root': true, 'linked-r': ['R6'] }),
    ]);
    expect(edges).toEqual([]);
  });

  it('state-machine, status, importance fields produce NO edges', () => {
    const edges = buildTypedEdges([
      block('R1', {
        status: 'Approved',
        importance: 'P0',
        owner: 'PERSONA-1',
        'state-machine': 'SM-X',
      }),
    ]);
    expect(edges).toEqual([]);
  });
});

describe('buildTypedEdges — provenance + edge cases', () => {
  it('preserves sourceFile and line in each edge', () => {
    const edges = buildTypedEdges([
      block('R3', { 'solves-pains': ['PAIN-3'] }, 'docs/spec/03-features.md', 42),
    ]);
    expect(edges[0].sourceFile).toBe('docs/spec/03-features.md');
    expect(edges[0].line).toBe(42);
  });

  it('emits union of edges across multiple blocks', () => {
    const edges = buildTypedEdges([
      block('R1', { 'linked-features': ['F-R1.1'] }),
      block('F-R1.1', { 'parent-r': 'R1' }),
    ]);
    expect(edges).toHaveLength(2);
    expect(edges.map((e) => e.kind).sort()).toEqual(['linked-features', 'parent']);
  });

  it('ignores non-string array items defensively', () => {
    const edges = buildTypedEdges([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      block('R3', { 'solves-pains': ['PAIN-3', 42 as any, null as any, 'PAIN-7'] }),
    ]);
    expect(edges.map((e) => e.to)).toEqual(['PAIN-3', 'PAIN-7']);
  });

  it('returns empty array for blocks with no edge-producing fields', () => {
    const edges = buildTypedEdges([
      block('PERSONA-1', { alias: 'Builder', role: 'CC user', 'primary-pain': 'PAIN-3' }),
    ]);
    expect(edges).toEqual([]);
  });

  it('returns empty array for empty blocks input', () => {
    expect(buildTypedEdges([])).toEqual([]);
  });
});

describe('TypedEdge shape (T-CSA.4)', () => {
  it('has from / to / kind / optional sourceFile / line', () => {
    const edges = buildTypedEdges([
      block('R1', { 'linked-features': ['F-R1.1'] }),
    ]);
    const e: TypedEdge = edges[0];
    expect(typeof e.from).toBe('string');
    expect(typeof e.to).toBe('string');
    expect(typeof e.kind).toBe('string');
  });
});
