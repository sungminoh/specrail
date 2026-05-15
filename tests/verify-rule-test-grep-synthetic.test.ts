import { describe, it, expect } from 'vitest';
import { testGrepRule } from '../src/verify/id-rules/test-grep.js';
import type { VerifyContext } from '../src/verify/runner.js';
import type { IntentState } from '../src/verify/types.js';

/**
 * Test-grep synthetic-ctx coverage.
 *
 * The integration tests (verify-rule-test-grep.test.ts) all use
 * `skipTests: true`, which means vitest never actually runs — the rule
 * always sees `ctx.vitest.ran === false` and falls into the
 * ManualReview-Stale branch. The Built / Partial / ManualReview branches
 * stayed untested for the entire US-V04 lifetime.
 *
 * This file injects synthetic VerifyContext objects directly into the
 * rule so every decision-table branch is exercised. The synthetic ctx
 * mirrors the shape produced by runner.ts.
 */

interface SyntheticArgs {
  readonly testFileIds?: ReadonlyMap<string, ReadonlySet<string>>;
  readonly vitest?: VerifyContext['vitest'];
  readonly intent?: IntentState;
}

function makeCtx({ testFileIds, vitest, intent = 'Approved' }: SyntheticArgs): VerifyContext {
  return {
    projectRoot: '/tmp/synthetic',
    options: {},
    vitest: vitest ?? { ran: false, outcomes: new Map(), note: 'skipTests' },
    testFileIds: testFileIds ?? new Map(),
    locations: new Map(),
    intents: new Map([['AC-R1-1', intent]]),
  };
}

describe('test-grep rule — synthetic-ctx branch coverage', () => {
  it('Built — at least one referencing test file is all green', async () => {
    const ctx = makeCtx({
      testFileIds: new Map([['AC-R1-1', new Set(['tests/a.test.ts'])]]),
      vitest: {
        ran: true,
        outcomes: new Map([
          [
            'tests/a.test.ts',
            { file: 'tests/a.test.ts', allGreen: true, failed: 0, passed: 3, skipped: 0 },
          ],
        ]),
      },
    });

    const ev = await testGrepRule.apply({ id: 'AC-R1-1', idType: 'AC', ctx });
    expect(ev.reality).toBe('Built');
    expect(ev.evidence.some((e) => e.kind === 'test-pass')).toBe(true);
    expect(ev.confidence).toBe('high');
    expect(ev.intent).toBe('Approved');
  });

  it('Partial — referencing test file exists but its tests failed', async () => {
    const ctx = makeCtx({
      testFileIds: new Map([['AC-R1-1', new Set(['tests/a.test.ts'])]]),
      vitest: {
        ran: true,
        outcomes: new Map([
          [
            'tests/a.test.ts',
            { file: 'tests/a.test.ts', allGreen: false, failed: 1, passed: 2, skipped: 0 },
          ],
        ]),
      },
    });

    const ev = await testGrepRule.apply({ id: 'AC-R1-1', idType: 'AC', ctx });
    expect(ev.reality).toBe('Partial');
    expect(ev.evidence.some((e) => e.kind === 'test-fail')).toBe(true);
  });

  it('Built — mixed green+failing refs still resolve Built when ANY ref is fully green', async () => {
    const ctx = makeCtx({
      testFileIds: new Map([
        ['AC-R1-1', new Set(['tests/green.test.ts', 'tests/red.test.ts'])],
      ]),
      vitest: {
        ran: true,
        outcomes: new Map([
          [
            'tests/green.test.ts',
            { file: 'tests/green.test.ts', allGreen: true, failed: 0, passed: 1, skipped: 0 },
          ],
          [
            'tests/red.test.ts',
            { file: 'tests/red.test.ts', allGreen: false, failed: 1, passed: 0, skipped: 0 },
          ],
        ]),
      },
    });

    const ev = await testGrepRule.apply({ id: 'AC-R1-1', idType: 'AC', ctx });
    expect(ev.reality).toBe('Built');
  });

  it('NotBuilt — no test file references this ID', async () => {
    const ctx = makeCtx({
      testFileIds: new Map(),
      vitest: { ran: true, outcomes: new Map() },
    });

    const ev = await testGrepRule.apply({ id: 'AC-R1-1', idType: 'AC', ctx });
    expect(ev.reality).toBe('NotBuilt');
    expect(ev.evidence[0]?.kind).toBe('no-test-ref');
  });

  it('ManualReview-Stale — vitest did not run (skipTests path)', async () => {
    const ctx = makeCtx({
      testFileIds: new Map([['AC-R1-1', new Set(['tests/a.test.ts'])]]),
      vitest: { ran: false, outcomes: new Map(), note: 'skipTests' },
    });

    const ev = await testGrepRule.apply({ id: 'AC-R1-1', idType: 'AC', ctx });
    expect(ev.reality).toBe('ManualReview-Stale');
    expect(ev.evidence[0]?.kind).toBe('test-ref-no-run');
  });

  it('ManualReview — vitest ran but provided no outcome for the referencing test file (e.g. file was .skipped)', async () => {
    const ctx = makeCtx({
      testFileIds: new Map([['AC-R1-1', new Set(['tests/orphan.test.ts'])]]),
      vitest: {
        ran: true,
        outcomes: new Map([
          [
            'tests/different.test.ts',
            { file: 'tests/different.test.ts', allGreen: true, failed: 0, passed: 1, skipped: 0 },
          ],
        ]),
      },
    });

    const ev = await testGrepRule.apply({ id: 'AC-R1-1', idType: 'AC', ctx });
    expect(ev.reality).toBe('ManualReview');
    expect(ev.evidence[0]?.kind).toBe('test-ref-no-outcome');
  });

  it('Intent propagates from the synthetic IntentIndex (Draft → not a lie)', async () => {
    const ctx = makeCtx({
      testFileIds: new Map(),
      vitest: { ran: true, outcomes: new Map() },
      intent: 'Draft',
    });

    const ev = await testGrepRule.apply({ id: 'AC-R1-1', idType: 'AC', ctx });
    expect(ev.reality).toBe('NotBuilt');
    expect(ev.intent).toBe('Draft');
  });
});
