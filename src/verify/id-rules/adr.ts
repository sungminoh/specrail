/**
 * ADR verification — ManualReview with optional sign-off log.
 *
 * Decision records describe stack/pattern choices whose code reflection
 * is semantic — not directly checkable. Default reality: ManualReview.
 *
 * Spec authors may include a `**Verification:**` block at the end of an
 * ADR. Format (single line):
 *
 *   **Verification:** Manual review by <name> <YYYY-MM-DD> sha:<short> path:<rel>
 *
 * If the sha matches the current git blob sha of the referenced file,
 * reality is `Built`. If the sha differs, reality is `ManualReview-Stale`.
 * No sign-off → stays `ManualReview`.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { blobSha } from '../evidence/git.js';
import type { IdRule } from '../runner.js';
import type { EvidenceItem } from '../types.js';

// Architect feedback: require ≥7 hex chars in declared SHA so a stray
// `sha:a` cannot prefix-match arbitrary blobs (1-in-16 false positive
// rate before the fix).
const SIGNOFF_BLOCK_RE =
  /\*\*Verification:\*\*\s+Manual review by\s+([^\s]+)\s+(\d{4}-\d{2}-\d{2})(?:\s+sha:([a-f0-9]{7,})\s+path:(\S+))?/i;
const ADR_WINDOW_LINES = 40;

export const adrRule: IdRule = {
  id: 'adr-signoff',
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
        rule: 'adr-signoff',
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
        rule: 'adr-signoff',
      };
    }

    const allLines = raw.split('\n');
    const start = Math.max(0, loc.line - 1);
    const end = Math.min(allLines.length, loc.line + ADR_WINDOW_LINES);
    const window = allLines.slice(start, end).join('\n');

    const sig = SIGNOFF_BLOCK_RE.exec(window);
    if (!sig) {
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'ManualReview',
        evidence: [
          { kind: 'no-signoff', path: loc.file, line: loc.line },
        ],
        confidence: 'low',
        rule: 'adr-signoff',
      };
    }

    const [, reviewer, date, declaredSha, relPath] = sig;
    const evidence: EvidenceItem[] = [
      {
        kind: 'signoff',
        note: `by ${reviewer} on ${date}`,
        path: loc.file,
        line: loc.line,
      },
    ];

    if (!declaredSha || !relPath) {
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'Built',
        evidence,
        confidence: 'low',
        rule: 'adr-signoff',
      };
    }

    const currentSha = await blobSha(ctx.projectRoot, relPath);
    if (!currentSha) {
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'ManualReview',
        evidence: [
          ...evidence,
          {
            kind: 'signoff-target-missing',
            path: relPath,
          },
        ],
        confidence: 'low',
        rule: 'adr-signoff',
      };
    }
    const matches = currentSha.startsWith(declaredSha);
    return {
      id,
      idType,
      intent: 'Approved',
      reality: matches ? 'Built' : 'ManualReview-Stale',
      evidence: [
        ...evidence,
        {
          kind: matches ? 'sha-match' : 'sha-mismatch',
          path: relPath,
          note: `declared:${declaredSha} current:${currentSha.slice(0, declaredSha.length)}`,
        },
      ],
      confidence: matches ? 'high' : 'medium',
      rule: 'adr-signoff',
    };
  },
};

