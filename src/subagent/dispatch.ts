// US-T5.6 — Review dispatch automation (M5 wire-up)
// Phase 13 atomic task 완료 후 자동 invoke pattern.
// runWithReview → handleResult → continue/interrupt.

import { runWithReview, type ReviewResult } from './review.js';
import { handleResult, formatEscalation, type EscalationDecision, applyDecision } from './escalate.js';
import type { AgentTool, SubagentTask } from './invoke.js';

export interface DispatchResult {
  action: 'continue' | 'interrupt';
  reviewResult: ReviewResult;
  auditTrail: { stage: string; status: string; output: string }[];
  escalationMessage?: string;
}

export async function dispatchTaskWithReview(
  agent: AgentTool,
  task: SubagentTask,
): Promise<DispatchResult> {
  const reviewResult = await runWithReview(agent, task);
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
): Promise<DispatchResult> {
  let attempt = 0;
  let currentTask = task;
  let result: DispatchResult;

  while (true) {
    result = await dispatchTaskWithReview(agent, currentTask);
    if (result.action === 'continue') return result;
    if (attempt >= maxRetries) return result;

    // Escalation — ask user decision
    const decision = await decideOnEscalation(result.escalationMessage ?? 'Blocked');
    const handle = handleResult({ taskId: currentTask.taskId, result: result.reviewResult });
    if (handle.action !== 'interrupt' || !handle.escalation) return result;
    const applied = applyDecision(handle.escalation, decision);
    if (!applied.continue || !applied.modifiedTask) return result;
    currentTask = applied.modifiedTask;
    attempt++;
  }
}
