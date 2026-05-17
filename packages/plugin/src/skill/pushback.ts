// T2.10 Forcing pushback patterns 5종 (AC-R5-2, TC-10)
// 00-common Pattern 1~5 — vague answer 감지 + forcing prompt 반환

export type PushbackPatternId =
  | 'vague-target'
  | 'social-proof'
  | 'big-vision'
  | 'tailwind'
  | 'undefined-terms';

export interface PushbackMatch {
  pattern: PushbackPatternId;
  trigger: string;
  forcingPrompt: string;
}

interface PatternDef {
  id: PushbackPatternId;
  triggers: RegExp[];
  forcingPrompt: string;
}

const PATTERNS: PatternDef[] = [
  {
    id: 'vague-target',
    triggers: [
      /(?:젊은|adult|millennial|old|elderly)\s*(?:사용자|개발자|developer|maker|builder)/i,
      /\b(?:everyone|big market|massive|huge|broadly|generally)\b/i,
      /(?:큰\s*시장|광범위|일반적으로|불특정)/,
      /(?:사용자들|users)\s*(?:이|가|는)?\s*(?:좋아|like|enjoy)/i,
    ],
    forcingPrompt:
      '비슷한 도구·앱·게임은 이미 수많이 존재한다. 어떤 한 사람이 매주 어떤 상황에서 무엇 때문에 답답하길래 당신이 만드는 것이 그걸 풀어주는가? 그 한 사람을 specifying하라 — 카테고리 말고.',
  },
  {
    id: 'social-proof',
    triggers: [
      /(?:관심|interested|excited|hopeful)\s*있/,
      /\b(?:waitlist|대기자|signup|signed up)\b/i,
      /(?:다들|everyone)\s*좋다/,
    ],
    forcingPrompt:
      '아이디어를 좋아하는 건 공짜다. 누가 실제로 행동을 바꿨는가? 누가 돈을 내거나, 시간을 들이거나, 다른 도구를 버렸는가? 사라지면 진심으로 불편해할 사람은? 좋아함은 demand가 아니다.',
  },
  {
    id: 'big-vision',
    triggers: [
      /\b(?:전체|all-in-one|complete platform|everything)\b/i,
      /(?:큰\s*비전|full\s*vision|grand)/i,
      /\b(?:reduced|축소)\s*(?:version|버전)\s*(?:안|cannot)/i,
    ],
    forcingPrompt:
      '위험 신호다. 작은 버전에서 가치를 못 얻으면 보통 product가 더 커야 하는 게 아니라 가치 명제가 명확하지 않은 거다. 이번 주 안에 한 사람이 "이거 없으면 안 되겠다" 할 단 하나가 무엇인가?',
  },
  {
    id: 'tailwind',
    triggers: [
      /\b(?:AI|GPT|LLM|trend|wave)\s*(?:점점|getting|increasingly)/i,
      /\b(?:시장이?\s*성장|market\s*is\s*growing|riding\s*the\s*wave)/i,
    ],
    forcingPrompt:
      '트렌드는 vision이 아니다. 같은 분야 모든 경쟁자가 같은 트렌드를 인용한다. 이 분야가 어떻게 변해서 당신이 만드는 것을 더 essential하게 만드는가? 당신만의 thesis를 한 문장으로.',
  },
  {
    id: 'undefined-terms',
    triggers: [
      /\b(?:seamless|intuitive|frictionless|smooth|elegant)\b/i,
      /\b(?:매끄럽|직관적|편하게|쉽게|간편)/,
      /\b(?:better|improved|enhanced|optimized)\b\s*(?:UX|experience|interface)/i,
    ],
    forcingPrompt:
      '"seamless"·"직관적"·"빠르게"는 product feature가 아니라 feeling. 어느 step에서 사용자가 멈추는가? 멈추는 비율은? 사람이 그걸 거치는 모습을 본 적 있는가?',
  },
];

export function detectPushback(answer: string): PushbackMatch | null {
  for (const p of PATTERNS) {
    for (const re of p.triggers) {
      const m = answer.match(re);
      if (m) {
        return {
          pattern: p.id,
          trigger: m[0],
          forcingPrompt: p.forcingPrompt,
        };
      }
    }
  }
  return null;
}

export function listPatterns(): PushbackPatternId[] {
  return PATTERNS.map((p) => p.id);
}
