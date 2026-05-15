/**
 * F-tier reverse-aggregation rule.
 *
 * F (Feature) IDs sit between R (Requirement) and S (Specification) /
 * AC (Acceptance Criteria) in the spec hierarchy. The R-tier rolls up
 * over its child F + AC via `applyRfsAggregation`. But F often has
 * neither AC children nor S leaves declared — instead, F is
 * "implemented by" a set of T-tasks recorded in Phase 13. The previous
 * design left F at skeleton-rule ManualReview because rfs-aggregate
 * had no children to aggregate.
 *
 * Architect round-N audit: 28 F-tier headings (F1.1..F13.3) all
 * silently sat at ManualReview, hidden in the warning section. Headline
 * `OK` overstated coverage because Feature-tier — the spec's primary
 * shipping unit — had ZERO Built classifications.
 *
 * Honest fix: F's reality reflects the realities of the T-tasks that
 * implement it. Phase 13's task headings carry citations like
 *   `#### T1.4: Frontmatter parser — F1.1, F1.2, AC-R1-1, TC-1`
 *
 * The rule scans 13-implementation-plan.md once per F, finds tasks
 * citing that F, and aggregates the task realities the same way
 * applyCrossRefAggregation handles PAIN/KPI/RISK.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';
import type { EvidenceItem, IdEvidence, RealityState } from '../types.js';

// `#### T{n}.{m}: title — F{r}.{f}, F{r}.{g}, ...`
// The F-citation appears inside the task heading, often comma-separated
// with other refs. Capture all F-N tokens after the dash.
const TASK_HEADING_RE = /^####\s+T\d+\.\d+[a-z]?:[^\n]*$/gm;
const F_CITATION_RE = /\bF\d+\.\d+\b/g;
const T_CITATION_RE = /\bT\d+\.\d+[a-z]?\b/;

/**
 * Expand dot-list shorthand `F8.1·8.2·8.3` → `F8.1 F8.2 F8.3`. Mirrors
 * the same convention `scanTestFilesForIds` (vitest-bridge.ts) uses for
 * TC/AC IDs. Without this, the F-task rule silently dropped every
 * F-id after the first in a packed citation — architect round-N+1
 * flagged dogfood line `13-implementation-plan.md:716` as live example.
 */
function expandDotListF(s: string): string {
  return s.replace(
    /\bF(\d+\.\d+)((?:·\d+(?:\.\d+)?)+)/g,
    (_, first, tail) => {
      const tails = tail.replace(/·(\d+(?:\.\d+)?)/g, ' F$1');
      return 'F' + first + tails;
    },
  );
}

/**
 * Build the reverse map `F-id → set<task-id>` by scanning task headings
 * in 13-implementation-plan.md. Done lazily once per verify run via
 * a module-scoped cache keyed by projectRoot — see callers.
 */
async function buildFToTaskMap(
  projectRoot: string,
): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  const raw = await readFile(
    join(projectRoot, 'docs', 'spec', '13-implementation-plan.md'),
    'utf8',
  ).catch(() => null);
  if (raw === null) return out;
  const headings = raw.match(TASK_HEADING_RE) ?? [];
  for (const heading of headings) {
    const taskMatch = heading.match(T_CITATION_RE);
    if (!taskMatch) continue;
    const taskId = taskMatch[0];
    const expanded = expandDotListF(heading);
    for (const m of expanded.matchAll(F_CITATION_RE)) {
      const fId = m[0];
      let set = out.get(fId);
      if (!set) {
        set = new Set();
        out.set(fId, set);
      }
      set.add(taskId);
    }
  }
  return out;
}

// Module-level memoisation — one Map per (projectRoot) per verify run.
// The runner builds a fresh context per call so we key by projectRoot
// and tolerate cross-run staleness.
const cache = new Map<string, Promise<Map<string, Set<string>>>>();

function getMap(projectRoot: string): Promise<Map<string, Set<string>>> {
  let p = cache.get(projectRoot);
  if (!p) {
    p = buildFToTaskMap(projectRoot);
    cache.set(projectRoot, p);
  }
  return p;
}

/**
 * For testing only — drops the memoised map so the next `apply()` call
 * re-reads the implementation plan. Real callers don't need this.
 */
export function _clearFTaskMapCache(): void {
  cache.clear();
}

export const fTaskAggregateRule: IdRule = {
  id: 'f-task-aggregate',
  async apply({ id, idType, ctx }) {
    const intent = ctx.intents.get(id) ?? 'Draft';
    const map = await getMap(ctx.projectRoot);
    const taskIds = map.get(id);
    if (!taskIds || taskIds.size === 0) {
      // No task references this F → cannot classify mechanically.
      // Punt to human review rather than claim NotBuilt.
      return {
        id,
        idType,
        intent,
        reality: 'ManualReview',
        evidence: [{ kind: 'no-task-citation' }],
        confidence: 'low',
        rule: 'f-task-aggregate',
      };
    }
    // Placeholder: real aggregation happens in a post-pass once all
    // T-tasks have been classified. Encode the cited tasks as evidence
    // so the runner can resolve them.
    const evidence: EvidenceItem[] = [
      { kind: 'cross-references', note: [...taskIds].join(', ') },
      ...[...taskIds].map(
        (t): EvidenceItem => ({ kind: 'cited', path: t }),
      ),
    ];
    return {
      id,
      idType,
      intent,
      reality: 'ManualReview',
      evidence,
      confidence: 'low',
      rule: 'f-task-aggregate',
    };
  },
};

/**
 * Post-pass: for every F whose primary evidence is `cross-references`,
 * resolve the cited task IDs against the final results map and roll up.
 * Same shape as `applyCrossRefAggregation` for PAIN/KPI/RISK.
 */
export function applyFTaskAggregation(
  results: ReadonlyMap<string, IdEvidence>,
): Map<string, IdEvidence> {
  const out = new Map(results);
  for (const [id, ev] of out) {
    if (ev.rule !== 'f-task-aggregate') continue;
    if (!ev.evidence[0] || ev.evidence[0].kind !== 'cross-references') continue;

    const refs = ev.evidence
      .filter((e) => e.kind === 'cited' && e.path)
      .map((e) => e.path as string);
    if (refs.length === 0) continue;

    const refEvidence = refs
      .map((r) => out.get(r))
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
    if (refEvidence.length === 0) continue;

    let reality: RealityState = 'ManualReview';
    let anyBuilt = false;
    let anyPartial = false;
    let anyNotBuilt = false;
    for (const re of refEvidence) {
      if (re.reality === 'Built') anyBuilt = true;
      else if (re.reality === 'Partial') anyPartial = true;
      else if (re.reality === 'NotBuilt') anyNotBuilt = true;
    }
    if (anyBuilt) reality = 'Built';
    else if (anyPartial) reality = 'Partial';
    else if (anyNotBuilt) reality = 'NotBuilt';
    else reality = 'ManualReview';

    out.set(id, {
      ...ev,
      reality,
      confidence: 'medium',
      evidence: [
        { kind: 'aggregated-from', note: refs.join(', ') },
        ...refEvidence.map(
          (re): EvidenceItem => ({
            kind: `ref:${re.reality}`,
            path: re.id,
          }),
        ),
      ],
    });
  }
  return out;
}
