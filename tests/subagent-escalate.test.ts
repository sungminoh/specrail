import { describe, it, expect } from 'vitest';
import {
  handleResult,
  formatEscalation,
  applyDecision,
  type EscalationAction,
  type EscalationDecision,
  type Escalation,
} from '../src/subagent/escalate.js';
import type { ReviewResult } from '../src/subagent/review.js';

describe('T3.6 BLOCKED escalation (F8.4, AC-R8-3, TC-20·62)', () => {
  it('TC-20: Passed result → action is continue, no escalation', () => {
    const result: ReviewResult = {
      status: 'Passed',
      stages: [
        { stage: 'Implementation', status: 'Passed', output: 'impl ok' },
        { stage: 'SpecReview', status: 'Passed', output: 'spec ok' },
        { stage: 'QualityReview', status: 'Passed', output: 'quality ok' },
      ],
    };
    const action = handleResult({ taskId: 'T1.1', result });
    expect(action.action).toBe('continue');
    expect(action.escalation).toBeUndefined();
  });

  it('TC-62: Blocked result → action is interrupt with escalation envelope', () => {
    const result: ReviewResult = {
      status: 'Blocked',
      stages: [
        { stage: 'Implementation', status: 'Passed', output: 'impl ok' },
        { stage: 'SpecReview', status: 'Blocked', output: 'BLOCKED: missing spec' },
      ],
      escalationReason: 'missing spec',
    };
    const action = handleResult({ taskId: 'T1.2', result });
    expect(action.action).toBe('interrupt');
    expect(action.escalation).toBeDefined();
  });

  it('escalation envelope contains taskId, stage, reason, and audit trail', () => {
    const result: ReviewResult = {
      status: 'Blocked',
      stages: [
        { stage: 'Implementation', status: 'Passed', output: 'impl ok' },
        { stage: 'SpecReview', status: 'Blocked', output: 'BLOCKED: missing spec' },
      ],
      escalationReason: 'missing spec',
    };
    const action = handleResult({ taskId: 'T1.3', result });
    expect(action.escalation).toBeDefined();
    const e = action.escalation!;
    expect(e.taskId).toBe('T1.3');
    expect(e.stage).toBe('SpecReview');
    expect(e.reason).toBe('missing spec');
    expect(e.auditTrail).toHaveLength(2);
    expect(e.auditTrail[0]!.stage).toBe('Implementation');
    expect(e.auditTrail[1]!.stage).toBe('SpecReview');
  });

  it('formatEscalation produces human-readable markdown message', () => {
    const escalation: Escalation = {
      taskId: 'T1.4',
      stage: 'SpecReview',
      reason: 'missing spec',
      auditTrail: [
        { stage: 'Implementation', output: 'impl ok' },
        { stage: 'SpecReview', output: 'BLOCKED: missing spec' },
      ],
    };
    const msg = formatEscalation(escalation);
    expect(msg).toContain('BLOCKED');
    expect(msg).toContain('T1.4');
    expect(msg).toContain('SpecReview');
    expect(msg).toContain('missing spec');
    expect(msg).toContain('Implementation');
  });

  it('queue management: single Blocked task produces interrupt, others unaffected', () => {
    const blockedResult: ReviewResult = {
      status: 'Blocked',
      stages: [{ stage: 'Implementation', status: 'Blocked', output: 'BLOCKED: env not set' }],
      escalationReason: 'env not set',
    };
    const passedResult: ReviewResult = {
      status: 'Passed',
      stages: [{ stage: 'Implementation', status: 'Passed', output: 'ok' }],
    };

    const a1 = handleResult({ taskId: 'T2.1', result: blockedResult });
    const a2 = handleResult({ taskId: 'T2.2', result: passedResult });
    const a3 = handleResult({ taskId: 'T2.3', result: passedResult });

    expect(a1.action).toBe('interrupt');
    expect(a1.escalation!.taskId).toBe('T2.1');
    expect(a2.action).toBe('continue');
    expect(a3.action).toBe('continue');
  });

  it('applyDecision retry → continue true, no modifiedTask', () => {
    const escalation: Escalation = {
      taskId: 'T3.1',
      stage: 'SpecReview',
      reason: 'missing spec',
      auditTrail: [],
    };
    const decision: EscalationDecision = { decision: 'retry' };
    const result = applyDecision(escalation, decision);
    expect(result.continue).toBe(true);
    expect(result.modifiedTask).toBeUndefined();
  });

  it('applyDecision skip → continue true, no modifiedTask', () => {
    const escalation: Escalation = {
      taskId: 'T3.2',
      stage: 'QualityReview',
      reason: 'lint errors',
      auditTrail: [],
    };
    const decision: EscalationDecision = { decision: 'skip' };
    const result = applyDecision(escalation, decision);
    expect(result.continue).toBe(true);
    expect(result.modifiedTask).toBeUndefined();
  });

  it('applyDecision modify → continue true, modifiedTask with new prompt', () => {
    const escalation: Escalation = {
      taskId: 'T3.3',
      stage: 'Implementation',
      reason: 'wrong approach',
      auditTrail: [],
    };
    const decision: EscalationDecision = {
      decision: 'modify',
      modifiedPrompt: 'use a different approach',
    };
    const result = applyDecision(escalation, decision);
    expect(result.continue).toBe(true);
    expect(result.modifiedTask).toBeDefined();
    expect(result.modifiedTask!.taskId).toBe('T3.3');
    expect(result.modifiedTask!.prompt).toBe('use a different approach');
  });

  it('applyDecision abort → continue false', () => {
    const escalation: Escalation = {
      taskId: 'T3.4',
      stage: 'Implementation',
      reason: 'cannot proceed',
      auditTrail: [],
    };
    const decision: EscalationDecision = { decision: 'abort' };
    const result = applyDecision(escalation, decision);
    expect(result.continue).toBe(false);
    expect(result.modifiedTask).toBeUndefined();
  });
});
