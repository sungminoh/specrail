import { describe, it, expect } from 'vitest';
import { isInfraStale } from '../src/verify/honesty.js';
import type { IdEvidence } from '../src/verify/types.js';

/**
 * Unit tests for `isInfraStale` — extracted so the round-11 architect's
 * P1 finding ("the taint test in cli-verify exercises NotBuilt
 * propagation, not Stale taint") is now addressed at the actual layer
 * the carve-out logic lives in.
 *
 * The integration tests in cli-verify can only produce stale children
 * via test-grep's `test-ref-no-run` path — the ADR sha-mismatch path
 * isn't aggregated. So the only way to exercise the "single content-
 * stale child taints the parent" branch is to synthesise IdEvidence
 * shapes directly.
 */

function evidence(id: string, fields: Partial<IdEvidence>): IdEvidence {
  return {
    id,
    idType: 'unknown',
    intent: 'Approved',
    reality: 'ManualReview-Stale',
    evidence: [],
    confidence: 'low',
    rule: 'test-grep',
    ...fields,
  };
}

describe('isInfraStale — direct cases', () => {
  it('returns true when the node has test-ref-no-run evidence', () => {
    const ev = evidence('AC-R1-1', {
      evidence: [{ kind: 'test-ref-no-run', path: 'tests/a.test.ts' }],
    });
    expect(isInfraStale(ev, new Map([[ev.id, ev]]))).toBe(true);
  });

  it('returns false when the node has sha-mismatch evidence (content drift)', () => {
    const ev = evidence('ADR-7', {
      evidence: [{ kind: 'sha-mismatch', path: 'src/foo.ts' }],
    });
    expect(isInfraStale(ev, new Map([[ev.id, ev]]))).toBe(false);
  });

  it('returns false when the node has no recognised stale evidence', () => {
    const ev = evidence('X-1', {
      evidence: [{ kind: 'signoff', note: 'manual' }],
    });
    expect(isInfraStale(ev, new Map([[ev.id, ev]]))).toBe(false);
  });
});

describe('isInfraStale — recursive cases', () => {
  it('exonerates a parent whose only stale child is infra-stale', () => {
    const child = evidence('AC-R1-1', {
      evidence: [{ kind: 'test-ref-no-run', path: 'tests/a.test.ts' }],
    });
    const parent = evidence('R1', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '1 child' },
        { kind: 'child:ManualReview-Stale', path: 'AC-R1-1' },
      ],
    });
    const results = new Map([[child.id, child], [parent.id, parent]]);
    expect(isInfraStale(parent, results)).toBe(true);
  });

  it('exonerates a parent with multiple infra-stale children', () => {
    const c1 = evidence('AC-R1-1', {
      evidence: [{ kind: 'test-ref-no-run', path: 'tests/a.test.ts' }],
    });
    const c2 = evidence('AC-R1-2', {
      evidence: [{ kind: 'test-ref-no-run', path: 'tests/b.test.ts' }],
    });
    const parent = evidence('R1', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '2 children' },
        { kind: 'child:ManualReview-Stale', path: 'AC-R1-1' },
        { kind: 'child:ManualReview-Stale', path: 'AC-R1-2' },
      ],
    });
    const results = new Map([
      [c1.id, c1],
      [c2.id, c2],
      [parent.id, parent],
    ]);
    expect(isInfraStale(parent, results)).toBe(true);
  });

  it('REFUSES to exonerate a parent when even one child is content-stale (taint)', () => {
    // This is the architect's P1 regression coverage gap. A single
    // sha-mismatch child must taint the parent — the recursion cannot
    // silently exonerate a Stale parent that has any non-infra child.
    const infraChild = evidence('AC-R1-1', {
      evidence: [{ kind: 'test-ref-no-run', path: 'tests/a.test.ts' }],
    });
    const contentStaleChild = evidence('ADR-7', {
      rule: 'adr-signoff', // realistic: only adr-signoff emits sha-mismatch
      evidence: [{ kind: 'sha-mismatch', path: 'src/foo.ts' }],
    });
    const parent = evidence('R1', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '2 children' },
        { kind: 'child:ManualReview-Stale', path: 'AC-R1-1' },
        { kind: 'child:ManualReview-Stale', path: 'ADR-7' },
      ],
    });
    const results = new Map([
      [infraChild.id, infraChild],
      [contentStaleChild.id, contentStaleChild],
      [parent.id, parent],
    ]);
    expect(isInfraStale(parent, results)).toBe(false);
  });

  it('refuses to exonerate when a cited stale child is missing from results', () => {
    const parent = evidence('R1', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '1 child' },
        { kind: 'child:ManualReview-Stale', path: 'AC-MISSING' },
      ],
    });
    const results = new Map([[parent.id, parent]]);
    expect(isInfraStale(parent, results)).toBe(false);
  });

  it('handles diamond / shared-child correctly (round-11 P2 latent bug fix)', () => {
    // P refers to A and B; both A and B refer to LEAF (infra-stale).
    // The seen set must NOT cause the second sibling walk to false-
    // positive — memoisation by id makes the shared LEAF resolve once
    // to `true` and the cached value answers the second visit.
    const leaf = evidence('AC-R1-LEAF', {
      evidence: [{ kind: 'test-ref-no-run', path: 'tests/leaf.test.ts' }],
    });
    const a = evidence('F1.1', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '1 child' },
        { kind: 'child:ManualReview-Stale', path: 'AC-R1-LEAF' },
      ],
    });
    const b = evidence('F1.2', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '1 child' },
        { kind: 'child:ManualReview-Stale', path: 'AC-R1-LEAF' },
      ],
    });
    const p = evidence('R1', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '2 children' },
        { kind: 'child:ManualReview-Stale', path: 'F1.1' },
        { kind: 'child:ManualReview-Stale', path: 'F1.2' },
      ],
    });
    const results = new Map([
      [leaf.id, leaf],
      [a.id, a],
      [b.id, b],
      [p.id, p],
    ]);
    expect(isInfraStale(p, results)).toBe(true);
  });

  it('handles cycles by refusing to vouch (returns false, no infinite recursion)', () => {
    const a = evidence('CYCLE-A', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '1 child' },
        { kind: 'child:ManualReview-Stale', path: 'CYCLE-B' },
      ],
    });
    const b = evidence('CYCLE-B', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '1 child' },
        { kind: 'child:ManualReview-Stale', path: 'CYCLE-A' },
      ],
    });
    const results = new Map([[a.id, a], [b.id, b]]);
    expect(isInfraStale(a, results)).toBe(false);
    // And the call must terminate — if we got here, the cycle guard worked.
  });

  it('only walks child:ManualReview-Stale evidence (not child:Built, child:NotBuilt etc.)', () => {
    const builtChild = evidence('AC-R1-1', {
      reality: 'Built',
      evidence: [{ kind: 'test-pass', path: 'tests/a.test.ts' }],
    });
    const parent = evidence('R1', {
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: '1 child' },
        { kind: 'child:Built', path: 'AC-R1-1' },
      ],
    });
    const results = new Map([[builtChild.id, builtChild], [parent.id, parent]]);
    // Parent has no stale children to walk — but parent itself has no
    // infra evidence either, so the result is "not infra-stale". The
    // caller would never call isInfraStale on a Built parent, but this
    // confirms the filter narrows correctly.
    expect(isInfraStale(parent, results)).toBe(false);
  });
});
