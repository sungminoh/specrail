import { describe, it, expect, vi } from 'vitest';
import { dispatchTaskWithReview, dispatchWithRetry, type DispatchResult } from '../src/subagent/dispatch.js';
import type { AgentTool, SubagentTask } from '../src/subagent/invoke.js';
import type { EscalationDecision } from '../src/subagent/escalate.js';

type AgentInput = { prompt: string };
type AgentOutput = { status: string; output: string };

const baseTask: SubagentTask = { taskId: 'T5.6', prompt: 'implement feature X', stage: 'Implementation' };

function makeAgent(responses: Array<{ status: string; output: string }>): AgentTool {
  let callCount = 0;
  return vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
    const r = responses[callCount] ?? { status: 'Passed', output: 'default ok' };
    callCount++;
    return r;
  }) as AgentTool;
}

describe('US-T5.6 dispatchTaskWithReview', () => {
  it('all 3 stages Passed → action=continue, auditTrail has 3 entries', async () => {
    const agent = makeAgent([
      { status: 'Passed', output: 'impl done' },
      { status: 'Passed', output: 'spec ok' },
      { status: 'Passed', output: 'quality ok' },
    ]);

    const result: DispatchResult = await dispatchTaskWithReview(agent, baseTask);

    expect(result.action).toBe('continue');
    expect(result.auditTrail).toHaveLength(3);
    expect(result.auditTrail[0]!.stage).toBe('Implementation');
    expect(result.auditTrail[1]!.stage).toBe('SpecReview');
    expect(result.auditTrail[2]!.stage).toBe('QualityReview');
    expect(result.escalationMessage).toBeUndefined();
  });

  it('Implementation Blocked → action=interrupt, escalationMessage formatted', async () => {
    const agent = makeAgent([
      { status: 'Blocked', output: 'BLOCKED: compile error' },
    ]);

    const result: DispatchResult = await dispatchTaskWithReview(agent, baseTask);

    expect(result.action).toBe('interrupt');
    expect(result.auditTrail).toHaveLength(1);
    expect(result.auditTrail[0]!.stage).toBe('Implementation');
    expect(result.escalationMessage).toBeDefined();
    expect(result.escalationMessage).toContain('BLOCKED');
    expect(result.escalationMessage).toContain('T5.6');
  });

  it('SpecReview Blocked → action=interrupt, audit trail has 2 stages', async () => {
    const agent = makeAgent([
      { status: 'Passed', output: 'impl done' },
      { status: 'Blocked', output: 'BLOCKED: AC-R8-2 not satisfied' },
    ]);

    const result: DispatchResult = await dispatchTaskWithReview(agent, baseTask);

    expect(result.action).toBe('interrupt');
    expect(result.auditTrail).toHaveLength(2);
    expect(result.auditTrail[1]!.stage).toBe('SpecReview');
    expect(result.escalationMessage).toContain('SpecReview');
  });

  it('QualityReview Blocked → action=interrupt, audit trail has 3 stages', async () => {
    const agent = makeAgent([
      { status: 'Passed', output: 'impl done' },
      { status: 'Passed', output: 'spec ok' },
      { status: 'Blocked', output: 'BLOCKED: lint errors on line 42' },
    ]);

    const result: DispatchResult = await dispatchTaskWithReview(agent, baseTask);

    expect(result.action).toBe('interrupt');
    expect(result.auditTrail).toHaveLength(3);
    expect(result.auditTrail[2]!.stage).toBe('QualityReview');
    expect(result.escalationMessage).toContain('QualityReview');
  });

  it('audit trail preserves all 3 stage outputs when all pass', async () => {
    const agent = makeAgent([
      { status: 'Passed', output: 'impl output here' },
      { status: 'Passed', output: 'spec output here' },
      { status: 'Passed', output: 'quality output here' },
    ]);

    const result: DispatchResult = await dispatchTaskWithReview(agent, baseTask);

    expect(result.auditTrail[0]!.output).toBe('impl output here');
    expect(result.auditTrail[1]!.output).toBe('spec output here');
    expect(result.auditTrail[2]!.output).toBe('quality output here');
  });

  it('escalationMessage contains stage, taskId, and reason when SpecReview Blocked', async () => {
    const agent = makeAgent([
      { status: 'Passed', output: 'impl done' },
      { status: 'Blocked', output: 'BLOCKED: missing AC-R9-1 coverage' },
    ]);

    const task: SubagentTask = { taskId: 'T9.1', prompt: 'do something', stage: 'Implementation' };
    const result: DispatchResult = await dispatchTaskWithReview(agent, task);

    expect(result.escalationMessage).toContain('T9.1');
    expect(result.escalationMessage).toContain('SpecReview');
    expect(result.escalationMessage).toContain('Audit Trail');
  });
});

describe('US-T5.6 dispatchWithRetry', () => {
  it('Blocked → decision retry with modifiedPrompt → next attempt passes → action=continue', async () => {
    let callCount = 0;
    const agent = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
      callCount++;
      // First 3 calls (attempt 1): impl blocked
      if (callCount === 1) return { status: 'Blocked', output: 'BLOCKED: needs fix' };
      // Next 3 calls (attempt 2 with modified task): all pass
      return { status: 'Passed', output: `ok call ${callCount}` };
    }) as AgentTool;

    const decider = vi.fn<[string], Promise<EscalationDecision>>().mockResolvedValue({
      decision: 'modify',
      modifiedPrompt: 'use corrected approach',
    });

    const result = await dispatchWithRetry(agent, baseTask, decider, 1);

    expect(result.action).toBe('continue');
    expect(decider).toHaveBeenCalledOnce();
  });

  it('Blocked → decision abort → return interrupt immediately without retry', async () => {
    const agent = makeAgent([
      { status: 'Blocked', output: 'BLOCKED: cannot proceed' },
    ]);

    const decider = vi.fn<[string], Promise<EscalationDecision>>().mockResolvedValue({
      decision: 'abort',
    });

    const result = await dispatchWithRetry(agent, baseTask, decider, 1);

    expect(result.action).toBe('interrupt');
    expect(decider).toHaveBeenCalledOnce();
  });

  it('dispatchTaskWithReview forwards options.config to QualityReview prompt', async () => {
    const seenPrompts: string[] = [];
    const agent: AgentTool = vi.fn(async ({ prompt }: AgentInput) => {
      seenPrompts.push(prompt);
      return { status: 'Passed', output: 'ok' };
    }) as AgentTool;

    const { getPreset } = await import('../src/config/index.js');
    const { dispatchTaskWithReview: dispatchFn } = await import('../src/subagent/dispatch.js');
    const result = await dispatchFn(agent, baseTask, { config: getPreset('python') });

    expect(result.action).toBe('continue');
    // QualityReview is stage 3 — must carry python checklist, not TS default
    const qualityPrompt = seenPrompts[2]!;
    expect(qualityPrompt).toContain('mypy src/');
    expect(qualityPrompt).toContain('pytest tests/');
    expect(qualityPrompt).not.toContain('npm run typecheck');
  });

  it('dispatchWithRetry passes real escalationReason to decideOnEscalation (R2-H3)', async () => {
    const agent = makeAgent([
      { status: 'Blocked', output: 'BLOCKED: CONCRETE REASON FROM REVIEWER' },
    ]);

    const decider = vi.fn<[string], Promise<EscalationDecision>>().mockResolvedValue({
      decision: 'abort',
    });

    await dispatchWithRetry(agent, baseTask, decider, 1);

    expect(decider).toHaveBeenCalled();
    expect(decider.mock.calls[0]![0]).toContain('CONCRETE REASON FROM REVIEWER');
  });
});
