import { describe, it, expect } from 'vitest';
import { parseSpecId, formatSpecId, isSpecId, SpecTier } from '../src/spec/id.js';

describe('SpecId (Phase 4 type, INV-1, ADR-5)', () => {
  it('parses R1', () => {
    expect(parseSpecId('R1')).toEqual({ tier: SpecTier.Requirement, parts: [1] });
  });

  it('parses F1.2', () => {
    expect(parseSpecId('F1.2')).toEqual({ tier: SpecTier.Feature, parts: [1, 2] });
  });

  it('parses S1.2.3', () => {
    expect(parseSpecId('S1.2.3')).toEqual({
      tier: SpecTier.Specification,
      parts: [1, 2, 3],
    });
  });

  it('format round-trip preserves identity', () => {
    for (const id of ['R1', 'F1.2', 'S1.2.3', 'R99', 'F12.34', 'S100.200.300']) {
      expect(formatSpecId(parseSpecId(id))).toBe(id);
    }
  });

  it('rejects invalid prefix (X1)', () => {
    expect(() => parseSpecId('X1')).toThrow(/INV-1/);
  });

  it('rejects R with too many parts', () => {
    expect(() => parseSpecId('R1.2')).toThrow(/R requires 1 parts/);
  });

  it('rejects F with too few parts', () => {
    expect(() => parseSpecId('F1')).toThrow(/F requires 2 parts/);
  });

  it('rejects S with too few parts', () => {
    expect(() => parseSpecId('S1.2')).toThrow(/S requires 3 parts/);
  });

  it('rejects zero parts (R0)', () => {
    expect(() => parseSpecId('R0')).toThrow(/positive integers/);
  });

  it('isSpecId returns true for valid', () => {
    expect(isSpecId('R1')).toBe(true);
    expect(isSpecId('F1.2')).toBe(true);
  });

  it('isSpecId returns false for invalid', () => {
    expect(isSpecId('X1')).toBe(false);
    expect(isSpecId('R')).toBe(false);
    expect(isSpecId('')).toBe(false);
  });
});
