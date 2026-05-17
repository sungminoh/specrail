import { describe, it, expect } from 'vitest';
import { extractIds, extractRefs, classifyKind } from '../src/spec/ids.js';

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
