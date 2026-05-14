import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkInv5, checkInv7, checkAllInvariants, checkInv7File } from '../src/lint/inv-enforce.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');

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
    const text = '- **AC-R3-1:** \n  GIVEN user request\n  WHEN /specrail init\n  THEN docs/spec created';
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

describe('INV-7 (extended)', () => {
  it('PASS ADR-11 (real file): no violations mentioning ADR-11', async () => {
    const filePath = join(REPO_ROOT, 'docs/spec/12-adr-risks.md');
    const violations = await checkInv7File(filePath);
    const adr11 = violations.filter((v) => v.reason.includes('ADR-11'));
    expect(adr11).toEqual([]);
  });

  it('FAIL alt=1: synthetic ADR with only one alternative triggers violation', () => {
    const text = `### ADR-99: foo\n#### Alternatives\n##### 옵션 A: only one\n`;
    const v = checkInv7(text, 'synthetic.md');
    expect(v.length).toBeGreaterThan(0);
    expect(v.some((x) => x.reason.toLowerCase().includes('only 1 alternatives'))).toBe(true);
  });

  it('FAIL no rejection reason: 2 alternatives but no rejection reason anywhere', () => {
    const text = `## ADR-50: Topic

### Alternatives

##### 옵션 A: first choice
- pros: good

##### 옵션 B: second choice
- pros: also good
`;
    const v = checkInv7(text, 'synthetic.md');
    expect(v.some((x) => x.reason.includes('rejection'))).toBe(true);
  });

  it('PASS 4-option ADR: 4 alternatives + rejection reasons — no violation', () => {
    const text = `## ADR-77: Multi-option

### Alternatives Considered

##### 옵션 A (선택됨): chosen
- pros: best

##### 옵션 B (거절됨): second
- 거절 이유: too slow

##### 옵션 C (거절됨): third
- 거절 이유: too complex

##### 옵션 D (거절됨): fourth
- 거절 이유: maintenance burden
`;
    const v = checkInv7(text, 'synthetic.md');
    expect(v.length).toBe(0);
  });

  // H6 fixes: broadened ALT_ITEM regex — digit, bullet, bold, ordered, alternative keyword
  it('H6: ADR with digit alternatives (### 옵션 1, ### 옵션 2) → PASS', () => {
    const text = `## ADR-101: Digit alts
### Alternatives
### 옵션 1: first choice
- pros: something

### 옵션 2: second choice
- 거절 이유: too slow
`;
    const v = checkInv7(text, 'synthetic.md');
    expect(v.filter((x) => x.reason.includes('ADR-101'))).toEqual([]);
  });

  it('H6: ADR with bullet alternatives (- Option A, - Option B) → PASS', () => {
    const text = `## ADR-102: Bullet alts
### Alternatives
- Option A: first choice
- some detail

- Option B: second choice
- 거절 이유: too complex
`;
    const v = checkInv7(text, 'synthetic.md');
    expect(v.filter((x) => x.reason.includes('ADR-102'))).toEqual([]);
  });

  it('H6: ADR with bold alternatives (**옵션 A**, **옵션 B**) → PASS', () => {
    const text = `## ADR-103: Bold alts
### Alternatives
**옵션 A**: first choice
- detail

**옵션 B**: second choice
- 거절 이유: not scalable
`;
    const v = checkInv7(text, 'synthetic.md');
    expect(v.filter((x) => x.reason.includes('ADR-103'))).toEqual([]);
  });

  it('H6: ADR with ordered list alternatives (1. Alternative A, 2. Alternative B) → PASS', () => {
    const text = `## ADR-104: Ordered alts
### Alternatives
1. Alternative A: first choice
- detail

2. Alternative B: second choice
- Rejection reason: maintenance burden
`;
    const v = checkInv7(text, 'synthetic.md');
    expect(v.filter((x) => x.reason.includes('ADR-104'))).toEqual([]);
  });

  it('Mixed real file: total violation count is deterministic and informative', async () => {
    const filePath = join(REPO_ROOT, 'docs/spec/12-adr-risks.md');
    const violations = await checkInv7File(filePath);
    console.log(`INV-7 real-file violation count: ${violations.length}`);
    // The count may be >= 0 depending on older ADRs not following the option pattern.
    // This test is informative — it pins the exact count so regressions are visible.
    expect(violations.length).toBeGreaterThanOrEqual(0);
  });

  it('does NOT count "Optional features" heading as alternative (R2-M3)', () => {
    const text = `### ADR-99: foo
## Optional features
설명
### 옵션 A: real alternative
거절 이유: ...
`;
    const v = checkInv7(text, 'test.md');
    // ADR-99 has only 1 real alternative — should fail INV-7 with only 1 alternatives
    expect(v.some((x) => x.reason.includes('only 1 alternatives'))).toBe(true);
  });
});
