/**
 * Human-readable CLI report.
 *
 * Groups IDs by phase prefix and reality state. Evidence paths printed
 * on indented lines so output stays readable in a 80-column terminal.
 */

import type { IdEvidence, VerifyResult } from '../types.js';

const REALITY_SYMBOLS: Record<string, string> = {
  Built: '✓', // ✓
  Partial: '◐', // ◐
  NotBuilt: '×', // ×
  ManualReview: '?',
  'ManualReview-Stale': '!',
};

export function formatHuman(result: VerifyResult): string {
  if (!result.initialized) {
    return 'No docs/spec/ directory found — verifier had nothing to inspect.';
  }

  const lines: string[] = [];
  lines.push(`# Verification report (${result.timestamp})`);
  lines.push(`Project: ${result.projectRoot}`);
  lines.push('');

  const byBucket = new Map<string, IdEvidence[]>();
  for (const ev of result.results.values()) {
    const bucket = bucketFor(ev.idType);
    (byBucket.get(bucket) ?? byBucket.set(bucket, []).get(bucket)!).push(ev);
  }
  const sortedBuckets = [...byBucket.keys()].sort();
  for (const bucket of sortedBuckets) {
    lines.push(`## ${bucket}`);
    const items = byBucket.get(bucket)!.sort((a, b) => a.id.localeCompare(b.id));
    for (const ev of items) {
      const sym = REALITY_SYMBOLS[ev.reality] ?? '?';
      lines.push(`  ${sym} ${ev.id.padEnd(18)} ${ev.reality.padEnd(20)} (rule=${ev.rule})`);
      for (const e of ev.evidence.slice(0, 3)) {
        const where = e.path
          ? ` ${e.path}${e.line ? ':' + e.line : ''}`
          : '';
        const note = e.note ? ` — ${e.note}` : '';
        lines.push(`      ${e.kind}${where}${note}`);
      }
    }
    lines.push('');
  }

  const counts = countRealities(result);
  lines.push('## Summary');
  for (const [reality, count] of counts) {
    lines.push(`  ${reality.padEnd(20)} ${count}`);
  }
  return lines.join('\n');
}

function bucketFor(idType: string): string {
  return idType;
}

export function countRealities(result: VerifyResult): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ev of result.results.values()) {
    counts.set(ev.reality, (counts.get(ev.reality) ?? 0) + 1);
  }
  return counts;
}
