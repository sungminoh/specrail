import { describe, it, expect } from 'vitest';
import { detectB2BExpressions, type B2BMatch } from '../src/lint/r7-b2b.js';

describe('T3.1 R7 B2B expression lint (AC-R7-1, TC-15)', () => {
  // TC-1: B2B 표현 검출 — 분기 OKR
  it('detects 분기 OKR 달성', () => {
    const matches = detectB2BExpressions('우리 분기 OKR 달성 평가');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].pattern).toBe('okr-quarter');
  });

  // TC-2: B2B 표현 검출 — 승진 평가
  it('detects 승진 평가', () => {
    const matches = detectB2BExpressions('연간 승진 평가 프로세스');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m: B2BMatch) => m.pattern === 'promotion-review')).toBe(true);
  });

  // TC-3: B2B 표현 검출 — 해고 정책
  it('detects 해고 정책', () => {
    const matches = detectB2BExpressions('해고 정책에 따라 처리한다');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m: B2BMatch) => m.pattern === 'layoff-termination')).toBe(true);
  });

  // TC-4: B2B 표현 검출 — 이사회 의사록
  it('detects 이사회 의사록', () => {
    const matches = detectB2BExpressions('이사회 의사록 승인 절차');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m: B2BMatch) => m.pattern === 'board-meeting')).toBe(true);
  });

  // TC-5: B2B 표현 검출 — CEO (case-insensitive)
  it('detects CEO and ceo (case-insensitive)', () => {
    const matchesUpper = detectB2BExpressions('CEO 승인이 필요하다');
    expect(matchesUpper.length).toBeGreaterThan(0);
    expect(matchesUpper.some((m: B2BMatch) => m.pattern === 'executive-title')).toBe(true);

    const matchesLower = detectB2BExpressions('ceo 승인이 필요하다');
    expect(matchesLower.length).toBeGreaterThan(0);
    expect(matchesLower.some((m: B2BMatch) => m.pattern === 'executive-title')).toBe(true);
  });

  // TC-6: 도메인 무관 표현 통과 — false positive 없음
  it('passes domain-neutral expressions (사용자 결제, 주문 기록, 게임 점수)', () => {
    const matches = detectB2BExpressions('사용자 결제 내역 및 주문 기록, 게임 점수 집계');
    expect(matches).toHaveLength(0);
  });

  // TC-7: ID 패턴은 false positive 아님 (KPI-1, R1, ADR-7)
  it('ignores ID patterns like KPI-1, R1, ADR-7', () => {
    const matches = detectB2BExpressions('KPI-1 달성 여부는 R1 및 ADR-7 참조');
    expect(matches).toHaveLength(0);
  });

  // TC-8: 빈 string 통과
  it('returns empty array for empty string', () => {
    const matches = detectB2BExpressions('');
    expect(matches).toHaveLength(0);
  });

  // TC-9: 매출·revenue 검출
  it('detects 매출 and revenue', () => {
    const matchesKo = detectB2BExpressions('분기 매출 목표 달성');
    expect(matchesKo.some((m: B2BMatch) => m.pattern === 'revenue-sales')).toBe(true);

    const matchesEn = detectB2BExpressions('quarterly revenue target');
    expect(matchesEn.some((m: B2BMatch) => m.pattern === 'revenue-sales')).toBe(true);
  });

  // TC-10: layoff (영문) 검출
  it('detects layoff and termination in English', () => {
    const matchesLayoff = detectB2BExpressions('company-wide layoff announcement');
    expect(matchesLayoff.some((m: B2BMatch) => m.pattern === 'layoff-termination')).toBe(true);

    const matchesTerm = detectB2BExpressions('employee termination process');
    expect(matchesTerm.some((m: B2BMatch) => m.pattern === 'layoff-termination')).toBe(true);
  });

  // TC-11: block severity on 명확한 B2B 표현
  it('assigns block severity to 승진', () => {
    const matches = detectB2BExpressions('승진 심사 결과');
    const m = matches.find((x: B2BMatch) => x.pattern === 'promotion-review');
    expect(m).toBeDefined();
    expect(m!.severity).toBe('block');
  });

  // TC-12: suggestion 메시지 존재
  it('provides suggestion for each match', () => {
    const matches = detectB2BExpressions('이사회 결의 사항');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].suggestion).toBeTruthy();
    expect(matches[0].suggestion.length).toBeGreaterThan(0);
  });

  // TC-13: trigger 필드에 매칭된 텍스트 포함
  it('captures trigger text in match', () => {
    const matches = detectB2BExpressions('CFO 보고서 제출');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].trigger).toBeTruthy();
  });

  // TC-14: 복수 패턴 동시 검출
  it('detects multiple patterns in one text', () => {
    const matches = detectB2BExpressions('CEO가 분기 OKR 달성 여부를 이사회에 보고');
    const patterns = matches.map((m: B2BMatch) => m.pattern);
    expect(patterns).toContain('executive-title');
    expect(patterns).toContain('okr-quarter');
    expect(patterns).toContain('board-meeting');
  });

  // TC-15: KPI 단독 텍스트(ID 아님) 검출
  it('detects standalone KPI (not ID pattern)', () => {
    const matches = detectB2BExpressions('핵심 KPI 지표 관리');
    expect(matches.some((m: B2BMatch) => m.pattern === 'kpi-metric')).toBe(true);
  });
});
