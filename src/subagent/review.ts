import { invokeSubagent, type AgentTool, type SubagentTask, type SubagentStatus } from './invoke.js';

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
 * Pass criteria:
 * 1. TypeScript strict — 0 errors (npm run typecheck)
 * 2. All new tests PASS (npx vitest run)
 * 3. Naming consistency with Phase 4 glossary
 * 4. No TODO/FIXME/placeholder comments
 * 5. ESM `.js` import suffix
 */
export const QUALITY_REVIEW_PROMPT = (taskPrompt: string): string =>
  [
    `Code quality review of:`,
    taskPrompt,
    ``,
    `Verify (ALL 5 must pass):`,
    `1. typecheck: npm run typecheck → 0 errors`,
    `2. tests: npx vitest run [new test files] → all green`,
    `3. naming consistency with Phase 4 glossary (enum 값 일치)`,
    `4. no TODO/FIXME/placeholder comments`,
    `5. ESM .js suffix on imports`,
    ``,
    `Return "Passed" with brief summary if all 5 pass.`,
    `Return "Blocked" with "BLOCKED: <which check + line ref>" otherwise.`,
  ].join('\n');

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

  // Stage 2 — SpecReview (C6: 4-criteria prompt template)
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

  // Stage 3 — QualityReview (C6: 5-criteria prompt template)
  const qualTask: SubagentTask = {
    ...task,
    prompt: QUALITY_REVIEW_PROMPT(task.prompt),
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
