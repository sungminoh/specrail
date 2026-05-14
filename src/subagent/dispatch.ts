// US-T5.6 — Review dispatch automation (M5 wire-up)
// Phase 13 atomic task 완료 후 자동 invoke pattern.
// runWithReview → handleResult → continue/interrupt.

import { runWithReview, type ReviewResult, type RunWithReviewOptions } from './review.js';
import { handleResult, formatEscalation, type EscalationDecision, applyDecision } from './escalate.js';
import type { AgentTool, SubagentTask } from './invoke.js';

export interface DispatchResult {
  action: 'continue' | 'interrupt';
  reviewResult: ReviewResult;
  auditTrail: { stage: string; status: string; output: string }[];
  escalationMessage?: string;
}

export type DispatchOptions = RunWithReviewOptions;

export async function dispatchTaskWithReview(
  agent: AgentTool,
  task: SubagentTask,
  options: DispatchOptions = {},
): Promise<DispatchResult> {
  const reviewResult = await runWithReview(agent, task, options);
  const handle = handleResult({ taskId: task.taskId, result: reviewResult });

  const dispatch: DispatchResult = {
    action: handle.action,
    reviewResult,
    auditTrail: reviewResult.stages,
  };

  if (handle.action === 'interrupt' && handle.escalation) {
    dispatch.escalationMessage = formatEscalation(handle.escalation);
  }

  return dispatch;
}

export async function dispatchWithRetry(
  agent: AgentTool,
  task: SubagentTask,
  decideOnEscalation: (escalationMessage: string) => Promise<EscalationDecision>,
  maxRetries = 1,
  options: DispatchOptions = {},
): Promise<DispatchResult> {
  let attempt = 0;
  let currentTask = task;
  let result: DispatchResult;

  while (true) {
    result = await dispatchTaskWithReview(agent, currentTask, options);
    if (result.action === 'continue') return result;
    if (attempt >= maxRetries) return result;

    // Escalation — ask user decision
    const reason = result.reviewResult?.escalationReason ?? result.reviewResult?.stages?.slice(-1)[0]?.output ?? result.escalationMessage ?? 'Blocked';
    const decision = await decideOnEscalation(reason);
    const handle = handleResult({ taskId: currentTask.taskId, result: result.reviewResult });
    if (handle.action !== 'interrupt' || !handle.escalation) return result;
    const applied = applyDecision(handle.escalation, decision);
    if (!applied.continue || !applied.modifiedTask) return result;
    currentTask = applied.modifiedTask;
    attempt++;
  }
}
