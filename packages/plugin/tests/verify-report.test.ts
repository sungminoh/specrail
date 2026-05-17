import { describe, it, expect } from 'vitest';
import { formatHuman, countRealities } from '../src/verify/report/human.js';
import { formatJson } from '../src/verify/report/json.js';
import { formatMarkdown } from '../src/verify/report/markdown.js';
import type { VerifyResult } from '../src/verify/types.js';

function fixture(): VerifyResult {
  return {
    timestamp: '2026-05-14T12:00:00.000Z',
    projectRoot: '/repo',
    initialized: true,
    results: new Map([
      [
        'AC-R1-1',
        {
          id: 'AC-R1-1',
          idType: 'AC' as const,
          intent: 'Approved' as const,
          reality: 'Built' as const,
          evidence: [{ kind: 'test-pass', path: 'tests/x.test.ts' }],
          confidence: 'high' as const,
          rule: 'test-grep',
        },
      ],
      [
        'R1',
        {
          id: 'R1',
          idType: 'R' as const,
          intent: 'Approved' as const,
          reality: 'Built' as const,
          evidence: [{ kind: 'aggregated-children' }],
          confidence: 'medium' as const,
          rule: 'rfs-aggregate',
        },
      ],
      [
        'ARCH-1',
        {
          id: 'ARCH-1',
          idType: 'ARCH' as const,
          intent: 'Approved' as const,
          reality: 'ManualReview' as const,
          evidence: [{ kind: 'no-path-tokens' }],
          confidence: 'low' as const,
          rule: 'path-exists',
        },
      ],
    ]),
  };
}

describe('report formatters (US-V15)', () => {
  it('human report mentions every id', () => {
    const text = formatHuman(fixture());
    expect(text).toContain('AC-R1-1');
    expect(text).toContain('R1');
    expect(text).toContain('ARCH-1');
    expect(text).toContain('Built');
    expect(text).toContain('ManualReview');
  });

  it('JSON report is valid JSON with summary + results', () => {
    const text = formatJson(fixture());
    const parsed = JSON.parse(text);
    expect(parsed.initialized).toBe(true);
    expect(parsed.summary.Built).toBe(2);
    expect(parsed.summary.ManualReview).toBe(1);
    expect(parsed.results['AC-R1-1'].reality).toBe('Built');
  });

  it('markdown report contains the per-type table headers', () => {
    const md = formatMarkdown(fixture());
    expect(md).toMatch(/## AC/);
    expect(md).toMatch(/## ARCH/);
    expect(md).toMatch(/## R/);
    expect(md).toContain('| ID | Reality | Rule | Evidence |');
  });

  it('countRealities aggregates correctly', () => {
    const counts = countRealities(fixture());
    expect(counts.get('Built')).toBe(2);
    expect(counts.get('ManualReview')).toBe(1);
  });

  it('uninitialized projects produce friendly output', () => {
    const empty: VerifyResult = {
      timestamp: 'x',
      projectRoot: '/repo',
      initialized: false,
      results: new Map(),
    };
    expect(formatHuman(empty)).toContain('No docs/spec/');
    expect(formatMarkdown(empty)).toContain('No `docs/spec/`');
    const j = JSON.parse(formatJson(empty));
    expect(j.initialized).toBe(false);
  });
});
