// T-CSA.10 — specrail audit CLI (attrs coverage report)
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.10
// Linked KPI: KPI-7 (attrs coverage %)
// Linked NFR: NFR-CSA-A11Y-1 (CLI output colour-blind safe — no colour-only signal)

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { lintAttrs } from '../lint/attrs-lint.js';
import { parseAttrsBlocks } from '../markdown/attrs.js';

export interface AttrsAuditOptions {
  readonly projectRoot: string;
  /** Plugin version for severity gating (defaults to '0.2.0' = WARN window). */
  readonly pluginVersion?: string;
}

export interface AttrsAuditReport {
  readonly entitiesTotal: number;
  readonly entitiesWithAttrs: number;
  readonly entitiesComplete: number;
  readonly coveragePercent: number;
  readonly reviewRequiredCount: number;
  readonly perPhase: Array<{
    readonly file: string;
    readonly entities: number;
    readonly complete: number;
    readonly missingFindings: number;
  }>;
}

const ENTITY_HEADING_RE = /^#{2,6}\s+([A-Z][A-Za-z0-9.\-_]+)/;

export async function runAttrsAudit(options: AttrsAuditOptions): Promise<AttrsAuditReport> {
  const specDir = join(options.projectRoot, 'docs', 'spec');
  const version = options.pluginVersion ?? '0.2.0';

  let entries: string[];
  try {
    entries = await readdir(specDir);
  } catch {
    return {
      entitiesTotal: 0,
      entitiesWithAttrs: 0,
      entitiesComplete: 0,
      coveragePercent: 100,
      reviewRequiredCount: 0,
      perPhase: [],
    };
  }

  const perPhase: AttrsAuditReport['perPhase'] = [];
  let totalEntities = 0;
  let totalWithAttrs = 0;
  let totalComplete = 0;
  let totalReviewRequired = 0;

  for (const e of entries) {
    if (!e.endsWith('.md')) continue;
    const full = join(specDir, e);
    const s = await stat(full);
    if (!s.isFile()) continue;

    const raw = await readFile(full, 'utf8');
    const entities = countEntityHeadings(raw);
    const { blocks } = parseAttrsBlocks(raw, full);
    const withAttrs = new Set(blocks.map((b) => b.entityId));

    const lint = lintAttrs(raw, { pluginVersion: version, file: full });
    const missingFindings = lint.findings.filter((f) => f.kind === 'attrs-completeness').length;
    const reviewFindings = lint.findings.filter((f) => f.kind === 'review-required').length;
    const completeIds = new Set(blocks.map((b) => b.entityId));
    const incompleteIds = new Set(
      lint.findings
        .filter((f) => f.kind === 'attrs-completeness' && f.entityId)
        .map((f) => f.entityId as string),
    );
    for (const id of incompleteIds) completeIds.delete(id);

    perPhase.push({
      file: e,
      entities,
      complete: completeIds.size,
      missingFindings,
    });
    totalEntities += entities;
    totalWithAttrs += withAttrs.size;
    totalComplete += completeIds.size;
    totalReviewRequired += reviewFindings;
  }

  const coveragePercent =
    totalEntities === 0 ? 100 : Math.round((totalComplete / totalEntities) * 100);

  return {
    entitiesTotal: totalEntities,
    entitiesWithAttrs: totalWithAttrs,
    entitiesComplete: totalComplete,
    coveragePercent,
    reviewRequiredCount: totalReviewRequired,
    perPhase,
  };
}

function countEntityHeadings(raw: string): number {
  let n = 0;
  for (const line of raw.split('\n')) {
    if (ENTITY_HEADING_RE.test(line)) n++;
  }
  return n;
}

export function renderAttrsAuditMarkdown(r: AttrsAuditReport): string {
  const lines: string[] = [];
  lines.push('# Attrs coverage report');
  lines.push('');
  lines.push(`- Coverage: **${r.coveragePercent}%** (KPI-7)`);
  lines.push(`- Entities total: ${r.entitiesTotal}`);
  lines.push(`- With attrs block: ${r.entitiesWithAttrs}`);
  lines.push(`- Complete (no missing required field): ${r.entitiesComplete}`);
  lines.push(`- Review-required markers: ${r.reviewRequiredCount}`);
  lines.push('');
  lines.push('## Per phase');
  lines.push('');
  lines.push('| File | Entity headings | Complete | Missing findings |');
  lines.push('|---|---:|---:|---:|');
  for (const p of r.perPhase) {
    lines.push(`| ${p.file} | ${p.entities} | ${p.complete} | ${p.missingFindings} |`);
  }
  return lines.join('\n') + '\n';
}
