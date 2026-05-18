import { describe, it, expect } from 'vitest';
import { extractIds, extractRefs, extractDefinedIds, classifyKind } from '../src/spec/ids.js';

describe('extractIds', () => {
  it('extracts R/F/S/NFR/TC/AC/INV ids', () => {
    const text = 'See R1, F1.2, S1.2.3, NFR-PERF-1, TC-12, AC-R1-1, INV-3.';
    expect(extractIds(text)).toEqual(['R1', 'F1.2', 'S1.2.3', 'NFR-PERF-1', 'TC-12', 'AC-R1-1', 'INV-3']);
  });

  it('preserves first-occurrence order, deduplicates', () => {
    expect(extractIds('R1 R2 R1 R3 R2')).toEqual(['R1', 'R2', 'R3']);
  });

  it('returns empty array on plain prose', () => {
    expect(extractIds('the quick brown fox')).toEqual([]);
  });
});

describe('extractRefs', () => {
  it('emits refs with 1-based line numbers, skipping self', () => {
    const text = 'line 1: F1.1 def\nline 2: refs F1.1 again and TC-3';
    const refs = extractRefs(text, { definedIds: new Set(['F1.1']), from: 'F1.1' });
    // Self refs filtered; TC-3 counted at line 2.
    expect(refs.find((r) => r.to === 'TC-3')?.line).toBe(2);
    expect(refs.every((r) => r.to !== 'F1.1')).toBe(true);
  });
});

describe('classifyKind', () => {
  it.each([
    ['R1', 'R'],
    ['F2.3', 'F'],
    ['S1.2.3', 'S'],
    ['NFR-PERF-1', 'NFR'],
    ['TC-9', 'TC'],
    ['AC-R3-2', 'AC'],
    ['ADR-1', 'ADR'],
    ['RISK-2', 'RISK'],
    ['KPI-1', 'KPI'],
    ['PAIN-DRIFT-1', 'PAIN'],
    ['PERSONA-1', 'PERSONA'],
    ['SCEN-2', 'SCEN'],
    ['JNY-1.1', 'JNY'],
    ['P-CC-3', 'P-CC'],
    ['W-CC-SHELL', 'W-CC'],
    ['FLN-30', 'FLN'],
    ['FLE-5', 'FLE'],
  ])('%s → %s', (id, expected) => {
    expect(classifyKind(id)).toBe(expected);
  });

  it('returns null for unknown patterns', () => {
    expect(classifyKind('Z9')).toBeNull();
    expect(classifyKind('foobar')).toBeNull();
  });
});

describe('extractDefinedIds (TC-CORE-BULLET-DEF)', () => {
  it('recognizes heading-style definitions', () => {
    const body = '## R1: Spec view\n\n### F1.1: Phase view\n\nprose';
    expect(extractDefinedIds(body)).toEqual(['R1', 'F1.1']);
  });

  it('recognizes attrs-block definitions', () => {
    const body = [
      '<!-- specrail:attrs id=NFR-PERF-1 -->',
      '```yaml',
      'status: Approved',
      '```',
      '<!-- /specrail:attrs -->',
    ].join('\n');
    expect(extractDefinedIds(body)).toEqual(['NFR-PERF-1']);
  });

  it('AC-CORE-1: recognizes bullet-style `- **AC-R1-1:**` definitions', () => {
    const body = '- **AC-R1-1:** GIVEN dashboard 실행, WHEN 사용자 클릭, THEN phase view 렌더.';
    expect(extractDefinedIds(body)).toEqual(['AC-R1-1']);
  });

  it('AC-CORE-3: bullet pattern works for non-AC ID families too', () => {
    const body = [
      '- **F1.2:** feature description',
      '- **NFR-PERF-2:** non-functional req',
      '- **TC-12:** test case',
    ].join('\n');
    expect(extractDefinedIds(body)).toEqual(['F1.2', 'NFR-PERF-2', 'TC-12']);
  });

  it('handles nested (indented) bullet definitions', () => {
    const body = '  - **AC-R2-7:** indented bullet definition.';
    expect(extractDefinedIds(body)).toEqual(['AC-R2-7']);
  });

  it('mixed definition styles → all recognized, first-occurrence order, deduped', () => {
    const body = [
      '## R1: heading definition',
      '',
      '<!-- specrail:attrs id=NFR-PERF-1 -->',
      '```yaml',
      'status: Approved',
      '```',
      '<!-- /specrail:attrs -->',
      '',
      '- **AC-R1-1:** GIVEN ...',
      '- **AC-R1-2:** GIVEN ...',
      '',
      '- **AC-R1-1:** repeat (should dedupe)',
    ].join('\n');
    expect(extractDefinedIds(body)).toEqual(['R1', 'NFR-PERF-1', 'AC-R1-1', 'AC-R1-2']);
  });

  it('does NOT match plain bold-emphasis without bullet (avoids false positives)', () => {
    const body = 'See **R1:** in the intro paragraph.'; // no leading "- "
    expect(extractDefinedIds(body)).toEqual([]);
  });

  it('does NOT match bullet without bold (avoids false positives)', () => {
    const body = '- R1: just text, not a definition';
    expect(extractDefinedIds(body)).toEqual([]);
  });

  it('does NOT match bullet without trailing colon', () => {
    const body = '- **R1** mentioned in passing';
    expect(extractDefinedIds(body)).toEqual([]);
  });
});
