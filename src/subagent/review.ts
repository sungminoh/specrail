import { invokeSubagent, type AgentTool, type SubagentTask, type SubagentStatus } from './invoke.js';

export interface StageRecord {
  stage: string;
  status: string;
  output: string;
}

export interface ReviewResult {
  status: 'Passed' | 'Blocked';
  stages: StageRecord[];
  escalationReason?: string;
}

export async function runWithReview(agent: AgentTool, task: SubagentTask): Promise<ReviewResult> {
  const stages: StageRecord[] = [];

  // Stage 1 — Implementation
  const implResult = await invokeSubagent(agent, { ...task, stage: 'Implementation' });
  stages.push({ stage: 'Implementation', status: implResult.status, output: implResult.output });

  if (implResult.status !== 'Passed') {
    return {
      status: 'Blocked',
      stages,
      escalationReason: implResult.escalationReason ?? `Implementation ${implResult.status}: ${implResult.output}`,
    };
  }

  // Stage 2 — SpecReview
  const specTask: SubagentTask = {
    ...task,
    prompt: `Spec compliance review of: ${task.prompt}\n\nCheck: AC·INV·spec references match implementation.`,
    stage: 'SpecReview',
  };
  const specResult = await invokeSubagent(agent, specTask);
  stages.push({ stage: 'SpecReview', status: specResult.status, output: specResult.output });

  if (specResult.status !== 'Passed') {
    return {
      status: 'Blocked',
      stages,
      escalationReason: specResult.escalationReason ?? `SpecReview ${specResult.status}: ${specResult.output}`,
    };
  }

  // Stage 3 — QualityReview
  const qualTask: SubagentTask = {
    ...task,
    prompt: `Code quality review of: ${task.prompt}\n\nCheck: lint·readability·test coverage.`,
    stage: 'QualityReview',
  };
  const qualResult = await invokeSubagent(agent, qualTask);
  stages.push({ stage: 'QualityReview', status: qualResult.status, output: qualResult.output });

  if (qualResult.status !== 'Passed') {
    return {
      status: 'Blocked',
      stages,
      escalationReason: qualResult.escalationReason ?? `QualityReview ${qualResult.status}: ${qualResult.output}`,
    };
  }

  return { status: 'Passed', stages };
}
