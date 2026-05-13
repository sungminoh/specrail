// C2 /plan-pipeline status command — analyst ambiguity #6 resolved
// ADR-8: frontmatter primary truth. Phase progress 조회.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from '../markdown/frontmatter.js';
import { PhaseStatus } from '../state/machine.js';
import { buildGraph } from '../graph/builder.js';

export interface PhaseProgress {
  phase: number;
  name: string;
  status: 'Empty' | 'Draft' | 'Approved' | 'missing';
  file?: string;
}

export interface StatusResult {
  initialized: boolean;
  phases: PhaseProgress[];
  phasesApproved: number;
  currentPhase: number | null;
  totalIds: number;
  complete: boolean;
  message: string;
}

// 13 phases expected — prefix → name mapping
const PHASE_NAMES: Record<number, string> = {
  1: 'prd',
  2: 'goals',
  3: 'features',
  4: 'information-architecture',
  5: 'data',
  6: 'api',
  7: 'ui',
  8: 'security',
  9: 'ops',
  10: 'performance',
  11: 'test',
  12: 'risks',
  13: 'roadmap',
};

const TOTAL_PHASES = 13;

export async function status(projectRoot: string): Promise<StatusResult> {
  const specDir = join(projectRoot, 'docs', 'spec');

  // Check if docs/spec exists
  let files: string[];
  try {
    files = (await readdir(specDir)).filter((f) => /^\d{2}.*\.md$/.test(f)).sort();
  } catch {
    return {
      initialized: false,
      phases: [],
      phasesApproved: 0,
      currentPhase: null,
      totalIds: 0,
      complete: false,
      message: '초기화되지 않은 프로젝트입니다. /plan-pipeline init 으로 시작하세요.',
    };
  }

  // Build phase map from found files
  const fileByPhase = new Map<number, string>();
  for (const f of files) {
    const num = parseInt(f.slice(0, 2), 10);
    if (num >= 1 && num <= TOTAL_PHASES) {
      fileByPhase.set(num, f);
    }
  }

  // Build PhaseProgress for all 13 phases
  const phases: PhaseProgress[] = [];
  for (let i = 1; i <= TOTAL_PHASES; i++) {
    const file = fileByPhase.get(i);
    if (!file) {
      phases.push({ phase: i, name: PHASE_NAMES[i] ?? `phase-${i}`, status: 'missing' });
      continue;
    }

    const raw = await readFile(join(specDir, file), 'utf8');
    const { frontmatter } = parseFrontmatter(raw);
    const rawStatus = frontmatter.status as string | undefined;

    let phaseStatus: 'Empty' | 'Draft' | 'Approved' | 'missing';
    if (
      rawStatus === PhaseStatus.Approved ||
      rawStatus === PhaseStatus.Draft ||
      rawStatus === PhaseStatus.Empty
    ) {
      phaseStatus = rawStatus;
    } else {
      phaseStatus = 'missing';
    }

    phases.push({ phase: i, name: PHASE_NAMES[i] ?? `phase-${i}`, status: phaseStatus, file });
  }

  const phasesApproved = phases.filter((p) => p.status === 'Approved').length;

  // currentPhase = first non-Approved phase (null if all approved)
  const firstNonApproved = phases.find((p) => p.status !== 'Approved');
  const currentPhase = firstNonApproved?.phase ?? null;

  // totalIds from graph
  const graph = await buildGraph(projectRoot);
  const totalIds = graph.nodes.length;

  const complete = phasesApproved === TOTAL_PHASES;

  const message = buildMessage({ initialized: true, phasesApproved, currentPhase, totalIds, complete, phases });

  return { initialized: true, phases, phasesApproved, currentPhase, totalIds, complete, message };
}

function buildMessage(args: {
  initialized: boolean;
  phasesApproved: number;
  currentPhase: number | null;
  totalIds: number;
  complete: boolean;
  phases: PhaseProgress[];
}): string {
  const lines: string[] = ['Plan Pipeline v4 Status', `초기화: 예`];

  if (args.complete) {
    lines.push(`진행: 13/13 phase 완료`);
    lines.push(`전체 ID 수: ${args.totalIds}`);
    lines.push('모든 phase가 승인(Approved) 되었습니다. 완료!');
  } else {
    lines.push(`진행: ${args.phasesApproved}/${TOTAL_PHASES} phase 승인됨`);
    if (args.currentPhase !== null) {
      const p = args.phases.find((ph) => ph.phase === args.currentPhase);
      const statusLabel = p?.status ?? 'missing';
      lines.push(`현재 phase: ${args.currentPhase} (${p?.name ?? ''}, ${statusLabel})`);
    }
    lines.push(`전체 ID 수: ${args.totalIds}`);
  }

  return lines.join('\n');
}
