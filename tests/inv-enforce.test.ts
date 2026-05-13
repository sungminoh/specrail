import { describe, it, expect } from 'vitest';
import { checkInv5, checkInv7, checkAllInvariants } from '../src/lint/inv-enforce.js';

describe('INV-5: AC R-tier GIVEN/WHEN/THEN format (3차 verifier 보강)', () => {
  it('passes well-formed AC', () => {
    const text = '- **AC-R1-1:** GIVEN x WHEN y THEN z.';
    expect(checkInv5(text)).toEqual([]);
  });

  it('detects AC missing GIVEN/WHEN/THEN', () => {
    const text = '- **AC-R1-2:** x is verified by y.';
    const v = checkInv5(text, 'spec.md');
    expect(v.length).toBe(1);
    expect(v[0].inv).toBe('INV-5');
    expect(v[0].reason).toContain('AC-R1-2');
  });

  it('AC body across multiple lines (lookahead 4 lines)', () => {
    const text = '- **AC-R3-1:** \n  GIVEN user request\n  WHEN /plan-pipeline init\n  THEN docs/spec created';
    expect(checkInv5(text)).toEqual([]);
  });

  it('returns location with filePath:line', () => {
    const text = '\n\n- **AC-R5-1:** missing pattern.';
    const v = checkInv5(text, 'phase-3.md');
    expect(v[0].location).toMatch(/phase-3\.md:3/);
  });
});

describe('INV-7: ADR alternatives ≥ 2 + rejection reasons (3차 verifier 보강)', () => {
  it('passes ADR with 2 alternatives + rejection', () => {
    const text = `## ADR-1: Choose X

### Alternatives Considered

##### 옵션 A (선택됨): X
- 장점: ...

##### 옵션 B (거절됨): Y
- 거절 이유: too slow
`;
    expect(checkInv7(text)).toEqual([]);
  });

  it('detects ADR with single alternative', () => {
    const text = `## ADR-2: Pick Y

### Alternatives Considered

##### 옵션 A (선택됨): Y
`;
    const v = checkInv7(text, 'adr.md');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].inv).toBe('INV-7');
    expect(v[0].reason).toContain('ADR-2');
    expect(v[0].reason).toContain('alternatives');
  });

  it('detects missing rejection reasons', () => {
    const text = `## ADR-3: Topic

### Alternatives

##### 옵션 A: choice
- pros

##### 옵션 B: other
- pros
`;
    const v = checkInv7(text, 'adr.md');
    expect(v.some((x) => x.reason.includes('rejection'))).toBe(true);
  });

  it('handles multiple ADRs', () => {
    const text = `## ADR-1: One
### Alternatives
##### 옵션 A (선택됨): a
##### 옵션 B (거절됨): b 거절 이유: x

## ADR-2: Two
### Alternatives
##### 옵션 A: c
`;
    const v = checkInv7(text);
    expect(v.some((x) => x.reason.includes('ADR-2'))).toBe(true);
    expect(v.some((x) => x.reason.includes('ADR-1'))).toBe(false);
  });
});

describe('checkAllInvariants combines INV-5 and INV-7', () => {
  it('returns violations from both', () => {
    const text = `- **AC-R1-1:** no pattern here

## ADR-1: x
### Alternatives
##### 옵션 A: only one
`;
    const v = checkAllInvariants(text, 'mix.md');
    expect(v.some((x) => x.inv === 'INV-5')).toBe(true);
    expect(v.some((x) => x.inv === 'INV-7')).toBe(true);
  });
});
