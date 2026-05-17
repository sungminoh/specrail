// T2.8 6 forcing questions skill (Phase 0) — F5.2, AC-R5-1, TC-9
// 00-common Phase 0 Reframing 패턴

import type { Question } from './ask.js';
export type { Question };

export const Q1_DEMAND_REALITY: Question = {
  id: 'q1-demand-reality',
  prompt:
    '이걸 누군가 진짜 원한다는 가장 강한 증거는? "관심 있다"·"대기자 등록"·"재밌어 보인다" 말고, 내일 사라지면 진심으로 화나거나 곤란해질 사람이 있는가?',
};

export const Q2_STATUS_QUO: Question = {
  id: 'q2-status-quo',
  prompt:
    '사용자가 지금 이 문제를 어떻게 — 못나게라도 — 풀고 있나? 그 workaround의 비용은? (시간·머릿속 부담·잊어버려서 잃은 것·친구/검색에 의존하는 횟수)',
};

export const Q3_DESPERATE_SPECIFICITY: Question = {
  id: 'q3-desperate-specificity',
  prompt:
    '이게 가장 필요한 진짜 한 사람을 묘사하라. 그 사람의 역할 / 상황 / 하루 / 가장 얻고 싶은 것 / 가장 두려워하는 결과는? 카테고리 말고 한 사람.',
};

export const Q4_NARROWEST_WEDGE: Question = {
  id: 'q4-narrowest-wedge',
  prompt:
    '누군가 이번 주에 진짜 가치를 느낄 가장 작은 버전이 뭔가? 전체 다 만들고 나서가 아니라.',
};

export const Q5_OBSERVATION: Question = {
  id: 'q5-observation',
  prompt:
    '실제로 누가 도움 없이 쓰는 걸 옆에서 본 적 있나? 무엇이 놀라웠나? (설문·데모 말고)',
};

export const Q6_FUTURE_FIT: Question = {
  id: 'q6-future-fit',
  prompt:
    '3년 후 세상이 의미 있게 다르면 — 그럴 거다 — 당신이 만드는 것은 더 essential해지나, 덜 essential해지나? 사용자 세상이 어떻게 변해서 가치가 늘어나는지 구체 thesis.',
};

export const ALL_FORCING_QUESTIONS: Question[] = [
  Q1_DEMAND_REALITY,
  Q2_STATUS_QUO,
  Q3_DESPERATE_SPECIFICITY,
  Q4_NARROWEST_WEDGE,
  Q5_OBSERVATION,
  Q6_FUTURE_FIT,
];
