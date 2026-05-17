export type SubagentStage = 'Implementation' | 'SpecReview' | 'QualityReview';
export type SubagentStatus = 'Running' | 'Passed' | 'Blocked' | 'Failed';

export interface SubagentTask {
  taskId: string;
  prompt: string;
  stage: SubagentStage;
}

export interface SubagentResult {
  status: SubagentStatus;
  output: string;
  escalationReason?: string;
}

export type AgentTool = (input: { prompt: string }) => Promise<{ status: string; output: string }>;

export async function invokeSubagent(agent: AgentTool, task: SubagentTask): Promise<SubagentResult> {
  const composedPrompt = `[${task.stage} for ${task.taskId}]\n${task.prompt}`;
  const r = await agent({ prompt: composedPrompt });

  // Convention: subagent indicates BLOCKED via output prefix `BLOCKED:` (or `BLOCKED ...`).
  // This overrides r.status — even Passed result with BLOCKED-prefixed output is treated as BLOCKED.
  // To indicate something else but include literal "BLOCKED" in output, prefix with whitespace or ZWSP.
  if (r.status === 'Blocked' || r.output.startsWith('BLOCKED')) {
    const firstLine = r.output.split('\n')[0];
    const escalationReason = firstLine.replace(/^BLOCKED:?\s*/, '');
    return { status: 'Blocked', output: r.output, escalationReason };
  }

  if (r.status === 'Failed') {
    return { status: 'Failed', output: r.output };
  }

  return { status: 'Passed', output: r.output };
}
