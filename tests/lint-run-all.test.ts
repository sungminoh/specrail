import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runAllChecks } from '../src/lint/run-all.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'lint-run-all-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeFixture(path: string, content: string): Promise<void> {
  await mkdir(join(dir, path.split('/').slice(0, -1).join('/')), { recursive: true });
  await writeFile(join(dir, path), content, 'utf8');
}

const CLEAN_ADR = `# ADR + Risks

### ADR-1: Test Decision

#### Alternatives Considered

##### 옵션 A (선택됨): Option A
- 장점: Good
- 거절 이유: N/A

##### 옵션 B (거절됨): Option B
- 장점: Alternative
- 거절 이유: Not chosen because Option A is better
`;

const CLEAN_IMPL_PLAN = `# Implementation Plan

## Tasks

### T1: Setup — AC-R1-1, AC-R1-2

AC-R1-1: GIVEN a project WHEN lint runs THEN all checks pass
AC-R1-2: GIVEN a spec WHEN coverage checked THEN result returned
`;

const CLEAN_TEST = `import { describe, it, expect } from 'vitest';

// AC-R1-1 AC-R1-2
describe('sample', () => {
  it('AC-R1-1: passes lint', () => { expect(true).toBe(true); });
  it('AC-R1-2: returns result', () => { expect(true).toBe(true); });
});
`;

describe('lint orchestrator runAllChecks (US-9.6)', () => {
  it('all pass — clean fixtures', async () => {
    await writeFixture('docs/spec/12-adr-risks.md', CLEAN_ADR);
    await writeFixture('docs/spec/13-implementation-plan.md', CLEAN_IMPL_PLAN);
    await writeFixture('tests/sample.test.ts', CLEAN_TEST);

    const result = await runAllChecks(dir);

    expect(result.overall).toBe('PASS');
    for (const r of result.reports) {
      expect(r.status).not.toBe('FAIL');
    }
  });

  it('sycophancy fail — bare ship-ready in docs', async () => {
    await writeFixture('docs/spec/12-adr-risks.md', CLEAN_ADR);
    await writeFixture('docs/spec/13-implementation-plan.md', CLEAN_IMPL_PLAN);
    await writeFixture('tests/sample.test.ts', CLEAN_TEST);
    await writeFixture('docs/README.md', 'This implementation is ship-ready.\n');

    const result = await runAllChecks(dir);

    expect(result.overall).toBe('FAIL');
    const syco = result.reports.find((r) => r.name === 'anti-sycophancy');
    expect(syco).toBeDefined();
    expect(syco!.status).toBe('FAIL');
  });

  it('--strict promotes WARN to FAIL (R2 M6)', async () => {
    const implPlan = `# Implementation Plan

## Tasks

### T1: Setup

AC-R1-1: GIVEN a project WHEN lint runs THEN all checks pass
AC-R1-2: GIVEN a spec WHEN coverage checked THEN result returned
AC-R1-3: GIVEN a file WHEN read THEN content returned
AC-R1-4: GIVEN no file WHEN checked THEN skip gracefully
`;
    const testFile = `import { describe, it, expect } from 'vitest';

// AC-R1-1 AC-R1-2 AC-R1-3
describe('sample', () => {
  it('AC-R1-1: passes', () => { expect(true).toBe(true); });
  it('AC-R1-2: result', () => { expect(true).toBe(true); });
  it('AC-R1-3: content', () => { expect(true).toBe(true); });
});
`;
    await writeFixture('docs/spec/12-adr-risks.md', CLEAN_ADR);
    await writeFixture('docs/spec/13-implementation-plan.md', implPlan);
    await writeFixture('tests/sample.test.ts', testFile);

    // Without --strict: WARN does not fail
    const nonStrict = await runAllChecks(dir, { strict: false });
    const acNonStrict = nonStrict.reports.find((r) => r.name === 'ac-traceability');
    expect(acNonStrict!.status).toBe('WARN');
    expect(nonStrict.overall).toBe('PASS');

    // With --strict: WARN becomes FAIL
    const strict = await runAllChecks(dir, { strict: true });
    expect(strict.overall).toBe('FAIL');
  });

  it('ac-traceability warn at 75% — overall still PASS', async () => {
    const implPlan = `# Implementation Plan

## Tasks

### T1: Setup

AC-R1-1: GIVEN a project WHEN lint runs THEN all checks pass
AC-R1-2: GIVEN a spec WHEN coverage checked THEN result returned
AC-R1-3: GIVEN a file WHEN read THEN content returned
AC-R1-4: GIVEN no file WHEN checked THEN skip gracefully
`;
    const testFile = `import { describe, it, expect } from 'vitest';

// AC-R1-1 AC-R1-2 AC-R1-3
describe('sample', () => {
  it('AC-R1-1: passes', () => { expect(true).toBe(true); });
  it('AC-R1-2: result', () => { expect(true).toBe(true); });
  it('AC-R1-3: content', () => { expect(true).toBe(true); });
});
`;

    await writeFixture('docs/spec/12-adr-risks.md', CLEAN_ADR);
    await writeFixture('docs/spec/13-implementation-plan.md', implPlan);
    await writeFixture('tests/sample.test.ts', testFile);

    const result = await runAllChecks(dir);

    const acReport = result.reports.find((r) => r.name === 'ac-traceability');
    expect(acReport).toBeDefined();
    expect(acReport!.status).toBe('WARN');
    expect(result.overall).toBe('PASS');
  });
});
