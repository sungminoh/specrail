// T-CSA.5 — specrail migrate codemod
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.5
// Linked AC: AC-R-CSA-5 (review marker), AC-R-CSA-7 (idempotency)
// Linked TC: TC-81 (idempotency), TC-82 (conflict markers)
//
// Scope (this implementation):
// - Phase 5 ID rename: N-NNN → FLN-N (drop zero-pad), E-N → FLE-N
// - Phase 2 SCEN rename: deferred to T-CSA.6 (requires per-file context)
// - Code-fence preservation: yaml/code blocks not rewritten
// - Idempotent: re-running produces 0-byte diff (TC-81)
// - Writes .specrail/migrate-report.json with renamed/conflicts/timestamp

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

export interface MigrateOptions {
  readonly projectRoot: string;
  readonly apply: boolean;
  /** Limit to this phase number (e.g. 5). Omit to process all docs/spec/*.md. */
  readonly phase?: number;
}

export interface RenameRecord {
  readonly file: string;
  readonly from: string;
  readonly to: string;
  readonly kind: 'FLN' | 'FLE' | 'SCEN';
}

export type ConflictReason =
  | 'yaml-conflict'
  | 'ambiguous-id-mapping'
  | 'partial-cross-ref';

export interface ConflictRecord {
  readonly file: string;
  readonly line: number;
  readonly entityId: string;
  readonly reason: ConflictReason;
  readonly ts: string;
}

export interface MigrateReport {
  readonly renamed: RenameRecord[];
  readonly conflicts: ConflictRecord[];
  readonly filesScanned: number;
  readonly timestamp: string;
  readonly dryRun: boolean;
}

const N_TOKEN_RE = /\bN-(\d{3})\b/g; // Phase 5 flow node: N-001 (zero-pad)
const E_TOKEN_RE = /(?<![A-Za-z])E-(\d+)\b/g; // Phase 5 flow edge: E-1, E-50

// Lines we MUST NOT rewrite (preserves authoring): inside ```fenced``` blocks.
function buildFenceMask(text: string): boolean[] {
  const lines = text.split('\n');
  const mask = new Array<boolean>(lines.length).fill(false);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i].trimStart())) {
      inFence = !inFence;
      mask[i] = true; // fence boundary line itself
    } else {
      mask[i] = inFence;
    }
  }
  return mask;
}

interface RenameResult {
  readonly text: string;
  readonly renames: Array<{ from: string; to: string; kind: 'FLN' | 'FLE' }>;
}

function renamePhase5Tokens(text: string): RenameResult {
  const lines = text.split('\n');
  const mask = buildFenceMask(lines.join('\n'));
  const renames: Array<{ from: string; to: string; kind: 'FLN' | 'FLE' }> = [];

  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue;

    lines[i] = lines[i].replace(N_TOKEN_RE, (match, digits: string) => {
      const n = parseInt(digits, 10);
      const to = `FLN-${n}`;
      renames.push({ from: match, to, kind: 'FLN' });
      return to;
    });

    lines[i] = lines[i].replace(E_TOKEN_RE, (match, digits: string) => {
      const n = parseInt(digits, 10);
      const to = `FLE-${n}`;
      renames.push({ from: match, to, kind: 'FLE' });
      return to;
    });
  }

  return { text: lines.join('\n'), renames };
}

async function* walkSpecFiles(
  root: string,
  phase: number | undefined,
): AsyncGenerator<string> {
  const specDir = join(root, 'docs', 'spec');
  let entries: string[];
  try {
    entries = await readdir(specDir);
  } catch {
    return; // no docs/spec/ — nothing to migrate
  }
  for (const e of entries) {
    if (!e.endsWith('.md')) continue;
    if (phase !== undefined) {
      const prefix = String(phase).padStart(2, '0');
      if (!e.startsWith(prefix)) continue;
    }
    const full = join(specDir, e);
    const s = await stat(full);
    if (s.isFile()) yield full;
  }
}

export async function runMigrate(options: MigrateOptions): Promise<MigrateReport> {
  const renamed: RenameRecord[] = [];
  const conflicts: ConflictRecord[] = [];
  let filesScanned = 0;

  for await (const file of walkSpecFiles(options.projectRoot, options.phase)) {
    filesScanned++;
    const original = await readFile(file, 'utf8');
    const rel = relative(options.projectRoot, file);
    const { text: rewritten, renames } = renamePhase5Tokens(original);
    for (const r of renames) {
      renamed.push({ file: rel, from: r.from, to: r.to, kind: r.kind });
    }
    if (options.apply && rewritten !== original) {
      await writeFile(file, rewritten);
    }
  }

  const report: MigrateReport = {
    renamed,
    conflicts,
    filesScanned,
    timestamp: new Date().toISOString(),
    dryRun: !options.apply,
  };

  if (options.apply) {
    const reportDir = join(options.projectRoot, '.specrail');
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      join(reportDir, 'migrate-report.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }

  return report;
}
