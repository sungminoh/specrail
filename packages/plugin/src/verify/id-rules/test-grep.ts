/**
 * Test-grep rule — shared classification for IDs whose evidence is
 * "a test file mentions this ID and that file's tests all pass".
 *
 * Applies to AC-R{n}-{m}, TC-{n}, INV-{n}, EDGE-{n} (and NFR domains
 * that piggy-back on the same convention — wired separately in NFR rule).
 *
 * Decision table:
 *   - No test file references the ID                    → NotBuilt
 *   - At least one referencing file has all tests green → Built
 *   - All referencing files have failing tests          → Partial
 *   - vitest did NOT run (skipTests or invocation fail) → ManualReview-Stale
 *                                                          (we have grep but
 *                                                          no pass/fail signal)
 */

import type { IdRule } from '../runner.js';
import type { EvidenceItem, IdEvidence } from '../types.js';

export const testGrepRule: IdRule = {
  id: 'test-grep',
  async apply({ id, idType, ctx }) {
    const testFiles = ctx.testFileIds.get(id);
    const refs = testFiles ? [...testFiles] : [];

    if (refs.length === 0) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'NotBuilt',
        evidence: [{ kind: 'no-test-ref' }],
        confidence: 'high',
        rule: 'test-grep',
      };
    }

    if (!ctx.vitest.ran) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'ManualReview-Stale',
        evidence: refs.map(
          (f): EvidenceItem => ({ kind: 'test-ref-no-run', path: f }),
        ),
        confidence: 'low',
        rule: 'test-grep',
      };
    }

    const greenRefs: string[] = [];
    const failingRefs: string[] = [];
    for (const f of refs) {
      const outcome = ctx.vitest.outcomes.get(f);
      if (!outcome) {
        // Test file referenced ID but vitest didn't list it — likely a
        // file vitest excluded (e.g. .skip). Treat as "no signal".
        continue;
      }
      if (outcome.allGreen) greenRefs.push(f);
      else if (outcome.failed > 0) failingRefs.push(f);
    }

    const evidence: EvidenceItem[] = [];
    for (const f of greenRefs)
      evidence.push({ kind: 'test-pass', path: f });
    for (const f of failingRefs)
      evidence.push({ kind: 'test-fail', path: f });

    if (greenRefs.length > 0) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'Built',
        evidence,
        confidence: 'high',
        rule: 'test-grep',
      };
    }
    if (failingRefs.length > 0) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'Partial',
        evidence,
        confidence: 'high',
        rule: 'test-grep',
      };
    }
    // Refs exist but vitest provided no outcome for any of them.
    const unmatched: IdEvidence = {
      id,
      idType,
      intent: ctx.intents.get(id) ?? 'Draft',
      reality: 'ManualReview',
      evidence: refs.map(
        (f): EvidenceItem => ({ kind: 'test-ref-no-outcome', path: f }),
      ),
      confidence: 'low',
      rule: 'test-grep',
    };
    return unmatched;
  },
};
