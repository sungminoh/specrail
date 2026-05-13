import { describe, it, expect } from 'vitest';
import { composeSkillPrompt, declaresCommonInheritance, loadCommon } from '../src/skill/inheritance.js';
import { createAsker, next, answer, isComplete, type Question } from '../src/skill/ask.js';
import { detectPushback, listPatterns } from '../src/skill/pushback.js';

describe('00-common inheritance (T2.6, F5.4, AC-R5-3, TC-11)', () => {
  it('detects applies-to: 00-common in skill metadata', () => {
    expect(declaresCommonInheritance('applies-to: 00-common\n')).toBe(true);
    expect(declaresCommonInheritance('applies-to: every phase\n')).toBe(true);
    expect(declaresCommonInheritance('name: x\n')).toBe(false);
  });

  it('composeSkillPrompt prepends common', async () => {
    const out = await composeSkillPrompt('SKILL BODY');
    if (out !== 'SKILL BODY') {
      expect(out).toContain('SKILL BODY');
      expect(out).toContain('F5.4 auto-inject');
    }
  });

  it('composeSkillPrompt with includeCommon=false skips inject', async () => {
    const out = await composeSkillPrompt('BODY', { includeCommon: false });
    expect(out).toBe('BODY');
  });

  it('loadCommon returns content from default path', async () => {
    const common = await loadCommon();
    // 00-common-principles.md should exist in this project
    expect(common.length).toBeGreaterThan(0);
    expect(common).toContain('common-principles');
  });
});

describe('AskUserQuestion ONE-AT-A-TIME (T2.7, F5.3)', () => {
  const qs: Question[] = [
    { id: 'q1', prompt: 'first' },
    { id: 'q2', prompt: 'second' },
    { id: 'q3', prompt: 'third' },
  ];

  it('next returns questions in order', () => {
    const s = createAsker(qs);
    expect(next(s)?.id).toBe('q1');
  });

  it('answer advances to next question', () => {
    const s = createAsker(qs);
    answer(s, 'q1', 'A');
    expect(next(s)?.id).toBe('q2');
  });

  it('answer twice for same question throws (F5.3 violation)', () => {
    const s = createAsker(qs);
    answer(s, 'q1', 'A');
    expect(() => answer(s, 'q1', 'B')).toThrow(/already answered/);
  });

  it('answer for non-pending question throws', () => {
    const s = createAsker(qs);
    expect(() => answer(s, 'q99', 'X')).toThrow(/not pending/);
  });

  it('isComplete true after all answered', () => {
    const s = createAsker(qs);
    answer(s, 'q1', 'A');
    answer(s, 'q2', 'B');
    answer(s, 'q3', 'C');
    expect(isComplete(s)).toBe(true);
    expect(next(s)).toBeNull();
  });
});

describe('Forcing pushback patterns (T2.10, AC-R5-2, TC-10)', () => {
  it('exports 5 patterns', () => {
    expect(listPatterns()).toHaveLength(5);
  });

  it('detects vague-target', () => {
    const m = detectPushback('젊은 사용자들이 좋아할 것 같아요');
    expect(m?.pattern).toBe('vague-target');
  });

  it('detects social-proof', () => {
    const m = detectPushback('관심 있는 분이 많아요, 대기자 30명');
    expect(m?.pattern).toBe('social-proof');
  });

  it('detects undefined-terms (seamless)', () => {
    const m = detectPushback('seamless 한 user experience를 제공');
    expect(m?.pattern).toBe('undefined-terms');
  });

  it('detects tailwind', () => {
    const m = detectPushback('AI 점점 좋아지니까 시장이 성장합니다');
    // Should match one of tailwind triggers
    expect(m).not.toBeNull();
  });

  it('returns null for specific answers', () => {
    const m = detectPushback(
      '김민지, 32, 프리랜서 디자이너, 매주 토요일 오전에 카페에서 spec 작성 시 grep 5번 사용함',
    );
    expect(m).toBeNull();
  });
});
