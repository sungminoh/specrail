import { describe, it, expect } from 'vitest';
import { canTransition, assertTransition, PhaseStatus } from '../src/state/machine.js';

describe('Phase state machine (ADR-8, INV-3)', () => {
  it('allows Empty → Draft', () => {
    expect(canTransition(PhaseStatus.Empty, PhaseStatus.Draft)).toBe(true);
  });

  it('blocks Empty → Approved (skill 우회 시도)', () => {
    expect(canTransition(PhaseStatus.Empty, PhaseStatus.Approved)).toBe(false);
  });

  it('allows Draft → Approved (사용자 명시 승인)', () => {
    expect(canTransition(PhaseStatus.Draft, PhaseStatus.Approved)).toBe(true);
  });

  it('allows Approved → Draft (DELTA re-edit)', () => {
    expect(canTransition(PhaseStatus.Approved, PhaseStatus.Draft)).toBe(true);
  });

  it('blocks Approved → Empty (cannot un-init)', () => {
    expect(canTransition(PhaseStatus.Approved, PhaseStatus.Empty)).toBe(false);
  });

  it('assertTransition throws on disallowed', () => {
    expect(() => assertTransition(PhaseStatus.Empty, PhaseStatus.Approved)).toThrow(/INV-3 violation/);
  });

  it('assertTransition no-throw on allowed', () => {
    expect(() => assertTransition(PhaseStatus.Draft, PhaseStatus.Approved)).not.toThrow();
  });
});
