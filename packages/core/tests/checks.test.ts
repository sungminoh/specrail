import { describe, it, expect } from 'vitest';
import { runChecks } from '../src/checks/index.js';
import type { Phase } from '../src/spec/types.js';

function ph(num: 1 | 2 | 3 | 4 | 9 | 10 | 13, opts: {
  defines?: string[];
  refs?: Array<[string, string, number]>;
  status?: string;
  body?: string;
} = {}): Phase {
  return {
    projectId: 'aaaaaaaaaaaaaaaa',
    number: num,
    slug: `phase-${num}`,
    filePath: `docs/spec/${String(num).padStart(2, '0')}-x.md`,
    frontmatter: { phase: num, status: opts.status ?? 'Approved' },
    body: opts.body ?? '',
    parsedIds: opts.defines ?? [],
    parsedRefs: (opts.refs ?? []).map(([from, to, line]) => ({ from, to, line })),
    mtimeMs: 0,
  };
}

describe('runChecks — orphan-id', () => {
  it('flags an isolated F that has no in/out edges', () => {
    const findings = runChecks([ph(3, { defines: ['F9.9'] })]);
    expect(findings.some((f) => f.ruleId === 'orphan-id' && f.specId === 'F9.9')).toBe(true);
  });

  it('does not flag PERSONA / SCEN / JNY orphans (safe kinds)', () => {
    const findings = runChecks([
      ph(2, { defines: ['PERSONA-1', 'SCEN-1', 'JNY-1.1'] }),
    ]);
    expect(findings.filter((f) => f.ruleId === 'orphan-id')).toEqual([]);
  });
});

describe('runChecks — dangling-ref', () => {
  it('flags F → R when R is not defined', () => {
    const findings = runChecks([
      ph(3, { defines: ['F1.1'], refs: [['F1.1', 'R99', 5]] }),
    ]);
    const d = findings.find((f) => f.ruleId === 'dangling-ref');
    expect(d).toBeDefined();
    expect(d?.specId).toBe('R99');
    expect(d?.line).toBe(5);
    expect(d?.severity).toBe('error');
  });
});

describe('runChecks — status-mismatch', () => {
  it('flags Approved phase referencing a Draft phase', () => {
    const findings = runChecks([
      ph(9, { status: 'Approved', body: 'see Phase 13 for impl detail', defines: ['NFR-PERF-1'] }),
      ph(13, { status: 'Draft', defines: ['T1.1'] }),
    ]);
    expect(findings.some((f) => f.ruleId === 'status-mismatch')).toBe(true);
  });

  it('does not flag when both are Approved', () => {
    const findings = runChecks([
      ph(9, { status: 'Approved', body: 'see Phase 13', defines: ['NFR-1'] }),
      ph(13, { status: 'Approved', defines: ['T1.1'] }),
    ]);
    expect(findings.filter((f) => f.ruleId === 'status-mismatch')).toEqual([]);
  });
});

describe('runChecks — traceability-gap', () => {
  it('flags R with no TC chain', () => {
    const findings = runChecks([
      ph(3, { defines: ['R1', 'F1.1'], refs: [['F1.1', 'R1', 1]] }),
      // No TC ever references F1.1.
    ]);
    expect(findings.some((f) => f.ruleId === 'traceability-gap' && f.specId === 'R1')).toBe(true);
  });

  it('passes R with TC reaching back through F', () => {
    const findings = runChecks([
      ph(3, { defines: ['R1', 'F1.1'], refs: [['F1.1', 'R1', 1]] }),
      ph(10, { defines: ['TC-1'], refs: [['TC-1', 'F1.1', 1]] }),
    ]);
    expect(findings.filter((f) => f.ruleId === 'traceability-gap')).toEqual([]);
  });
});
