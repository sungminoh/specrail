/**
 * Honesty-check helpers — kept separate from `cli/verify.ts` so the
 * recursion logic is unit-testable in isolation.
 *
 * The `--check-honesty` flag must distinguish two flavours of staleness
 * that look identical at the `ManualReview-Stale` reality state:
 *
 *   - Content drift (lie): ADR sign-off SHA no longer matches HEAD —
 *     `kind: 'sha-mismatch'`. The author asserted finality based on a
 *     specific commit; that commit moved. This IS a lie.
 *
 *   - Infrastructure absence (NOT a lie): `--no-tests` was passed, so
 *     vitest never ran and test-grep could not classify Built/Partial.
 *     The evidence kind is `test-ref-no-run`. The verifier has no
 *     signal yet; that is not the same as a broken promise.
 *
 * The rfs-aggregate rollup compounds the problem: an R parent whose AC
 * children are ALL infra-stale rolls up to ManualReview-Stale itself,
 * but its evidence array contains `child:ManualReview-Stale` paths,
 * NOT the original `test-ref-no-run` markers. The honesty check must
 * recurse through `child:ManualReview-Stale` evidence to recover the
 * original signal — and refuse to exonerate when ANY child is content-
 * stale, missing, or part of a cycle.
 *
 * Round-11 architect feedback flagged three previous-round bugs:
 *   - shared-child diamond produced false negatives (single `seen` set
 *     was shared across sibling walks)
 *   - parameter types were inline anonymous, losing the EvidenceKind
 *     discriminated-union benefit
 *   - the helper was buried inside cli/verify.ts and effectively
 *     untestable in isolation
 * All three are addressed here.
 */

import type { IdEvidence } from './types.js';

type Memo = Map<string, 'computing' | boolean>;

/**
 * Returns true when an Approved ManualReview-Stale entry is stale ONLY
 * because of `--no-tests` infrastructure absence, not content drift.
 *
 * Memoised by `ev.id` so a shared transitive descendant (diamond) is
 * computed once. The transient `'computing'` marker handles cycles
 * conservatively: if we re-enter a node mid-computation, we refuse to
 * vouch (return false) rather than silently exonerate.
 */
export function isInfraStale(
  ev: IdEvidence,
  results: ReadonlyMap<string, IdEvidence>,
  memo: Memo = new Map(),
): boolean {
  const cached = memo.get(ev.id);
  if (cached === 'computing') return false; // cycle — refuse to vouch
  if (cached !== undefined) return cached;
  memo.set(ev.id, 'computing');

  const result = compute(ev, results, memo);
  memo.set(ev.id, result);
  return result;
}

function compute(
  ev: IdEvidence,
  results: ReadonlyMap<string, IdEvidence>,
  memo: Memo,
): boolean {
  // Direct case — this node's own evidence carries the test-ref-no-run
  // marker that the test-grep rule produces under `--no-tests`.
  if (ev.evidence.some((e) => e.kind === 'test-ref-no-run')) return true;

  // Recursive case — rfs-aggregate parents carry child:ManualReview-Stale
  // evidence pointing at the stale children. Parent inherits infra-only
  // staleness when EVERY stale child is itself infra-stale. One content-
  // stale child (sha-mismatch, future kinds) taints the parent.
  const staleChildIds = ev.evidence
    .filter((e) => e.kind === 'child:ManualReview-Stale' && e.path)
    .map((e) => e.path as string);
  if (staleChildIds.length === 0) return false;

  for (const childId of staleChildIds) {
    const child = results.get(childId);
    if (!child) return false; // missing child — refuse to vouch
    if (!isInfraStale(child, results, memo)) return false;
  }
  return true;
}
