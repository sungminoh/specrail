import type { Phase, PhaseNumber } from '../spec/types.js';
import { buildGraph } from '../graph/build.js';
import { findOrphans, findDanglingRefs } from '../graph/orphan.js';
import { classifyKind } from '../spec/ids.js';
import type { CheckFinding } from './types.js';

const SAFE_ORPHAN_KINDS = new Set(['ADR', 'KPI', 'OQ', 'PERSONA', 'SCEN', 'JNY']);

export interface RunChecksOptions {
  ignoreOrphansInPhases?: PhaseNumber[];
}

export function runChecks(phases: Phase[], options: RunChecksOptions = {}): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const graph = buildGraph(phases, classifyKind);
  const ignored = new Set<PhaseNumber>(options.ignoreOrphansInPhases ?? []);

  for (const orphan of findOrphans(graph)) {
    const node = graph.nodes.find((n) => n.id === orphan);
    if (!node) continue;
    const phase = node.phase as PhaseNumber;
    if (ignored.has(phase)) continue;
    if (SAFE_ORPHAN_KINDS.has(node.kind ?? '')) continue;
    findings.push({
      ruleId: 'orphan-id',
      severity: 'warn',
      message: `Orphan ID ${orphan} (kind=${node.kind ?? '?'}) — defined but neither references nor is referenced`,
      phase,
      specId: orphan,
    });
  }

  for (const dangling of findDanglingRefs(graph)) {
    findings.push({
      ruleId: 'dangling-ref',
      severity: 'error',
      message: `Reference ${dangling.from} -> ${dangling.to} but ${dangling.to} is not defined`,
      phase: dangling.phase as PhaseNumber,
      line: dangling.line,
      specId: dangling.to,
    });
  }

  const phaseStatus = new Map<PhaseNumber, string>();
  for (const ph of phases) {
    const s = ph.frontmatter['status'];
    if (typeof s === 'string') phaseStatus.set(ph.number, s);
  }
  for (const ph of phases) {
    const ownStatus = phaseStatus.get(ph.number);
    if (ownStatus !== 'Approved') continue;
    for (const m of ph.body.matchAll(/\bphase\s+(\d{1,2})\b/gi)) {
      const n = Number(m[1]) as PhaseNumber;
      if (n < 1 || n > 13 || n === ph.number) continue;
      const otherStatus = phaseStatus.get(n);
      if (otherStatus && otherStatus !== 'Approved' && otherStatus !== 'Accepted') {
        findings.push({
          ruleId: 'status-mismatch',
          severity: 'info',
          message: `Phase ${ph.number} (Approved) references Phase ${n} (${otherStatus})`,
          phase: ph.number,
        });
        break;
      }
    }
  }

  const reachableFromR = new Map<string, Set<string>>();
  for (const node of graph.nodes) {
    if (!/^R\d/.test(node.id)) continue;
    const reached = new Set<string>();
    const queue: string[] = [node.id];
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) break;
      if (reached.has(id)) continue;
      reached.add(id);
      const ins = graph.inbound.get(id) ?? [];
      for (const e of ins) queue.push(e.from);
    }
    reachableFromR.set(node.id, reached);
  }
  for (const [rId, reached] of reachableFromR) {
    const hasTc = [...reached].some((id) => /^TC-\d/.test(id));
    if (!hasTc) {
      const node = graph.nodes.find((n) => n.id === rId);
      if (!node) continue;
      findings.push({
        ruleId: 'traceability-gap',
        severity: 'warn',
        message: `Requirement ${rId} has no TC- reaching it (R -> F -> S -> AC -> TC chain missing)`,
        phase: node.phase as PhaseNumber,
        specId: rId,
      });
    }
  }

  return findings;
}
