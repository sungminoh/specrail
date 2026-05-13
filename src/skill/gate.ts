// F2.2 phase transition gate — INV-3 enforce
// ADR-8: explicit state machine (deterministic)
// ADR-8 DELTA: State source-of-truth = frontmatter primary, cache derived

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from '../markdown/frontmatter.js';
import { PhaseStatus } from '../state/machine.js';

export interface GateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Phase N+1 invoke 가능 여부 검사.
 * INV-3: Phase N+1 진입 시 Phase N status=Approved
 * INV-3 예외: Phase 1 (predecessor 없음) → 항상 allowed
 */
export async function canInvokePhase(
  projectRoot: string,
  targetPhase: number,
): Promise<GateResult> {
  if (targetPhase < 1 || targetPhase > 13) {
    return { allowed: false, reason: `Phase ${targetPhase} out of range (1-13)` };
  }

  if (targetPhase === 1) {
    return { allowed: true };
  }

  const prev = targetPhase - 1;
  const specDir = join(projectRoot, 'docs', 'spec');

  let files: string[];
  try {
    files = await readdir(specDir);
  } catch {
    return { allowed: false, reason: `docs/spec missing (Phase ${prev} not started)` };
  }

  const prefix = String(prev).padStart(2, '0') + '-';
  const file = files.find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  if (!file) {
    return { allowed: false, reason: `Phase ${prev} file missing` };
  }

  const raw = await readFile(join(specDir, file), 'utf8');
  const { frontmatter } = parseFrontmatter(raw);
  const status = frontmatter.status as PhaseStatus | undefined;

  if (status !== PhaseStatus.Approved) {
    return {
      allowed: false,
      reason: `Phase ${prev} status=${status ?? 'missing'} (need Approved)`,
    };
  }

  return { allowed: true };
}
