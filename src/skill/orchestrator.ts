// US-T5.3 — IdCounter wire-up (M5)
// IdCounter.next() 호출하는 공용 entry point. Skill body·CLI·hook 모두 이 함수 호출.

import { IdCounter } from '../spec/counter.js';
import type { SpecTier } from '../spec/id.js';

// Cache per projectRoot — IdCounter mutex가 instance-level이므로 같은 instance 공유 필수
const counterCache = new Map<string, Promise<IdCounter>>();

async function getCounter(projectRoot: string): Promise<IdCounter> {
  let p = counterCache.get(projectRoot);
  if (!p) {
    p = IdCounter.load(projectRoot);
    counterCache.set(projectRoot, p);
  }
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
