// D17 fix (4차 reviewer simplifier): unused SubagentStatus import removed
import { invokeSubagent, type AgentTool, type SubagentTask } from './invoke.js';
import { DEFAULT_CONFIG, loadConfig, type SpecrailConfig } from '../config/index.js';

/**
 * SpecReview prompt template (C6 / analyst ambiguity #6 resolved).
 *
 * Pass criteria (subagent에 명시):
 * 1. 모든 인용된 AC ID가 실 implementation에서 verifiable (test가 그 AC 검증)
 * 2. 모든 인용된 INV ID가 실 코드에서 enforce (throw 또는 hook block)
 * 3. Phase 4 ENT type names matching implementation type/interface names
 * 4. frontmatter `refs` field와 실 코드 import/reference 일치
 */
export const SPEC_REVIEW_PROMPT = (taskPrompt: string): string =>
  [
    `Spec compliance review of:`,
    taskPrompt,
    ``,
    `Verify (ALL 4 must pass):`,
    `1. AC IDs cited in spec are each verifiable by a test (look for "AC-R*" in test names/comments)`,
    `2. INV IDs in spec are enforced in code (look for "INV-" runtime throw or hook block)`,
    `3. Phase 4 ENT type names match implementation enums/interfaces (e.g. PhaseStatus, SpecTier, ConsentStatus)`,
    `4. frontmatter refs field in new docs/spec matches actual ID citations`,
    ``,
    `Return status "Passed" with matched evidence if all 4 pass.`,
    `Return status "Blocked" with output starting "BLOCKED: <which check failed + why>" otherwise.`,
  ].join('\n');

/**
 * QualityReview prompt template (C6).
 *
 * Default checklist is the default TypeScript 5-criteria set. For other languages,
 * use buildQualityReviewPrompt() with a custom checklist (loaded from
 * .specrail.config.json via src/config/index.ts).
 *
 * Backward compatible: signature unchanged, output identical when checklist
 * is omitted.
 */
export const QUALITY_REVIEW_PROMPT = (taskPrompt: string): string =>
  buildQualityReviewPrompt(taskPrompt, DEFAULT_CONFIG.qualityChecklist);

/**
 * Build a QualityReview prompt with an arbitrary checklist.
 * Each checklist item becomes a numbered line in the prompt body.
 */
export function buildQualityReviewPrompt(
  taskPrompt: string,
  checklist: readonly string[],
): string {
  const n = checklist.length;
  const lines = [`Code quality review of:`, taskPrompt, ``];
  if (n === 0) {
    lines.push(`No quality checks configured. Return "Passed".`);
    return lines.join('\n');
  }
  lines.push(`Verify (ALL ${n} must pass):`);
  for (let i = 0; i < n; i++) {
    lines.push(`${i + 1}. ${checklist[i]}`);
  }
  lines.push(``);
  lines.push(`Return "Passed" with brief summary if all ${n} pass.`);
  lines.push(`Return "Blocked" with "BLOCKED: <which check + line ref>" otherwise.`);
  return lines.join('\n');
}

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

export interface RunWithReviewOptions {
  /** Resolved config — when omitted, DEFAULT_CONFIG (TS preset) is used. */
  readonly config?: SpecrailConfig;
}

export async function runWithReview(
  agent: AgentTool,
  task: SubagentTask,
  options: RunWithReviewOptions = {},
): Promise<ReviewResult> {
  const config = options.config ?? DEFAULT_CONFIG;
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

  // Stage 2 — SpecReview (C6: 4-criteria prompt template, language-neutral)
  const specTask: SubagentTask = {
    ...task,
    prompt: SPEC_REVIEW_PROMPT(task.prompt),
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

  // Stage 3 — QualityReview (config-driven checklist)
  const qualTask: SubagentTask = {
    ...task,
    prompt: buildQualityReviewPrompt(task.prompt, config.qualityChecklist),
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
