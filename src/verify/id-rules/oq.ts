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

/**
 * Architect round-N+2 audit: letter-count rationale gates are the same
 * byte-count lie shape that the round-N+1 fix attempted to close.
 * `DEFERRED xxxxx`, `DEFERRED later`, `DEFERRED TODOs` all passed the
 * 5-letter threshold — adversary cost was zero.
 *
 * The honest test is STRUCTURAL ANCHOR: the rationale must reference
 * something verifiable in the spec graph or repo. The valid anchors:
 *
 *   1. Canonical spec ID reference (ADR-N, TC-N, T-N.M, EDGE-N, RISK-N,
 *      INV-N, AC-R-..., F/R-..., NFR-..., OPS-N, RB-N, PAIN-N, KPI-N,
 *      ENT-X, or another OQ-N-M) — citation to an existing decision
 *   2. File path token under a known repo root (src/, tests/, docs/,
 *      schemas/, skills/, .github/, dist/) — concrete deliverable
 *   3. Milestone / version marker (M0..M9, M-Round-N, v3..v9, Phase N)
 *      — explicit when-it-will-be-resolved bound
 *
 * Without one of these three the row is just padding. ManualReview.
 *
 * Notes:
 *   - ADR-N alone (with no Resolved/DEFERRED keyword) is the canonical
 *     resolution and continues to hit the early-return at line 99.
 *   - The check is intentionally generous about Korean prose — any
 *     row that names a real anchor is accepted regardless of language.
 *   - INV-2 catches dangling citations to phantom IDs at a different
 *     layer, so this rule does NOT validate the cited ID exists.
 */
const ANCHOR_ID_RE =
  /\b(?:ADR-\d+|TC-\d+|T\d+\.\d+[a-z]?|EDGE-\d+|RISK-\d+|INV-\d+|AC-R\d+-\d+|[RF]\d+(?:\.\d+){0,2}|NFR-[A-Z][A-Z0-9]*-\d+|OPS-\d+|RB-\d+|PAIN-\d+|KPI-\d+|ENT-[A-Za-z][A-Za-z0-9_]*|OQ-\d+-\d+)\b/;
const ANCHOR_PATH_RE = /\b(?:src|tests|docs|schemas|skills|\.github|dist)\/[\w.\-/]+/;
const ANCHOR_MILESTONE_RE = /\b(?:M\d+(?:-Round-\d+)?|v\d+\+?|Phase\s\d+\+?)\b/i;

function rationaleAfter(row: string, keywordRe: RegExp): string | null {
  const m = row.match(keywordRe);
  if (!m || m.index === undefined) return null;
  const tail = row.slice(m.index + m[0].length).trim();
  // Strip leading punctuation/em-dash so the anchor scan starts on prose.
  const stripped = tail.replace(/^[\s\-—–:|·]+/, '').replace(/[\s|]+$/, '');
  if (stripped.length === 0) return null;
  // Require at least one structural anchor — see comment block above.
  if (
    !ANCHOR_ID_RE.test(stripped) &&
    !ANCHOR_PATH_RE.test(stripped) &&
    !ANCHOR_MILESTONE_RE.test(stripped)
  ) {
    return null;
  }
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

