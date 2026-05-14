/**
 * Cross-reference aggregation — PAIN / KPI / RISK.
 *
 * These IDs are typically "solved by" / "measured by" / "mitigated by"
 * another ID elsewhere in the spec. The rule parses a small window
 * around the definition for any cited spec IDs and roll those up.
 *
 * If at least one cited ID is Built, the parent is Built.
 * If none are Built but some are Partial/NotBuilt, the parent reflects
 * the strongest child state (Partial preferred over NotBuilt).
 * If no citations found, the parent stays ManualReview.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';
import type { IdEvidence, RealityState } from '../types.js';
import { CITATION_RE } from '../../spec/patterns.js';

const WINDOW_LINES = 4;

/**
 * Cross-reference aggregator — produces a placeholder result containing
 * the cited IDs. The runner's post-pass replaces the reality field by
 * looking up those IDs in the final results map.
 */
function buildAggregator(ruleId: string): IdRule {
  return {
    id: ruleId,
    async apply({ id, idType, ctx }) {
      const loc = ctx.locations.get(id);
      if (!loc) {
        return {
          id,
          idType,
          intent: 'Approved',
          reality: 'ManualReview',
          evidence: [{ kind: 'no-definition-location' }],
          confidence: 'low',
          rule: ruleId,
        };
      }

      const raw = await readFile(
        join(ctx.projectRoot, 'docs', 'spec', loc.file),
        'utf8',
      ).catch(() => null);
      if (raw === null) {
        return {
          id,
          idType,
          intent: 'Approved',
          reality: 'ManualReview',
          evidence: [{ kind: 'spec-file-unreadable', path: loc.file }],
          confidence: 'low',
          rule: ruleId,
        };
      }

      const allLines = raw.split('\n');
      const start = Math.max(0, loc.line - 1);
      const end = Math.min(allLines.length, loc.line + WINDOW_LINES);
      const window = allLines.slice(start, end).join('\n');

      const refs = new Set<string>();
      const re = new RegExp(CITATION_RE.source, CITATION_RE.flags);
      for (const m of window.matchAll(re)) {
        if (m[1] !== id) refs.add(m[1]);
      }

      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'ManualReview',
        evidence: [
          { kind: 'cross-references', note: [...refs].join(', ') || '(none)' },
          ...[...refs].map((r) => ({ kind: 'cited', path: r })),
        ],
        confidence: 'low',
        rule: ruleId,
      };
    },
  };
}

export const painRule = buildAggregator('pain-cross-ref');
export const kpiRule = buildAggregator('kpi-cross-ref');
export const riskRule = buildAggregator('risk-cross-ref');

/**
 * Second-pass aggregation: for each PAIN/KPI/RISK that produced a
 * cross-references evidence list, look up those cited IDs in the
 * results map and roll up.
 */
export function applyCrossRefAggregation(
  results: Map<string, IdEvidence>,
): void {
  for (const [id, ev] of results) {
    if (ev.idType !== 'PAIN' && ev.idType !== 'KPI' && ev.idType !== 'RISK') continue;
    if (!ev.evidence[0] || ev.evidence[0].kind !== 'cross-references') continue;

    const refs = ev.evidence
      .filter((e) => e.kind === 'cited' && e.path)
      .map((e) => e.path as string);
    if (refs.length === 0) continue;

    const refEvidence: IdEvidence[] = [];
    for (const r of refs) {
      const found = results.get(r);
      if (found) refEvidence.push(found);
    }
    if (refEvidence.length === 0) continue;

    let reality: RealityState = 'NotBuilt';
    let anyBuilt = false;
    let anyPartial = false;
    for (const re of refEvidence) {
      if (re.reality === 'Built') anyBuilt = true;
      else if (re.reality === 'Partial') anyPartial = true;
    }
    if (anyBuilt) reality = 'Built';
    else if (anyPartial) reality = 'Partial';
    else reality = 'NotBuilt';

    results.set(id, {
      ...ev,
      reality,
      confidence: 'medium',
      evidence: [
        { kind: 'aggregated-from', note: refs.join(', ') },
        ...refEvidence.map((re) => ({
          kind: `ref:${re.reality}`,
          path: re.id,
        })),
      ],
    });
  }
}

