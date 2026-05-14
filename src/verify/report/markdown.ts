/**
 * Markdown report — GitHub-flavoured, intended for PR comments and the
 * eventual web-viewer's ingest pipeline. Tables grouped by ID type.
 */

import type { IdEvidence, VerifyResult } from '../types.js';

const REALITY_BADGE: Record<string, string> = {
  Built: '🟢',
  Partial: '🟡',
  NotBuilt: '⚪',
  ManualReview: '🔵',
  'ManualReview-Stale': '🟠',
};

export function formatMarkdown(result: VerifyResult): string {
  if (!result.initialized) {
    return '> No `docs/spec/` directory found — verifier had nothing to inspect.\n';
  }
  const out: string[] = [];
  out.push(`# Verification report`);
  out.push('');
  out.push(`_Generated: ${result.timestamp}_`);
  out.push('');

  const summary: Record<string, number> = {};
  for (const ev of result.results.values()) {
    summary[ev.reality] = (summary[ev.reality] ?? 0) + 1;
  }
  out.push('## Summary');
  out.push('');
  out.push('| Reality | Count |');
  out.push('|---|---|');
  for (const [reality, count] of Object.entries(summary)) {
    out.push(`| ${REALITY_BADGE[reality] ?? ''} ${reality} | ${count} |`);
  }
  out.push('');

  const byType = new Map<string, IdEvidence[]>();
  for (const ev of result.results.values()) {
    (byType.get(ev.idType) ?? byType.set(ev.idType, []).get(ev.idType)!).push(ev);
  }
  for (const idType of [...byType.keys()].sort()) {
    out.push(`## ${idType}`);
    out.push('');
    out.push('| ID | Reality | Rule | Evidence |');
    out.push('|---|---|---|---|');
    const items = byType.get(idType)!.sort((a, b) => a.id.localeCompare(b.id));
    for (const ev of items) {
      const badge = REALITY_BADGE[ev.reality] ?? '';
      const evidenceCell = ev.evidence
        .slice(0, 2)
        .map((e) => {
          const where = e.path ? ` \`${e.path}${e.line ? ':' + e.line : ''}\`` : '';
          return `\`${e.kind}\`${where}`;
        })
        .join(' · ');
      out.push(`| \`${ev.id}\` | ${badge} ${ev.reality} | ${ev.rule} | ${evidenceCell} |`);
    }
    out.push('');
  }
  return out.join('\n');
}
