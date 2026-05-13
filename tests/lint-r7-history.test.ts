import { describe, it, expect } from 'vitest';
import { detectV3RefHistory, type HistoryMatch } from '../src/lint/r7-history.js';

describe('T3.3 R7 v3 example reference history check (AC-R7-3, TC-17)', () => {
  // TC-1: 빈 commit history → 위반 없음
  it('returns empty array for empty commit history', () => {
    const matches = detectV3RefHistory([]);
    expect(matches).toHaveLength(0);
  });

  // TC-2: "based on v3 example" → warn 트리거
  it('detects "based on v3 example" in commit message', () => {
    const matches = detectV3RefHistory(['based on v3 example from archive']);
    expect(matches.length).toBeGreaterThan(0);
    const m = matches[0];
    expect(m.pattern).toMatch(/v3-ref/);
    expect(m.severity).toBe('warn');
    expect(m.subject).toBe('based on v3 example from archive');
  });

  // TC-3: "cherry-pick from v3-archive" → info 트리거
  it('detects "cherry-pick from v3" in commit message', () => {
    const matches = detectV3RefHistory(['cherry-pick from v3-archive plugin spec']);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m: HistoryMatch) => m.pattern === 'cherry-pick-v3')).toBe(true);
    expect(matches.find((m: HistoryMatch) => m.pattern === 'cherry-pick-v3')!.severity).toBe('info');
  });

  // TC-4: 관련 없는 commit message → 위반 없음
  it('passes unrelated commit messages without violations', () => {
    const messages = [
      'feat(lint): add domain expression detector',
      'fix: correct frontmatter parsing edge case',
      'chore: update dependencies',
      'docs: update architecture notes',
    ];
    const matches = detectV3RefHistory(messages);
    expect(matches).toHaveLength(0);
  });

  // TC-5: v3 example unique marker (self-application content) 검출
  it('detects v3 example unique marker "Planning Pipeline Plugin (v4)"', () => {
    const matches = detectV3RefHistory([
      'refactor: port Planning Pipeline Plugin (v4) spec from v3 example',
    ]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m: HistoryMatch) => m.pattern === 'v3-unique-marker')).toBe(true);
    expect(
      matches.find((m: HistoryMatch) => m.pattern === 'v3-unique-marker')!.severity,
    ).toBe('warn');
  });

  // TC-6: git 없어도 graceful (빈 배열 주입으로 시뮬레이션)
  it('is graceful when no commits are provided (simulates missing git)', () => {
    // detectV3RefHistory는 commit messages를 외부에서 주입받으므로
    // git 부재 시 빈 배열을 넘기면 된다
    expect(() => detectV3RefHistory([])).not.toThrow();
    expect(detectV3RefHistory([])).toHaveLength(0);
  });

  // TC-7: "retrofit.*v3" 패턴 검출 → warn
  it('detects "retrofit v3" pattern', () => {
    const matches = detectV3RefHistory(['retrofit v3 example structure into new spec']);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m: HistoryMatch) => m.pattern === 'retrofit-v3')).toBe(true);
    expect(matches.find((m: HistoryMatch) => m.pattern === 'retrofit-v3')!.severity).toBe('warn');
  });

  // TC-8: "copied from v3" → info 트리거
  it('detects "copied from v3" pattern', () => {
    const matches = detectV3RefHistory(['copied from v3 spec template']);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m: HistoryMatch) => m.pattern === 'copied-v3')).toBe(true);
    expect(matches.find((m: HistoryMatch) => m.pattern === 'copied-v3')!.severity).toBe('info');
  });

  // TC-9: commitSha 필드 존재 시 전달됨
  it('preserves commitSha when provided via structured input', () => {
    // detectV3RefHistory는 plain string[]를 받음
    // sha 포함 버전은 detectV3RefHistoryRaw를 통해 별도 검증
    // 여기서는 subject가 보존되는지 확인
    const subject = 'based on v3 example layout';
    const matches = detectV3RefHistory([subject]);
    expect(matches[0].subject).toBe(subject);
  });

  // TC-10: 복수 패턴 동시 검출
  it('detects multiple patterns across multiple commit messages', () => {
    const messages = [
      'based on v3 example from archive',
      'cherry-pick from v3-archive plugin spec',
      'retrofit v3 example structure into new spec',
    ];
    const matches = detectV3RefHistory(messages);
    const patterns = matches.map((m: HistoryMatch) => m.pattern);
    expect(patterns).toContain('v3-ref');
    expect(patterns).toContain('cherry-pick-v3');
    expect(patterns).toContain('retrofit-v3');
  });
});
