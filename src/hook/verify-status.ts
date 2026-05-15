/**
 * Pre-commit hook: enforce the full honesty matrix at commit time.
 *
 * Architect round-N audit found the previous version gated on
 * `file-missing` only while the CLI's `--check-honesty` flagged
 * NotBuilt / Partial / content-stale ManualReview-Stale. The docstring
 * claimed "matches --check-honesty" but the matrix was strictly
 * narrower — an author could land a commit with AC-R5-99 Approved +
 * `no-test-ref` NotBuilt (hook silent), then CI's --check-honesty
 * would fail.
 *
 * Honest semantic: the hook uses the same predicate set as the CLI:
 *
 *   intent === Approved AND reality ∈ {
 *     NotBuilt,
 *     Partial,
 *     ManualReview-Stale (content-drift only, not infra-stale)
 *   }
 *
 * Infrastructure-stale (test-ref-no-run from skipTests, propagated
 * through rfs-aggregate via `isInfraStale`) is NOT a lie at commit
 * time — the hook runs with skipTests=true by design so commits stay
 * fast. Content-stale (ADR sha-mismatch) IS a lie and blocks.
 *
 * Draft / Empty phases continue to be exempt — IntentIndex gates
 * the matrix to Approved items.
 *
 * Returns the same `{ok, message}` shape as the other pre-commit hooks
 * (id-consistency, schema-validate) so the .git/hooks/pre-commit chain
 * can fan it in alongside them.
 */

import { verify } from '../verify/index.js';
import { isInfraStale } from '../verify/honesty.js';

export async function runHook(
  projectRoot: string,
): Promise<{ ok: boolean; message: string }> {
  const result = await verify(projectRoot, { skipTests: true });
  if (!result.initialized) {
    return { ok: true, message: 'verify-status skipped: docs/spec not initialized' };
  }

  const violations: Array<{ id: string; rule: string; reality: string }> = [];
  let approvedSeen = 0;
  for (const ev of result.results.values()) {
    if (ev.intent !== 'Approved') continue;
    approvedSeen++;
    if (ev.reality === 'NotBuilt' || ev.reality === 'Partial') {
      violations.push({ id: ev.id, rule: ev.rule, reality: ev.reality });
      continue;
    }
    if (ev.reality === 'ManualReview-Stale') {
      if (isInfraStale(ev, result.results)) continue;
      violations.push({ id: ev.id, rule: ev.rule, reality: ev.reality });
    }
  }

  if (violations.length === 0) {
    return {
      ok: true,
      message:
        `verify-status OK: ${result.results.size} ids classified ` +
        `(${approvedSeen} Approved gated, 0 lies)`,
    };
  }
  const lines = [
    `verify-status violation: ${violations.length} Approved ID(s) with insufficient evidence:`,
    ...violations
      .slice(0, 20)
      .map((v) => `  - ${v.id} [${v.reality}] (rule=${v.rule})`),
  ];
  if (violations.length > 20)
    lines.push(`  ... and ${violations.length - 20} more`);
  lines.push(
    'Fix: implement the missing work, drop the phase back to Draft, or remove the ID.',
  );
  return { ok: false, message: lines.join('\n') };
}
