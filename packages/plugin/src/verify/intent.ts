/**
 * IntentIndex builder.
 *
 * Reads each spec file's YAML frontmatter `status:` field and propagates
 * that value to every spec ID defined in that file. This replaces the
 * earlier hardcoded `intent: 'Approved'` literals scattered across every
 * id-rule — the verifier now answers "what did the author actually
 * declare?" rather than assuming everything is Approved.
 *
 * Why this is fundamental, not cosmetic:
 *   - Without it, every NotBuilt result was claimed to be a broken
 *     promise (Approved + NotBuilt). In a project with legitimately
 *     Draft / Empty phases that is a false alarm.
 *   - With it, `--check-honesty` can flag only the genuine lies:
 *     `intent=Approved AND reality=NotBuilt`.
 *
 * Per-ID intent overrides (`**Status:** Draft` markers near a single
 * heading) are intentionally out of scope here. The schema treats phase
 * status as the unit of intent, and the dogfood corpus has zero per-ID
 * overrides — keeping the index phase-grained keeps the model honest.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from '../markdown/yaml.js';
import type { DependencyGraph } from '../graph/builder.js';
import type { IntentIndex, IntentState } from './types.js';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function normalizeStatus(raw: unknown): IntentState {
  if (raw === 'Approved') return 'Approved';
  if (raw === 'Draft') return 'Draft';
  if (raw === 'Empty') return 'Empty';
  // Any other / missing value is treated as Draft — the most charitable
  // reading. We do NOT silently coerce to Approved, since that is the
  // exact lie this index exists to prevent.
  return 'Draft';
}

/**
 * Build the intent index by:
 *   1. Reading every distinct spec file referenced by `graph.nodes`.
 *   2. Parsing its YAML frontmatter once.
 *   3. Assigning that file's `status:` to every ID defined inside it.
 */
export async function buildIntentIndex(
  projectRoot: string,
  graph: Pick<DependencyGraph, 'nodes'>,
): Promise<IntentIndex> {
  const fileStatus = new Map<string, IntentState>();

  const distinctFiles = new Set<string>();
  for (const n of graph.nodes) distinctFiles.add(n.definedAt.file);

  await Promise.all(
    [...distinctFiles].map(async (relFile) => {
      const raw = await readFile(
        join(projectRoot, 'docs', 'spec', relFile),
        'utf8',
      ).catch(() => null);
      if (raw === null) {
        fileStatus.set(relFile, 'Draft');
        return;
      }
      // Strip UTF-8 BOM so Windows-edited spec files still parse —
      // without this, the frontmatter regex misses and intent silently
      // falls back to Draft, sliding past the lie check. Use the
      // `﻿` escape (not the literal BOM character) so the source
      // remains safe against editors that strip invisible characters.
      const body = raw.replace(/^﻿/, '');
      const m = body.match(FRONTMATTER_RE);
      if (!m) {
        fileStatus.set(relFile, 'Draft');
        return;
      }
      const fm = parseYaml(m[1]);
      fileStatus.set(relFile, normalizeStatus(fm.status));
    }),
  );

  const intents = new Map<string, IntentState>();
  for (const n of graph.nodes) {
    const status = fileStatus.get(n.definedAt.file) ?? 'Draft';
    intents.set(n.specId, status);
  }
  return intents;
}
