/**
 * Open-question verification — OQ-{phase}-{n}.
 *
 * OQs live in the per-phase tables and the consolidated tracker in
 * 12-adr-risks.md. They're considered resolved when their row carries
 * a status keyword other than OPEN — typically "Resolved", "DEFERRED",
 * or a link to the ADR that closed them.
 *
 * Reality:
 *   - Status cell says RESOLVED / Resolved / DEFERRED → Built
 *   - Status cell says OPEN (or empty)               → NotBuilt
 *   - Cannot find the row                            → ManualReview
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';

const RESOLVED_KEYWORDS = [/\bResolved\b/i, /\bDEFERRED\b/i, /ADR-\d+/];
const OPEN_KEYWORDS = [/\bOPEN\b/i];

export const oqRule: IdRule = {
  id: 'oq-resolution',
  async apply({ id, idType, ctx }) {
    const loc = ctx.locations.get(id);
    if (!loc) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
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
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'ManualReview',
        evidence: [{ kind: 'spec-file-unreadable', path: loc.file }],
        confidence: 'low',
        rule: 'oq-resolution',
      };
    }

    const allLines = raw.split('\n');
    const rowLine = allLines[loc.line - 1] ?? '';

    if (RESOLVED_KEYWORDS.some((re) => re.test(rowLine))) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
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
    if (OPEN_KEYWORDS.some((re) => re.test(rowLine))) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
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
      intent: ctx.intents.get(id) ?? 'Draft',
      reality: 'ManualReview',
      evidence: [
        { kind: 'oq-status-unknown', path: loc.file, line: loc.line, note: rowLine.slice(0, 120) },
      ],
      confidence: 'low',
      rule: 'oq-resolution',
    };
  },
};

