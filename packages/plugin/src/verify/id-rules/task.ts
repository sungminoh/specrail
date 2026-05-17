/**
 * T-task verification — T{n.m}.
 *
 * Tasks live in `13-implementation-plan.md`. Two convention shapes are
 * present in dogfood:
 *   1. Heading form: `#### T0.1: ...` with a `**Files:**` block listing
 *      paths underneath.
 *   2. Bullet form: `- T5.1 hook install entry point — \`src/cli/...\``.
 *
 * Either way the spec body declares one or more `src/...`-style paths.
 * The rule:
 *   - Scans the definition + a small window of surrounding text for path
 *     tokens.
 *   - For every existing path, scans the file for `TODO|TBD|FIXME` markers.
 *   - Built when all paths exist AND no TODO/FIXME present.
 *   - Partial if files exist but TODO/FIXME remain.
 *   - NotBuilt if no path token exists at all.
 *   - ManualReview when no path token was declared.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IdRule } from '../runner.js';
import type { EvidenceItem } from '../types.js';
import { pathExists } from '../evidence/fs.js';

const PATH_TOKEN_RE =
  /(?<![A-Za-z0-9_-])((?:src|tests|docs|dist|schemas|\.github|skills)\/[\w./-]+)/g;
// Hard upper bound on how many lines to scan past the definition. We
// stop earlier when the next heading boundary is hit (see
// `boundedWindow` below) — this constant is the safety net for tasks
// with no following heading (last entry in a phase).
const TASK_WINDOW_LINES = 12;
const TODO_RE = /\b(TODO|TBD|FIXME)\b/;
// Bound the task body window at the next sibling heading. Without this
// the window would bleed into the next task's Files line and credit
// (or blame) the wrong T-ID for those paths. The architect flagged
// this when T1.4 reported missing `schemas/phase-` / `schemas/common.json`
// that actually belonged to T1.5.
const NEXT_HEADING_RE = /^#{3,4}\s+T\d/;

async function scanForTodos(filePath: string): Promise<number> {
  const content = await readFile(filePath, 'utf8').catch(() => null);
  if (content === null) return 0;
  let count = 0;
  for (const line of content.split('\n')) {
    if (TODO_RE.test(line)) count++;
  }
  return count;
}

export const taskRule: IdRule = {
  id: 'task-files-todo',
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
        rule: 'task-files-todo',
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
        rule: 'task-files-todo',
      };
    }
    const allLines = raw.split('\n');
    const start = Math.max(0, loc.line - 1);
    const hardEnd = Math.min(allLines.length, loc.line + TASK_WINDOW_LINES);
    let end = hardEnd;
    // Bound the scan at the next `#### TX.Y` / `### TX.Y` heading so
    // path tokens from the NEXT task aren't attributed here.
    for (let i = start + 1; i < hardEnd; i++) {
      if (NEXT_HEADING_RE.test(allLines[i] ?? '')) {
        end = i;
        break;
      }
    }
    const window = allLines.slice(start, end).join('\n');

    const paths = new Set<string>();
    for (const m of window.matchAll(PATH_TOKEN_RE)) {
      paths.add(m[1].replace(/[)\].,;]+$/, ''));
    }

    if (paths.size === 0) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'ManualReview',
        evidence: [
          { kind: 'no-path-tokens', path: loc.file, line: loc.line },
        ],
        confidence: 'low',
        rule: 'task-files-todo',
      };
    }

    const evidence: EvidenceItem[] = [];
    let missing = 0;
    let withTodos = 0;
    for (const p of paths) {
      const abs = join(ctx.projectRoot, p);
      if (!(await pathExists(abs))) {
        evidence.push({ kind: 'file-missing', path: p });
        missing++;
        continue;
      }
      // Architect feedback: TODO markers inside test files are
      // routinely "more cases later" notes — they should not penalise
      // the task's reality. Production-code TODO is still flagged.
      const isTestFile = /\.(test|spec)\.[tj]sx?$/.test(p) || p.startsWith('tests/');
      if (isTestFile) {
        evidence.push({ kind: 'file-exists', path: p });
        continue;
      }
      const todoCount = await scanForTodos(abs);
      if (todoCount > 0) {
        evidence.push({
          kind: 'file-has-todo',
          path: p,
          note: `${todoCount} TODO/TBD/FIXME marker(s)`,
        });
        withTodos++;
      } else {
        evidence.push({ kind: 'file-exists', path: p });
      }
    }

    let reality: 'Built' | 'Partial' | 'NotBuilt' = 'NotBuilt';
    if (missing === paths.size) reality = 'NotBuilt';
    else if (missing === 0 && withTodos === 0) reality = 'Built';
    else reality = 'Partial';

    return {
      id,
      idType,
      intent: ctx.intents.get(id) ?? 'Draft',
      reality,
      evidence,
      confidence: 'medium',
      rule: 'task-files-todo',
    };
  },
};

