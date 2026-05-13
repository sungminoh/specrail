import type { ReviewResult, StageRecord } from './review.js';
import type { SubagentTask } from './invoke.js';

export type EscalationAction = 'continue' | 'interrupt';
export type UserDecision = 'retry' | 'skip' | 'modify' | 'abort';

export interface Escalation {
  taskId: string;
  stage: string;
  reason: string;
  auditTrail: { stage: string; output: string }[];
}

export interface HandleResult {
  action: EscalationAction;
  escalation?: Escalation;
}

export interface ResultInput {
  taskId: string;
  result: ReviewResult;
}

export interface EscalationDecision {
  decision: UserDecision;
  modifiedPrompt?: string;
}

/** Determine the last blocked stage from the stage records. */
function lastBlockedStage(stages: StageRecord[]): string {
  for (let i = stages.length - 1; i >= 0; i--) {
    const s = stages[i]!;
    if (s.status === 'Blocked' || s.status === 'Failed') return s.stage;
  }
  return stages[stages.length - 1]?.stage ?? 'Unknown';
}

/**
 * Inspect a ReviewResult and decide whether to continue or interrupt.
 * Passed → continue (no escalation).
 * Blocked → interrupt with a fully-populated Escalation envelope.
 */
export function handleResult(input: ResultInput): HandleResult {
  const { taskId, result } = input;

  if (result.status === 'Passed') {
    return { action: 'continue' };
  }

  // Build audit trail from all recorded stages.
  const auditTrail = result.stages.map((s) => ({ stage: s.stage, output: s.output }));

  const stage = lastBlockedStage(result.stages);
  const reason = result.escalationReason ?? 'Blocked without explicit reason';

  const escalation: Escalation = { taskId, stage, reason, auditTrail };
  return { action: 'interrupt', escalation };
}

/**
 * Produce a human-readable (markdown-ish) escalation message for the user.
 * Example:
 *   ⚠️ BLOCKED — task T1.1, stage SpecReview, reason: missing spec
 *   ## Audit Trail
 *   - Implementation: impl ok
 *   - SpecReview: BLOCKED: missing spec
 */
export function formatEscalation(e: Escalation): string {
  const header = `⚠️ BLOCKED — task ${e.taskId}, stage ${e.stage}, reason: ${e.reason}`;
  const trail = e.auditTrail
    .map((a) => `- ${a.stage}: ${a.output}`)
    .join('\n');
  return `${header}\n\n## Audit Trail\n${trail}`;
}

/**
 * Apply a user decision to an escalation.
 * retry   → continue=true, no task change (caller re-runs as-is)
 * skip    → continue=true, no task change (caller skips this task)
 * modify  → continue=true, modifiedTask with new prompt
 * abort   → continue=false (caller stops the pipeline)
 */
export function applyDecision(
  e: Escalation,
  d: EscalationDecision,
): { continue: boolean; modifiedTask?: SubagentTask } {
  switch (d.decision) {
    case 'retry':
    case 'skip':
      return { continue: true };
    case 'modify': {
      const modifiedTask: SubagentTask = {
        taskId: e.taskId,
        prompt: d.modifiedPrompt ?? '',
        stage: e.stage as SubagentTask['stage'],
      };
      return { continue: true, modifiedTask };
    }
    case 'abort':
      return { continue: false };
  }
}
