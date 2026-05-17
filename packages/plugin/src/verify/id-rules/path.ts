/**
 * Path-existence rule — used for IDs whose evidence is "the spec declares
 * one or more file/directory paths and those paths exist in the repo".
 *
 * Currently dispatched for ARCH-{n} and EXT-{n}. The rule reads a small
 * window around the spec definition (file/line from buildGraph.nodes)
 * and extracts any path-like tokens; a token is considered a path if it
 * has a `/` and either ends in a known file extension or looks like a
 * source-tree segment (`src/...`, `skills/...`, `tests/...`, `.github/...`).
 *
 * Outcome:
 *   - No path tokens found        → ManualReview  (rule cannot decide)
 *   - All path tokens resolve     → Built
 *   - Some resolve, some missing  → Partial
 *   - All path tokens missing     → NotBuilt
 *
 * Spec authors who want a hard-Built guarantee should add an explicit
 * `Path:` or `Files:` annotation row to their ARCH/EXT definition.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';
import type { EvidenceItem } from '../types.js';
import { pathExists } from '../evidence/fs.js';

const PATH_TOKEN_RE =
  /(?<![A-Za-z0-9_-])((?:src|skills|tests|docs|dist|schemas|\.github)\/[\w./-]+)/g;
const WINDOW_LINES = 3;

export const pathRule: IdRule = {
  id: 'path-exists',
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
        rule: 'path-exists',
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
        rule: 'path-exists',
      };
    }

    const allLines = raw.split('\n');
    const start = Math.max(0, loc.line - 1);
    const end = Math.min(allLines.length, loc.line + WINDOW_LINES);
    const window = allLines.slice(start, end).join('\n');

    const found = new Set<string>();
    for (const m of window.matchAll(PATH_TOKEN_RE)) {
      const token = m[1].replace(/[)\].,;]+$/, '');
      found.add(token);
    }

    if (found.size === 0) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'ManualReview',
        evidence: [
          { kind: 'no-path-tokens', path: loc.file, line: loc.line },
        ],
        confidence: 'low',
        rule: 'path-exists',
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

    let reality: EvidenceItem['kind'] | 'Built' | 'Partial' | 'NotBuilt' = 'NotBuilt';
    if (missing === 0) reality = 'Built';
    else if (exists > 0) reality = 'Partial';
    else reality = 'NotBuilt';

    return {
      id,
      idType,
      intent: ctx.intents.get(id) ?? 'Draft',
      reality: reality as 'Built' | 'Partial' | 'NotBuilt',
      evidence,
      confidence: 'high',
      rule: 'path-exists',
    };
  },
};

