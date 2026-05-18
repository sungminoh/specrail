import { describe, it, expect } from 'vitest';
import {
  parseAttrsBlocks,
  extractTypedRefs,
  EDGE_KINDS,
  type EdgeKind,
} from '../src/spec/attrs.js';

describe('parseAttrsBlocks', () => {
  it('returns empty array when no attrs blocks present', () => {
    expect(parseAttrsBlocks('# Hello\n\nNo attrs here.')).toEqual([]);
  });

  it('extracts id + status scalar from a single attrs block', () => {
    const body = `# R1

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->`;
    const blocks = parseAttrsBlocks(body);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      id: 'R1',
      scalars: { status: 'Approved', importance: 'P0', owner: 'PERSONA-1' },
    });
    expect(blocks[0]?.startLine).toBe(3);
  });

  it('handles multiple consecutive attrs blocks in one section', () => {
    const body = `## NFR Perf

<!-- specrail:attrs id=NFR-PERF-1 -->
\`\`\`yaml
status: Approved
target: "≤2"
\`\`\`
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-2 -->
\`\`\`yaml
status: Draft
target: "≤200"
\`\`\`
<!-- /specrail:attrs -->`;
    const blocks = parseAttrsBlocks(body);
    expect(blocks.map((b) => b.id)).toEqual(['NFR-PERF-1', 'NFR-PERF-2']);
    expect(blocks[0]?.scalars.status).toBe('Approved');
    expect(blocks[1]?.scalars.status).toBe('Draft');
  });

  it('strips quotes around scalar values', () => {
    const body = `<!-- specrail:attrs id=X -->
\`\`\`yaml
status: "Approved"
owner: 'PERSONA-1'
\`\`\`
<!-- /specrail:attrs -->`;
    const blocks = parseAttrsBlocks(body);
    expect(blocks[0]?.scalars).toEqual({ status: 'Approved', owner: 'PERSONA-1' });
  });

  it('ignores non-scalar keys (edge kinds, custom keys)', () => {
    const body = `<!-- specrail:attrs id=X -->
\`\`\`yaml
status: Approved
linked-arch: [ARCH-1, ARCH-2]
custom-field: whatever
\`\`\`
<!-- /specrail:attrs -->`;
    const blocks = parseAttrsBlocks(body);
    expect(blocks[0]?.scalars).toEqual({ status: 'Approved' });
  });
});

describe('extractTypedRefs (TC-TYPED-REFS-1: all 8 edge kinds)', () => {
  it('surfaces all 8 closed-enum edge kinds — inline yaml lists', () => {
    const body = `<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
solves: [PAIN-1]
linked-features: [F1.1]
parent: [R0]
tested-by: [TC-1]
covers-ac: [AC-R1-1]
mitigates: [RISK-1]
linked-arch: [ARCH-1]
depends-on: [F2.1]
\`\`\`
<!-- /specrail:attrs -->`;
    const refs = extractTypedRefs(body);
    expect(refs).toHaveLength(8);
    const byKind = Object.fromEntries(refs.map((r) => [r.kind, r.to]));
    expect(byKind).toEqual({
      solves: 'PAIN-1',
      'linked-features': 'F1.1',
      parent: 'R0',
      'tested-by': 'TC-1',
      'covers-ac': 'AC-R1-1',
      mitigates: 'RISK-1',
      'linked-arch': 'ARCH-1',
      'depends-on': 'F2.1',
    });
    for (const r of refs) expect(r.from).toBe('R1');
  });

  it('handles block-list yaml syntax (- ARCH-1 / - ARCH-2)', () => {
    const body = `<!-- specrail:attrs id=R2 -->
\`\`\`yaml
status: Approved
tested-by:
  - TC-12
  - TC-13
linked-arch:
  - ARCH-4
\`\`\`
<!-- /specrail:attrs -->`;
    const refs = extractTypedRefs(body);
    expect(refs).toHaveLength(3);
    expect(refs.filter((r) => r.kind === 'tested-by').map((r) => r.to)).toEqual(['TC-12', 'TC-13']);
    expect(refs.filter((r) => r.kind === 'linked-arch').map((r) => r.to)).toEqual(['ARCH-4']);
  });

  it('handles multiple ids in an inline list', () => {
    const body = `<!-- specrail:attrs id=X -->
\`\`\`yaml
linked-arch: [ARCH-1, ARCH-2, ARCH-3]
\`\`\`
<!-- /specrail:attrs -->`;
    const refs = extractTypedRefs(body);
    expect(refs.map((r) => r.to)).toEqual(['ARCH-1', 'ARCH-2', 'ARCH-3']);
    for (const r of refs) expect(r.kind).toBe('linked-arch');
  });

  it('IGNORES yaml keys not in the closed enum (e.g. custom-rel)', () => {
    const body = `<!-- specrail:attrs id=X -->
\`\`\`yaml
custom-relation: [ARCH-9]
\`\`\`
<!-- /specrail:attrs -->`;
    const refs = extractTypedRefs(body);
    expect(refs).toEqual([]);
  });

  it('returns empty for body with no attrs blocks', () => {
    expect(extractTypedRefs('Just prose mentioning R1 and ARCH-2.')).toEqual([]);
  });

  it('attributes refs across multiple attrs blocks correctly (from)', () => {
    const body = `<!-- specrail:attrs id=A -->
\`\`\`yaml
linked-arch: [ARCH-1]
\`\`\`
<!-- /specrail:attrs -->

<!-- specrail:attrs id=B -->
\`\`\`yaml
linked-arch: [ARCH-2]
\`\`\`
<!-- /specrail:attrs -->`;
    const refs = extractTypedRefs(body);
    expect(refs).toHaveLength(2);
    expect(refs[0]).toMatchObject({ from: 'A', to: 'ARCH-1', kind: 'linked-arch' });
    expect(refs[1]).toMatchObject({ from: 'B', to: 'ARCH-2', kind: 'linked-arch' });
  });

  it('reports the line number of each ref', () => {
    const body = `<!-- specrail:attrs id=X -->
\`\`\`yaml
linked-arch: [ARCH-1]
\`\`\`
<!-- /specrail:attrs -->`;
    const refs = extractTypedRefs(body);
    expect(refs[0]?.line).toBe(3);
  });
});

describe('extractTypedRefs (EDGE-MALFORMED-ATTRS)', () => {
  it('does NOT throw on malformed yaml; other keys still produce refs', () => {
    const body = `<!-- specrail:attrs id=X -->
\`\`\`yaml
linked-arch: [ARCH-
tested-by: [TC-1]
\`\`\`
<!-- /specrail:attrs -->`;
    expect(() => extractTypedRefs(body)).not.toThrow();
    const refs = extractTypedRefs(body);
    // The malformed line ("[ARCH-") still contains an ID-shaped token "ARCH-1"?
    // No — "ARCH-" alone doesn't match (no digit). So malformed line produces 0 refs.
    // tested-by line MUST still produce TC-1.
    expect(refs.find((r) => r.kind === 'tested-by')?.to).toBe('TC-1');
  });

  it('attrs block missing the closing marker — does not crash on EOF', () => {
    const body = `<!-- specrail:attrs id=X -->
\`\`\`yaml
linked-arch: [ARCH-1]
`;
    expect(() => extractTypedRefs(body)).not.toThrow();
    const refs = extractTypedRefs(body);
    // Best-effort: should still extract ARCH-1 from the open block.
    expect(refs.some((r) => r.to === 'ARCH-1' && r.kind === 'linked-arch')).toBe(true);
  });
});

describe('EDGE_KINDS export', () => {
  it('includes the 8 schema-defined closed-enum kinds first', () => {
    expect(EDGE_KINDS.slice(0, 8)).toEqual([
      'solves',
      'linked-features',
      'parent',
      'tested-by',
      'covers-ac',
      'mitigates',
      'linked-arch',
      'depends-on',
    ]);
  });

  it('also recognizes qualified variants used in real specs', () => {
    // These are not in schemas/attrs.schema.json but appear in dashboard's own spec
    // (parent-f / parent-r / parent-zone, linked-ac / linked-r, solves-pains).
    for (const k of ['parent-f', 'parent-r', 'linked-ac', 'linked-r', 'solves-pains'] as const) {
      expect(EDGE_KINDS).toContain(k);
    }
  });

  it('EdgeKind type is assignable from EDGE_KINDS values', () => {
    const k: EdgeKind = 'tested-by';
    expect(EDGE_KINDS).toContain(k);
  });
});
