/**
 * JSON report — stable shape for tool integration. Mirrors the cache
 * file shape so consumers can use either source interchangeably.
 */

import type { IdEvidence, VerifyResult } from '../types.js';

export interface JsonReportEntry {
  readonly id: string;
  readonly idType: string;
  readonly intent: string;
  readonly reality: string;
  readonly confidence: string;
  readonly rule: string;
  readonly evidence: ReadonlyArray<{
    kind: string;
    path?: string;
    line?: number;
    note?: string;
  }>;
}

export interface JsonReport {
  readonly timestamp: string;
  readonly projectRoot: string;
  readonly initialized: boolean;
  readonly summary: Record<string, number>;
  readonly results: Record<string, JsonReportEntry>;
}

function normaliseEvidence(ev: IdEvidence): JsonReportEntry {
  return {
    id: ev.id,
    idType: ev.idType,
    intent: ev.intent,
    reality: ev.reality,
    confidence: ev.confidence,
    rule: ev.rule,
    evidence: ev.evidence.map((e) => ({ ...e })),
  };
}

export function formatJson(result: VerifyResult): string {
  const summary: Record<string, number> = {};
  const results: Record<string, JsonReportEntry> = {};
  for (const [id, ev] of result.results) {
    summary[ev.reality] = (summary[ev.reality] ?? 0) + 1;
    results[id] = normaliseEvidence(ev);
  }
  const report: JsonReport = {
    timestamp: result.timestamp,
    projectRoot: result.projectRoot,
    initialized: result.initialized,
    summary,
    results,
  };
  return JSON.stringify(report, null, 2);
}
