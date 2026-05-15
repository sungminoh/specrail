/**
 * Open-question verification — OQ-{phase}-{n}.
 *
 * OQs live in the per-phase tables and the consolidated tracker in
 * 12-adr-risks.md. They're resolved when the row carries a status
 * keyword (Resolved / DEFERRED) or an ADR-N reference.
 *
 *   - Row mentions ADR-N (any digit)             → Built
 *   - Row says Resolved or DEFERRED              → Built
 *   - Row says OPEN                              → NotBuilt
 *   - Row says nothing recognised                → ManualReview
 *
 * Scope note (round-N+3 scope correction): the rule checks SHAPE
 * presence, not rationale quality. A bare `DEFERRED` is shape-present
 * — the author claims a decision was made. Whether the decision is
 * justified (rationale text, ADR ref, milestone marker) is a review
 * concern, not a verifier concern. Previous rounds attempted to gate
 * on character count / letter count / structural anchor; all were
 * shape-quality checks that left the same lie pathway gameable in a
 * few keystrokes by an adversarial author. Honest authors don't write
 * bare `DEFERRED`; the rule trusts that and yields to review for the
 * cases that should care.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';

const ADR_RE = /ADR-\d+/;
const RESOLVED_RE = /\bResolved\b/i;
const DEFERRED_RE = /\bDEFERRED\b/i;
const OPEN_RE = /\bOPEN\b/i;

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

    if (
      ADR_RE.test(rowLine) ||
      RESOLVED_RE.test(rowLine) ||
      DEFERRED_RE.test(rowLine)
    ) {
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
        confidence: 'medium',
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
