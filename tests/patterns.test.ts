import { describe, it, expect } from 'vitest';
import { CITATION_RE } from '../src/spec/patterns.js';

/**
 * Step 0 regression — compound hyphenated ID substring matching.
 *
 * Background: \b treats `-` as a word boundary, so without an explicit
 * lookbehind, CITATION_RE leaked phantom substring matches out of
 * compound IDs (`ADR-CAND-1` → `CAND-1`, `P-CC-1` → `CC-1`,
 * `NFR-SEC-COMP-1` → `COMP-1`). Step 0 added `\-` to the negative
 * lookbehind so a citation cannot start immediately after a hyphen.
 */
function extractIds(text: string): string[] {
  const re = new RegExp(CITATION_RE.source, CITATION_RE.flags);
  return [...text.matchAll(re)].map((m) => m[1]);
}

describe('CITATION_RE — compound hyphen substring guard (Step 0)', () => {
  it('does not match CAND-1 inside ADR-CAND-1', () => {
    expect(extractIds('ADR-CAND-1')).toEqual([]);
  });

  it('does not match CAND-1 inside prose mention of ADR-CAND-1', () => {
    expect(extractIds('decision ADR-CAND-1 is pending')).toEqual([]);
  });

  it('matches P-CC-1 as a single token (T-CSA.3), no phantom CC-1', () => {
    // T-CSA.3 (2026-05-16): P-CC-N is now a first-class ID family. P-CC-1
    // matches as one token AND the phantom `CC-1` substring is still
    // rejected by the negative lookbehind on `-`.
    expect(extractIds('P-CC-1')).toEqual(['P-CC-1']);
  });

  it('does not match COMP-1 inside NFR-SEC-COMP-1', () => {
    expect(extractIds('NFR-SEC-COMP-1 covers compliance')).toEqual([]);
  });

  it('does not match nested IDs after any hyphen', () => {
    // Generic protection — anything that looks like an ID right after a
    // hyphen should be rejected because it is part of a larger token.
    expect(extractIds('prefix-AC-R1-1 is not a real citation')).toEqual([]);
    expect(extractIds('foo-INV-3-extra')).toEqual([]);
  });
});

describe('CITATION_RE — valid IDs still match (Step 0 non-regression)', () => {
  it('matches Requirement / Feature / Specification IDs', () => {
    expect(extractIds('R1')).toEqual(['R1']);
    expect(extractIds('F1.2')).toEqual(['F1.2']);
    expect(extractIds('S1.2.3')).toEqual(['S1.2.3']);
  });

  it('matches AC, INV, NFR, ENT, ARCH, OPS, ADR, TC, EDGE, RISK, EXT, T', () => {
    expect(extractIds('AC-R1-1')).toEqual(['AC-R1-1']);
    expect(extractIds('INV-3')).toEqual(['INV-3']);
    expect(extractIds('NFR-PERF-1')).toEqual(['NFR-PERF-1']);
    expect(extractIds('ENT-User')).toEqual(['ENT-User']);
    expect(extractIds('ARCH-2')).toEqual(['ARCH-2']);
    expect(extractIds('OPS-5')).toEqual(['OPS-5']);
    expect(extractIds('ADR-1')).toEqual(['ADR-1']);
    expect(extractIds('TC-42')).toEqual(['TC-42']);
    expect(extractIds('EDGE-7')).toEqual(['EDGE-7']);
    expect(extractIds('RISK-2')).toEqual(['RISK-2']);
    expect(extractIds('EXT-3')).toEqual(['EXT-3']);
    expect(extractIds('T1.2')).toEqual(['T1.2']);
  });

  it('matches multiple distinct IDs in one line', () => {
    expect(extractIds('R1 ↔ F1.2 → S1.2.3')).toEqual(['R1', 'F1.2', 'S1.2.3']);
  });

  it('matches IDs at start, middle, end of text', () => {
    expect(extractIds('AC-R1-1 starts')).toEqual(['AC-R1-1']);
    expect(extractIds('refers to AC-R1-1 here')).toEqual(['AC-R1-1']);
    expect(extractIds('ends with AC-R1-1')).toEqual(['AC-R1-1']);
  });

  it('matches IDs preceded by punctuation other than hyphen', () => {
    expect(extractIds('(AC-R1-1)')).toEqual(['AC-R1-1']);
    expect(extractIds('|AC-R1-1|')).toEqual(['AC-R1-1']);
    expect(extractIds('"AC-R1-1"')).toEqual(['AC-R1-1']);
    expect(extractIds(',AC-R1-1,')).toEqual(['AC-R1-1']);
  });
});
