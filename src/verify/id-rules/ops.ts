/**
 * OPS / RB verification rules.
 *
 * OPS-{n}: same path-existence heuristic as ARCH — look for any
 * `.github/workflows/`, `src/ops/`, or `docs/runbooks/` path tokens
 * around the spec definition. Falls back to ManualReview when nothing
 * concrete is declared.
 *
 * RB-{n} (Runbook): a runbook is "implemented" when EITHER a dedicated
 * markdown file at `docs/runbooks/RB-{n}*.md` exists, OR the spec row
 * defining the RB carries non-trivial content (not just "TBD"). The
 * second heuristic accounts for dogfood inline runbook tables.
 */

import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';
import type { EvidenceItem } from '../types.js';
import { pathExists } from '../evidence/fs.js';

const OPS_PATH_TOKEN_RE =
  /(?<![A-Za-z0-9_-])((?:src|tests|docs|dist|schemas|\.github|skills)\/[\w./-]+)/g;
const OPS_WINDOW_LINES = 4;
const RB_MIN_BODY_CHARS = 12;
const RB_TBD_RE = /^\s*(?:TBD|TODO|FIXME|-{1,3})?\s*$/i;

async function readSpecWindow(
  projectRoot: string,
  specFile: string,
  line: number,
  windowLines: number,
): Promise<{ window: string; firstLine: string } | null> {
  const raw = await readFile(join(projectRoot, 'docs', 'spec', specFile), 'utf8').catch(
    () => null,
  );
  if (raw === null) return null;
  const allLines = raw.split('\n');
  const start = Math.max(0, line - 1);
  const end = Math.min(allLines.length, line + windowLines);
  return {
    window: allLines.slice(start, end).join('\n'),
    firstLine: allLines[start] ?? '',
  };
}

export const opsRule: IdRule = {
  id: 'ops-path',
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
        rule: 'ops-path',
      };
    }
    const win = await readSpecWindow(
      ctx.projectRoot,
      loc.file,
      loc.line,
      OPS_WINDOW_LINES,
    );
    if (!win) {
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'ManualReview',
        evidence: [{ kind: 'spec-file-unreadable', path: loc.file }],
        confidence: 'low',
        rule: 'ops-path',
      };
    }

    const found = new Set<string>();
    for (const m of win.window.matchAll(OPS_PATH_TOKEN_RE)) {
      found.add(m[1].replace(/[)\].,;]+$/, ''));
    }

    if (found.size === 0) {
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'ManualReview',
        evidence: [
          { kind: 'no-path-tokens', path: loc.file, line: loc.line },
        ],
        confidence: 'low',
        rule: 'ops-path',
      };
    }

    const evidence: EvidenceItem[] = [];
    let exists = 0;
    let missing = 0;
    for (const token of found) {
      if (await pathExists(join(ctx.projectRoot, token))) {
        evidence.push({ kind: 'file-exists', path: token });
        exists++;
      } else {
        evidence.push({ kind: 'file-missing', path: token });
        missing++;
      }
    }

    return {
      id,
      idType,
      intent: 'Approved',
      reality: missing === 0 ? 'Built' : exists > 0 ? 'Partial' : 'NotBuilt',
      evidence,
      confidence: 'high',
      rule: 'ops-path',
    };
  },
};

export const rbRule: IdRule = {
  id: 'rb-content',
  async apply({ id, idType, ctx }) {
    const evidence: EvidenceItem[] = [];

    // 1. Dedicated runbook doc check
    const runbookDir = join(ctx.projectRoot, 'docs', 'runbooks');
    let runbookFound: string | null = null;
    try {
      const entries = (await readdir(runbookDir)) as string[];
      const match = entries.find((e) => e.startsWith(`${id}-`) || e === `${id}.md`);
      if (match) runbookFound = `docs/runbooks/${match}`;
    } catch {
      // dir missing — fall through
    }
    if (runbookFound) {
      evidence.push({ kind: 'runbook-doc', path: runbookFound });
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'Built',
        evidence,
        confidence: 'high',
        rule: 'rb-content',
      };
    }

    // 2. Inline definition body check
    const loc = ctx.locations.get(id);
    if (!loc) {
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'NotBuilt',
        evidence: [{ kind: 'no-runbook-no-definition' }],
        confidence: 'medium',
        rule: 'rb-content',
      };
    }
    const win = await readSpecWindow(ctx.projectRoot, loc.file, loc.line, 0);
    if (!win) {
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'ManualReview',
        evidence: [{ kind: 'spec-file-unreadable', path: loc.file }],
        confidence: 'low',
        rule: 'rb-content',
      };
    }
    // Table-row defs look like `| RB-1 | ... content ... |`. Pull the
    // second column.
    const cells = win.firstLine.split('|').map((c) => c.trim());
    const bodyCell = cells.length >= 3 ? cells[2] : '';
    if (bodyCell.length >= RB_MIN_BODY_CHARS && !RB_TBD_RE.test(bodyCell)) {
      evidence.push({
        kind: 'inline-body',
        path: loc.file,
        line: loc.line,
        note: bodyCell.slice(0, 80),
      });
      return {
        id,
        idType,
        intent: 'Approved',
        reality: 'Built',
        evidence,
        confidence: 'medium',
        rule: 'rb-content',
      };
    }

    return {
      id,
      idType,
      intent: 'Approved',
      reality: 'NotBuilt',
      evidence: [
        { kind: 'inline-body-thin', path: loc.file, line: loc.line, note: bodyCell },
      ],
      confidence: 'medium',
      rule: 'rb-content',
    };
  },
};

