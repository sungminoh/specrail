/**
 * Pre-commit hook: enforce honesty between spec author intent and
 * verifier-derived reality.
 *
 * Two-axis enforcement (matches `specrail verify --check-honesty`):
 *   - Only spec items whose phase status is `Approved` are gated. Items
 *     in `Draft` or `Empty` phases are work-in-progress and exempt.
 *   - For Approved items: if the evidence shows a `file-missing` for
 *     a path the spec claims exists, the author is asserting something
 *     that isn't true, so the hook fails.
 *
 * Independent architect review (round 9, P0) flagged the prior version:
 * it filtered on `file-missing` evidence regardless of `intent`, which
 * blocked commits for Draft-phase work-in-progress and broke the entire
 * point of the IntentIndex. This file now reads `ev.intent` and gates
 * the violation push.
 *
 * Returns the same `{ok, message}` shape as the other pre-commit hooks
 * (id-consistency, schema-validate) so the .git/hooks/pre-commit chain
 * can fan it in alongside them.
 */

import { verify } from '../verify/index.js';

export async function runHook(
  projectRoot: string,
): Promise<{ ok: boolean; message: string }> {
  const result = await verify(projectRoot, { skipTests: true });
  if (!result.initialized) {
    return { ok: true, message: 'verify-status skipped: docs/spec not initialized' };
  }

  const violations: string[] = [];
  let approvedSeen = 0;
  for (const ev of result.results.values()) {
    if (ev.intent !== 'Approved') continue;
    approvedSeen++;
    const brokenPaths = ev.evidence
      .filter((e) => e.kind === 'file-missing')
      .map((e) => e.path)
      .filter((p): p is string => Boolean(p));
    if (brokenPaths.length > 0) {
      violations.push(`${ev.id}: missing path(s) ${brokenPaths.join(', ')}`);
    }
  }

  if (violations.length === 0) {
    return {
      ok: true,
      message:
        `verify-status OK: ${result.results.size} ids classified ` +
        `(${approvedSeen} Approved gated, 0 broken-evidence)`,
    };
  }
  const lines = [
    `verify-status violation: ${violations.length} broken evidence pointer(s):`,
    ...violations.slice(0, 20).map((v) => `  - ${v}`),
  ];
  if (violations.length > 20)
    lines.push(`  ... and ${violations.length - 20} more`);
  return { ok: false, message: lines.join('\n') };
}
