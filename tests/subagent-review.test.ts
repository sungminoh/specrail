import { describe, it, expect, vi } from 'vitest';
import { runWithReview, type ReviewResult } from '../src/subagent/review.js';
import type { AgentTool, SubagentTask } from '../src/subagent/invoke.js';

type AgentInput = { prompt: string };
type AgentOutput = { status: string; output: string };

describe('T3.5 2-stage review chain (F8.3, AC-R8-2, TC-19)', () => {
  it('passes when all 3 stages pass', async () => {
    let callCount = 0;
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
      callCount++;
      return { status: 'Passed', output: `stage ${callCount} done` };
    });

    const task: SubagentTask = { taskId: 'T1.1', prompt: 'do thing', stage: 'Implementation' };
    const r: ReviewResult = await runWithReview(mock as AgentTool, task);

    expect(callCount).toBe(3);
    expect(r.status).toBe('Passed');
    expect(r.stages).toHaveLength(3);
    expect(r.stages[0]!.stage).toBe('Implementation');
    expect(r.stages[1]!.stage).toBe('SpecReview');
    expect(r.stages[2]!.stage).toBe('QualityReview');
  });

  it('SpecReview fails → Blocked, QualityReview NOT called', async () => {
    let callCount = 0;
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
      callCount++;
      // Stage 1 passes, stage 2 (SpecReview) fails
      if (callCount === 2) return { status: 'Failed', output: 'spec mismatch' };
      return { status: 'Passed', output: `stage ${callCount} done` };
    });

    const task: SubagentTask = { taskId: 'T1.2', prompt: 'do thing', stage: 'Implementation' };
    const r: ReviewResult = await runWithReview(mock as AgentTool, task);

    expect(callCount).toBe(2);
    expect(r.status).toBe('Blocked');
    expect(r.stages).toHaveLength(2);
    expect(r.stages[1]!.stage).toBe('SpecReview');
    expect(r.escalationReason).toBeDefined();
  });

  it('QualityReview fails → Blocked, after SpecReview passed', async () => {
    let callCount = 0;
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
      callCount++;
      // Stage 3 (QualityReview) fails
      if (callCount === 3) return { status: 'Failed', output: 'lint errors found' };
      return { status: 'Passed', output: `stage ${callCount} done` };
    });

    const task: SubagentTask = { taskId: 'T1.3', prompt: 'do thing', stage: 'Implementation' };
    const r: ReviewResult = await runWithReview(mock as AgentTool, task);

    expect(callCount).toBe(3);
    expect(r.status).toBe('Blocked');
    expect(r.stages).toHaveLength(3);
    expect(r.stages[2]!.stage).toBe('QualityReview');
    expect(r.escalationReason).toBeDefined();
  });

  it('Implementation fails → SpecReview and QualityReview not called', async () => {
    let callCount = 0;
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
      callCount++;
      return { status: 'Failed', output: 'compilation error' };
    });

    const task: SubagentTask = { taskId: 'T1.4', prompt: 'do thing', stage: 'Implementation' };
    const r: ReviewResult = await runWithReview(mock as AgentTool, task);

    expect(callCount).toBe(1);
    expect(r.status).toBe('Blocked');
    expect(r.stages).toHaveLength(1);
    expect(r.stages[0]!.stage).toBe('Implementation');
  });

  it('preserves output per stage as audit trail', async () => {
    const outputs = ['impl output', 'spec output', 'quality output'];
    let callCount = 0;
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
      const output = outputs[callCount]!;
      callCount++;
      return { status: 'Passed', output };
    });

    const task: SubagentTask = { taskId: 'T1.5', prompt: 'do thing', stage: 'Implementation' };
    const r: ReviewResult = await runWithReview(mock as AgentTool, task);

    expect(r.stages[0]!.output).toBe('impl output');
    expect(r.stages[1]!.output).toBe('spec output');
    expect(r.stages[2]!.output).toBe('quality output');
  });

  it('Blocked output from SpecReview is treated as failure', async () => {
    let callCount = 0;
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async () => {
      callCount++;
      if (callCount === 2) return { status: 'Passed', output: 'BLOCKED: AC-R8-2 not satisfied' };
      return { status: 'Passed', output: `stage ${callCount} done` };
    });

    const task: SubagentTask = { taskId: 'T1.6', prompt: 'do thing', stage: 'Implementation' };
    const r: ReviewResult = await runWithReview(mock as AgentTool, task);

    expect(callCount).toBe(2);
    expect(r.status).toBe('Blocked');
    expect(r.escalationReason).toContain('AC-R8-2 not satisfied');
  });
});
