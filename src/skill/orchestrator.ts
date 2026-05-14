// US-T5.3 — IdCounter wire-up (M5)
// IdCounter.next() 호출하는 공용 entry point. Skill body·CLI·hook 모두 이 함수 호출.
// ADR-11: Phase N+1 invoke 정책 — Manual trigger (with optional auto-chain via /plan-pipeline continue).
// nextPhase() 함수는 suggestion만 반환. 자동 invoke 없음. 사용자 명시 호출 필요.

import { IdCounter } from '../spec/counter.js';
import type { SpecTier } from '../spec/id.js';
import { status } from '../cli/status.js';

// Cache per projectRoot — IdCounter mutex가 instance-level이므로 같은 instance 공유 필수.
// R2 H7: LRU bound + reject auto-evict prevent unbounded growth + poison cache.
const COUNTER_CACHE_MAX = 100;
const counterCache = new Map<string, Promise<IdCounter>>();

async function getCounter(projectRoot: string): Promise<IdCounter> {
  let p = counterCache.get(projectRoot);
  if (p) return p;

  if (counterCache.size >= COUNTER_CACHE_MAX) {
    const oldest = counterCache.keys().next().value;
    if (oldest !== undefined) counterCache.delete(oldest);
  }

  p = IdCounter.load(projectRoot);
  counterCache.set(projectRoot, p);
  p.catch(() => counterCache.delete(projectRoot));
  return p;
}

export async function issueId(
  projectRoot: string,
  tier: SpecTier,
  phaseId: number,
  parents: number[] = [],
): Promise<string> {
  const counter = await getCounter(projectRoot);
  return counter.next(tier, phaseId, parents);
}

/** Test-only — reset cache (for tmpdir test isolation) */
export function _resetCounterCache(): void {
  counterCache.clear();
}

// ADR-11: nextPhase() — Phase N+1 suggestion only. No auto-invoke.
// /plan-pipeline continue 명령이 이 결과를 읽어 phase N+1 skill invoke.

export interface NextPhaseResult {
  hasNext: boolean;
  nextPhase: number | null;
  reason: string;
  blocked?: boolean; // current phase status가 Approved 아닐 때
}

/**
 * 현재 상태 기준으로 다음 invoke 해야 할 phase를 식별 (ADR-11).
 * Phase N+1 자동 invoke 없음 — suggestion만 반환.
 */
export async function nextPhase(projectRoot: string): Promise<NextPhaseResult> {
  const s = await status(projectRoot);

  if (!s.initialized) {
    return {
      hasNext: false,
      nextPhase: null,
      reason: 'Project not initialized. Run /plan-pipeline init first.',
    };
  }

  if (s.complete) {
    return {
      hasNext: false,
      nextPhase: null,
      reason: 'All 13 phases complete. Phase 13 implementation handoff time.',
    };
  }

  if (s.currentPhase === null) {
    return {
      hasNext: false,
      nextPhase: null,
      reason: 'Invalid state — no current phase identified.',
    };
  }

  // currentPhase가 Draft이면 approve 필요 (blocked) — but next phase IS known (R2 M8).
  // Caller distinguishes "no work" (hasNext:false) from "blocked work needing approve".
  const cur = s.phases[s.currentPhase - 1];
  if (cur && cur.status === 'Draft') {
    return {
      hasNext: true,
      nextPhase: s.currentPhase,
      reason: `Phase ${s.currentPhase} status=Draft. Approve first via /plan-pipeline approve ${s.currentPhase}.`,
      blocked: true,
    };
  }

  // Empty 또는 missing — 사용자가 phase 아직 진행 안 함
  return {
    hasNext: true,
    nextPhase: s.currentPhase,
    reason: `Next: /plan-pipeline phase ${s.currentPhase}`,
  };
}
