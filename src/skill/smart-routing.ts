// T2.9 Smart Routing for Phase 0 forcing questions — AC-R5-1, TC-9
// 00-common §Smart Routing 패턴: 사용자 단계에 따라 6개 중 sub-set

import { ALL_FORCING_QUESTIONS, type Question } from './forcing-questions.js';

export type ProductStage = 'pre-product' | 'has-users' | 'has-paying' | 'pure-infra';

const ROUTING: Record<ProductStage, string[]> = {
  'pre-product': ['q1-demand-reality', 'q2-status-quo', 'q3-desperate-specificity'],
  'has-users': ['q2-status-quo', 'q4-narrowest-wedge', 'q5-observation'],
  'has-paying': ['q4-narrowest-wedge', 'q5-observation', 'q6-future-fit'],
  'pure-infra': ['q2-status-quo', 'q4-narrowest-wedge'],
};

export interface RouteOptions {
  stage: ProductStage;
  // Already-known answers (skip those questions)
  answered?: string[];
}

export function routeQuestions(opts: RouteOptions): Question[] {
  const ids = ROUTING[opts.stage] ?? ROUTING['pre-product'];
  const answered = new Set(opts.answered ?? []);
  return ALL_FORCING_QUESTIONS.filter((q) => ids.includes(q.id) && !answered.has(q.id));
}

export function detectStage(hints: {
  hasUsers?: boolean;
  hasPaying?: boolean;
  isInfra?: boolean;
}): ProductStage {
  if (hints.isInfra) return 'pure-infra';
  if (hints.hasPaying) return 'has-paying';
  if (hints.hasUsers) return 'has-users';
  return 'pre-product';
}
