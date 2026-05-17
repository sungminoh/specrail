// T-CSA.3 — ID_PATTERN_SOURCE + USER_NAMESPACE_PATTERN extension for attrs migration
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.3
// Adds capability-suffix R/F/AC, FLN/FLE flow ids, PERSONA/SCEN/JNY,
// ZN-CC-{NAME}-N, P-CC/E-CC UI ids, and T-CSA.N capability tasks.

import { describe, it, expect } from 'vitest';
import { CITATION_RE } from '../src/spec/patterns.js';

// Helper: does the regex match this token as a single, complete capture?
function matches(token: string): boolean {
  const m = ` ${token} `.match(CITATION_RE);
  return !!m && m[0] === token;
}

describe('T-CSA.3 ID family extend — capability-suffix R/F/AC', () => {
  it('matches R-CSA', () => expect(matches('R-CSA')).toBe(true));
  it('matches R-VIZ (other capability-suffix R)', () => expect(matches('R-VIZ')).toBe(true));
  it('matches F-R-CSA.1', () => expect(matches('F-R-CSA.1')).toBe(true));
  it('matches F-R-CSA.5', () => expect(matches('F-R-CSA.5')).toBe(true));
  it('matches AC-R-CSA-1', () => expect(matches('AC-R-CSA-1')).toBe(true));
  it('matches AC-R-CSA-7', () => expect(matches('AC-R-CSA-7')).toBe(true));
});

describe('T-CSA.3 ID family extend — flow / persona / scenario / journey', () => {
  it('matches FLN-1 through FLN-76', () => {
    expect(matches('FLN-1')).toBe(true);
    expect(matches('FLN-76')).toBe(true);
  });
  it('matches FLE-1 through FLE-50', () => {
    expect(matches('FLE-1')).toBe(true);
    expect(matches('FLE-50')).toBe(true);
  });
  it('matches PERSONA-1', () => expect(matches('PERSONA-1')).toBe(true));
  it('matches PERSONA-EDGE-1', () => expect(matches('PERSONA-EDGE-1')).toBe(true));
  it('matches SCEN-1·2·3', () => {
    expect(matches('SCEN-1')).toBe(true);
    expect(matches('SCEN-3')).toBe(true);
  });
  it('matches JNY-1.1 dotted form', () => {
    expect(matches('JNY-1.1')).toBe(true);
    expect(matches('JNY-3.6')).toBe(true);
  });
});

describe('T-CSA.3 ID family extend — wireframe zones + UI elements + tasks', () => {
  it('matches ZN-CC-PAT-1 through ZN-CC-PAT-6', () => {
    expect(matches('ZN-CC-PAT-1')).toBe(true);
    expect(matches('ZN-CC-PAT-6')).toBe(true);
  });
  it('matches P-CC-1 through P-CC-15', () => {
    expect(matches('P-CC-1')).toBe(true);
    expect(matches('P-CC-15')).toBe(true);
  });
  it('matches E-CC-1 through E-CC-8', () => {
    expect(matches('E-CC-1')).toBe(true);
    expect(matches('E-CC-8')).toBe(true);
  });
  it('matches T-CSA.1 through T-CSA.16', () => {
    expect(matches('T-CSA.1')).toBe(true);
    expect(matches('T-CSA.16')).toBe(true);
  });
});

describe('T-CSA.3 regression — existing canonical IDs still match', () => {
  it('R1, R13 (canonical R-tier)', () => {
    expect(matches('R1')).toBe(true);
    expect(matches('R13')).toBe(true);
  });
  it('F1.2 (canonical F-tier)', () => expect(matches('F1.2')).toBe(true));
  it('S1.2.3 (canonical S-tier)', () => expect(matches('S1.2.3')).toBe(true));
  it('AC-R1-1 (canonical AC)', () => expect(matches('AC-R1-1')).toBe(true));
  it('ENT-Project, ENT-AttrsBlock', () => {
    expect(matches('ENT-Project')).toBe(true);
    expect(matches('ENT-AttrsBlock')).toBe(true);
  });
  it('NFR-PERF-1, NFR-A11Y-2', () => {
    expect(matches('NFR-PERF-1')).toBe(true);
    expect(matches('NFR-A11Y-2')).toBe(true);
  });
  it('ARCH-13, EXT-6, ADR-12, RISK-1', () => {
    expect(matches('ARCH-13')).toBe(true);
    expect(matches('EXT-6')).toBe(true);
    expect(matches('ADR-12')).toBe(true);
    expect(matches('RISK-1')).toBe(true);
  });
  it('T11.7 (canonical task)', () => expect(matches('T11.7')).toBe(true));
});

describe('T-CSA.3 regression — non-IDs still rejected', () => {
  it('HTTP-200, GET-401 (reserved prefixes)', () => {
    // These match the user-namespace shape but isReservedId() filters them.
    // CITATION_RE itself does match; isReservedId is the post-filter.
    // We only assert the namespace matches; reserved filtering is upstream concern.
    expect(matches('HTTP-200')).toBe(true);
    expect(matches('GET-401')).toBe(true);
  });
  it('lowercase tokens do NOT match', () => {
    expect(matches('rln-1')).toBe(false);
    expect(matches('persona-1')).toBe(false);
  });
  it('bare letters / digits do NOT match', () => {
    expect(matches('Foo')).toBe(false);
    expect(matches('123')).toBe(false);
  });
});

describe('T-CSA.3 — compound token suppression (regression)', () => {
  it('R6.F1 author shorthand does not leak F1 (existing behavior)', () => {
    const matches = [...'R6.F1 cross-ref'.matchAll(CITATION_RE)].map((m) => m[0]);
    expect(matches).toContain('R6');
    expect(matches).not.toContain('F1');
  });
});
