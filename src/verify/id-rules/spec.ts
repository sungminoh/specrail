/**
 * R/F/S spec aggregation.
 *
 * R{n} aggregates over its AC-R{n}-* and F{n}.* descendants.
 * F{n}.{m} aggregates over its S{n}.{m}.* descendants AND any AC that
 *   transitively belongs (via the parent R).
 * S{n}.{m}.{l} is a leaf — handled by the path-existence rule (the
 *   spec body typically declares Files:).
 */

import type { IdEvidence, RealityState } from '../types.js';
import { pathRule } from './path.js';
import type { IdRule } from '../runner.js';

export const sLeafRule: IdRule = {
  id: 's-files',
  async apply(args) {
    const inner = await pathRule.apply(args);
    return { ...inner, rule: 's-files' };
  },
};

/**
 * Combine child reality states into a parent state.
 */
export function rollup(children: readonly IdEvidence[]): {
  reality: RealityState;
  confidence: 'high' | 'medium' | 'low';
} {
  if (children.length === 0)
    return { reality: 'ManualReview', confidence: 'low' };

  let built = 0,
    partial = 0,
    notBuilt = 0,
    manualStale = 0,
    manualReview = 0;
  for (const c of children) {
    switch (c.reality) {
      case 'Built':
        built++;
        break;
      case 'Partial':
        partial++;
        break;
      case 'NotBuilt':
        notBuilt++;
        break;
      case 'ManualReview':
        manualReview++;
        break;
      case 'ManualReview-Stale':
        manualStale++;
        break;
    }
  }

  // ManualReview / ManualReview-Stale should not override a clear
  // dominant child state — the architect flagged that "any stale =>
  // entire R stale" was too contagious. Only propagate when there is
  // no concrete child evidence.
  const concrete = built + partial + notBuilt;
  if (concrete === 0) {
    if (manualStale > 0)
      return { reality: 'ManualReview-Stale', confidence: 'low' };
    if (manualReview > 0)
      return { reality: 'ManualReview', confidence: 'low' };
  }

  if (notBuilt === children.length) return { reality: 'NotBuilt', confidence: 'medium' };
  if (built === children.length && manualReview + manualStale === 0)
    return { reality: 'Built', confidence: 'medium' };
  return { reality: 'Partial', confidence: 'medium' };
}

interface RfsParts {
  readonly tier: 'R' | 'F' | 'S';
  readonly r?: number;
  readonly f?: number;
  readonly s?: number;
}

function parseRfs(id: string): RfsParts | null {
  let m = /^R(\d+)$/.exec(id);
  if (m) return { tier: 'R', r: Number(m[1]) };
  m = /^F(\d+)\.(\d+)$/.exec(id);
  if (m) return { tier: 'F', r: Number(m[1]), f: Number(m[2]) };
  m = /^S(\d+)\.(\d+)\.(\d+)$/.exec(id);
  if (m) return { tier: 'S', r: Number(m[1]), f: Number(m[2]), s: Number(m[3]) };
  return null;
}

/**
 * Mutate `results` in place: for every R{n} / F{n}.{m} entry, replace
 * its reality with the rolled-up aggregation of its children.
 */
export function applyRfsAggregation(results: Map<string, IdEvidence>): void {
  const byR = new Map<number, IdEvidence[]>();
  const byF = new Map<string, IdEvidence[]>();

  for (const ev of results.values()) {
    if (ev.idType === 'AC') {
      const m = /^AC-R(\d+)-\d+$/.exec(ev.id);
      if (m) {
        const r = Number(m[1]);
        (byR.get(r) ?? byR.set(r, []).get(r)!).push(ev);
      }
      continue;
    }
    const parts = parseRfs(ev.id);
    if (!parts) continue;
    if (parts.tier === 'F' && parts.r != null) {
      (byR.get(parts.r) ?? byR.set(parts.r, []).get(parts.r)!).push(ev);
    }
    if (parts.tier === 'S' && parts.r != null && parts.f != null) {
      const key = `${parts.r}.${parts.f}`;
      (byF.get(key) ?? byF.set(key, []).get(key)!).push(ev);
    }
  }

  // Second pass: S leaves whose parent F is NOT defined in the spec
  // should still contribute to R aggregation directly. Architect
  // pointed out the original loop double-counted S via both byF and
  // byR; this guard fixes that.
  for (const ev of results.values()) {
    const parts = parseRfs(ev.id);
    if (parts?.tier !== 'S' || parts.r == null || parts.f == null) continue;
    const parentFId = `F${parts.r}.${parts.f}`;
    if (results.has(parentFId)) continue;
    (byR.get(parts.r) ?? byR.set(parts.r, []).get(parts.r)!).push(ev);
  }

  for (const [key, kids] of byF) {
    const fId = `F${key}`;
    const fNode = results.get(fId);
    if (!fNode) continue;
    const { reality, confidence } = rollup(kids);
    results.set(fId, {
      ...fNode,
      reality,
      confidence,
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: `${kids.length} child(ren)` },
        ...kids.map((c) => ({ kind: `child:${c.reality}`, path: c.id })),
      ],
    });
  }

  for (const [r, kids] of byR) {
    const rId = `R${r}`;
    const rNode = results.get(rId);
    if (!rNode) continue;
    const refreshed = kids.map((c) => results.get(c.id) ?? c);
    const { reality, confidence } = rollup(refreshed);
    results.set(rId, {
      ...rNode,
      reality,
      confidence,
      rule: 'rfs-aggregate',
      evidence: [
        { kind: 'aggregated-children', note: `${refreshed.length} child(ren)` },
        ...refreshed.map((c) => ({ kind: `child:${c.reality}`, path: c.id })),
      ],
    });
  }
}
