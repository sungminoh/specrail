/**
 * Open-question verification — OQ-{phase}-{n}.
 *
 * OQs live in the per-phase tables and the consolidated tracker in
 * 12-adr-risks.md. Resolution requires *positive evidence of how it
 * was resolved* — not just a "DEFERRED" tag.
 *
 * Reality (round-N architect tightened):
 *   - Row mentions ADR-N (any digit)             → Built
 *   - Row says Resolved + ≥10 chars rationale    → Built
 *   - Row says DEFERRED + ≥10 chars rationale    → Built
 *   - Row says Resolved/DEFERRED alone (no ADR,  → ManualReview
 *     no rationale text)                          (self-defer loophole)
 *   - Row says OPEN                              → NotBuilt
 *   - Row says nothing recognised                → ManualReview
 *
 * The "10 chars after the keyword" heuristic catches `DEFERRED — v5+
 * cycle revisit` (rationale present) and rejects bare `DEFERRED`. Not
 * perfect but raises the bar above zero.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';

const ADR_RE = /ADR-\d+/;
const RESOLVED_RE = /\bResolved\b/i;
const DEFERRED_RE = /\bDEFERRED\b/i;
const OPEN_RE = /\bOPEN\b/i;
// Heuristic: 10+ non-whitespace chars of rationale after the keyword
// in the same row. Catches em-dash + reason; rejects bare keyword.
const MIN_RATIONALE_CHARS = 10;

function rationaleAfter(row: string, keywordRe: RegExp): string | null {
  const m = row.match(keywordRe);
  if (!m || m.index === undefined) return null;
  const tail = row.slice(m.index + m[0].length).trim();
  // Strip leading punctuation/em-dash so the count is on actual prose.
  const stripped = tail.replace(/^[\s\-—–:|·]+/, '');
  if (stripped.length < MIN_RATIONALE_CHARS) return null;
  return stripped.slice(0, 200);
}

export const oqRule: IdRule = {
  id: 'oq-resolution',
  async apply({ id, idType, ctx }) {
    const intent = ctx.intents.get(id) ?? 'Draft';
    const loc = ctx.locations.get(id);
    if (!loc) {
      return {
        id,
        idType,
        intent,
        reality: 'ManualReview',
        evidence: [{ kind: 'no-definition-location' }],
        confidence: 'low',
        rule: 'oq-resolution',
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
        intent,
        reality: 'ManualReview',
        evidence: [{ kind: 'spec-file-unreadable', path: loc.file }],
        confidence: 'low',
        rule: 'oq-resolution',
      };
    }

    const allLines = raw.split('\n');
    const rowLine = allLines[loc.line - 1] ?? '';

    // Highest-confidence signal: ADR-N reference. Canonical resolution.
    if (ADR_RE.test(rowLine)) {
      return {
        id,
        idType,
        intent,
        reality: 'Built',
        evidence: [
          {
            kind: 'oq-resolved',
            path: loc.file,
            line: loc.line,
            note: rowLine.slice(0, 120),
          },
        ],
        confidence: 'high',
        rule: 'oq-resolution',
      };
    }

    if (OPEN_RE.test(rowLine)) {
      return {
        id,
        idType,
        intent,
        reality: 'NotBuilt',
        evidence: [
          { kind: 'oq-open', path: loc.file, line: loc.line, note: rowLine.slice(0, 120) },
        ],
        confidence: 'medium',
        rule: 'oq-resolution',
      };
    }

    // Resolved / DEFERRED keyword present — require rationale.
    if (RESOLVED_RE.test(rowLine) || DEFERRED_RE.test(rowLine)) {
      const keywordRe = RESOLVED_RE.test(rowLine) ? RESOLVED_RE : DEFERRED_RE;
      const rationale = rationaleAfter(rowLine, keywordRe);
      if (rationale) {
        return {
          id,
          idType,
          intent,
          reality: 'Built',
          evidence: [
            {
              kind: 'oq-resolved',
              path: loc.file,
              line: loc.line,
              note: rationale,
            },
          ],
          confidence: 'medium',
          rule: 'oq-resolution',
        };
      }
      // Bare keyword with no rationale — self-defer attack vector.
      return {
        id,
        idType,
        intent,
        reality: 'ManualReview',
        evidence: [
          {
            kind: 'oq-status-unknown',
            path: loc.file,
            line: loc.line,
            note: `keyword without rationale: ${rowLine.slice(0, 120)}`,
          },
        ],
        confidence: 'low',
        rule: 'oq-resolution',
      };
    }

    return {
      id,
      idType,
      intent,
      reality: 'ManualReview',
      evidence: [
        { kind: 'oq-status-unknown', path: loc.file, line: loc.line, note: rowLine.slice(0, 120) },
      ],
      confidence: 'low',
      rule: 'oq-resolution',
    };
  },
};

