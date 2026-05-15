// TC-62: EDGE-23 subagent timeout escalation AC-R8-3
import { describe, it, expect, vi } from 'vitest';
import { invokeSubagent, type AgentTool, type SubagentTask } from '../src/subagent/invoke.js';

type AgentInput = { prompt: string };
type AgentOutput = { status: string; output: string };

describe('T3.4 Subagent wrapper (F8.1·8.2, AC-R8-1, TC-18, ADR-6, TC-62, EDGE-23)', () => {
  it('invokes Agent tool with task spec and returns Passed', async () => {
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockResolvedValue({ status: 'Passed', output: 'done' });
    const task: SubagentTask = {
      taskId: 'T1.1',
      prompt: 'Implement parseSpecId',
      stage: 'Implementation',
    };
    const r = await invokeSubagent(mock as AgentTool, task);
    expect(mock).toHaveBeenCalledOnce();
    expect(r.status).toBe('Passed');
    expect(r.output).toBe('done');
  });

  it('returns Blocked when output starts with "BLOCKED:"', async () => {
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockResolvedValue({
      status: 'Passed',
      output: 'BLOCKED: missing schema definition',
    });
    const task: SubagentTask = {
      taskId: 'T2.3',
      prompt: 'Validate schema output',
      stage: 'SpecReview',
    };
    const r = await invokeSubagent(mock as AgentTool, task);
    expect(r.status).toBe('Blocked');
    expect(r.escalationReason).toContain('missing schema definition');
  });

  it('returns Failed when agent status is Failed', async () => {
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockResolvedValue({
      status: 'Failed',
      output: 'compilation error on line 42',
    });
    const task: SubagentTask = {
      taskId: 'T3.1',
      prompt: 'Run type checks',
      stage: 'QualityReview',
    };
    const r = await invokeSubagent(mock as AgentTool, task);
    expect(r.status).toBe('Failed');
    expect(r.output).toBe('compilation error on line 42');
  });

  it('composes prompt with stage prefix', async () => {
    let capturedPrompt = '';
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async (input: AgentInput) => {
      capturedPrompt = input.prompt;
      return { status: 'Passed', output: 'ok' };
    });
    const task: SubagentTask = {
      taskId: 'T1.1',
      prompt: 'Implement parseSpecId',
      stage: 'Implementation',
    };
    await invokeSubagent(mock as AgentTool, task);
    expect(capturedPrompt).toBe('[Implementation for T1.1]\nImplement parseSpecId');
  });

  it('SpecReview stage composes correct prefix', async () => {
    let capturedPrompt = '';
    const mock = vi.fn<[AgentInput], Promise<AgentOutput>>().mockImplementation(async (input: AgentInput) => {
      capturedPrompt = input.prompt;
      return { status: 'Passed', output: 'reviewed' };
    });
    const task: SubagentTask = {
      taskId: 'T4.2',
      prompt: 'Review spec completeness',
      stage: 'SpecReview',
    };
    const r = await invokeSubagent(mock as AgentTool, task);
    expect(capturedPrompt).toBe('[SpecReview for T4.2]\nReview spec completeness');
    expect(r.status).toBe('Passed');
    expect(r.output).toBe('reviewed');
  });
});
