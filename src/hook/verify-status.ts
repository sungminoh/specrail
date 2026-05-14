/**
 * Pre-commit hook: enforce honesty between spec author intent and
 * verifier-derived reality.
 *
 * For each spec item:
 *   - If the item has an explicit `Evidence:` annotation pointing at a
 *     path that does NOT exist in the repo, fail. (Broken evidence
 *     pointer = the author is asserting something that isn't true.)
 *
 * The hook does NOT fail on plain NotBuilt / Partial states — those are
 * informational. Authors are allowed to work-in-progress; what they may
 * not do is claim a reality that isn't backed by evidence.
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
  for (const ev of result.results.values()) {
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
      message: `verify-status OK: ${result.results.size} ids classified, 0 broken-evidence`,
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
