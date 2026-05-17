/**
 * R7 B2B expression detector (T3.1, AC-R7-1, TC-15)
 *
 * Detects B2B-specific language in spec text that would bias outputs
 * toward corporate/enterprise contexts, violating domain-neutrality (R7).
 */

export interface B2BMatch {
  /** Pattern identifier */
  pattern: string;
  /** The matched text fragment */
  trigger: string;
  /** Line number (1-based) when input is multi-line */
  line?: number;
  /** block = clear B2B term; warn = borderline / generic */
  severity: 'warn' | 'block';
  /** Human-readable replacement suggestion */
  suggestion: string;
}

interface PatternDef {
  id: string;
  regex: RegExp;
  severity: 'warn' | 'block';
  suggestion: string;
}

const PATTERNS: PatternDef[] = [
  {
    id: 'okr-quarter',
    regex: /(?:분기\s*okr|okr\s*분기|quarterly\s+okr|okr\s+quarter(?:ly)?)/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 목표·지표·달성 기준·성과 기준 등을 사용하세요.',
  },
  {
    id: 'promotion-review',
    regex: /(?:승진\s*(?:평가|심사|기준|대상)|promotion\s+review)/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 역할·권한 변경·레벨 업·역량 평가 등을 사용하세요.',
  },
  {
    id: 'layoff-termination',
    regex: /(?:해고|layoff|employee\s+termination|termination\s+(?:process|policy|notice))/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 사용자 제거·접근 해제·계정 비활성화 등을 사용하세요.',
  },
  {
    id: 'board-meeting',
    regex: /(?:이사회|board\s+(?:meeting|of\s+directors|resolution)|임원회의)/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 의사결정자·승인자·검토자·정책 결정 등을 사용하세요.',
  },
  {
    id: 'revenue-sales',
    regex: /(?:매출\s*(?:목표|실적|증대|달성)?|revenue(?:\s+target|\s+goal)?|sales\s+target)/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 성과 지표·수익 지표·핵심 지표 등을 사용하세요.',
  },
  {
    id: 'executive-title',
    regex: /(?:\bC[EFT]O\b|\bCOO\b|\bCMO\b|임원)/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 의사결정자·최종 승인자·관리자·역할 등을 사용하세요.',
  },
  {
    id: 'corporate-policy',
    regex: /(?:회사\s*정책|corporate\s+policy)/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 운영 정책·서비스 정책·이용 규칙 등을 사용하세요.',
  },
  {
    id: 'seniority-rank',
    regex: /(?:직책|직급|seniority\s+(?:level|ranking|system))/i,
    severity: 'block',
    suggestion: '도메인 무관 표현으로: 역할·권한 수준·책임 범위 등을 사용하세요.',
  },
  {
    id: 'kpi-metric',
    regex: /\bkpi\b/i,
    severity: 'warn',
    suggestion: '도메인 무관 표현으로: 핵심 지표·성과 지표·측정 기준 등을 사용하세요.',
  },
];

/**
 * Spec ID patterns to ignore — prevents false positives on references like KPI-1, R1, ADR-7.
 * Matches: UPPER-digits, UPPER.digits, UPPER-Word
 */
const ID_PATTERN = /\b(?:[A-Z]+-\d+(?:\.\d+)*|[A-Z]+(?:\.\d+)+|[A-Z]+-[A-Za-z]+)\b/g;

/**
 * H1 fix (3차 reviewer code-reviewer): length-preserving strip
 * so match indices stay aligned between stripped and raw line.
 */
function stripIds(text: string): string {
  return text.replace(ID_PATTERN, (match) => ' '.repeat(match.length));
}

/**
 * Detect B2B-specific expressions in the given text.
 *
 * @param text - Raw text to analyze (single or multi-line)
 * @returns Array of B2BMatch for each found B2B expression
 */
export function detectB2BExpressions(text: string): B2BMatch[] {
  if (text.length === 0) {
    return [];
  }

  const lines = text.split('\n');
  const isMultiLine = lines.length > 1;
  const results: B2BMatch[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const strippedLine = stripIds(rawLine);

    for (const { id, regex, severity, suggestion } of PATTERNS) {
      const strippedMatch = regex.exec(strippedLine);
      if (strippedMatch === null) {
        continue;
      }

      // Capture trigger from original (un-stripped) line for accurate reporting
      const rawMatch = regex.exec(rawLine);
      const trigger = rawMatch !== null ? rawMatch[0] : strippedMatch[0];

      const entry: B2BMatch = {
        pattern: id,
        trigger,
        severity,
        suggestion,
      };

      if (isMultiLine) {
        entry.line = lineIdx + 1;
      }

      results.push(entry);
    }
  }

  return results;
}
