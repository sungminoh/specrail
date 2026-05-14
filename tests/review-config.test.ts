// config-driven QualityReview prompt
// Verifies buildQualityReviewPrompt + runWithReview honors config.qualityChecklist.
import { describe, it, expect, vi } from 'vitest';
import {
  QUALITY_REVIEW_PROMPT,
  buildQualityReviewPrompt,
  runWithReview,
} from '../src/subagent/review.js';
import type { AgentTool, SubagentTask } from '../src/subagent/invoke.js';
import { getPreset, DEFAULT_CONFIG } from '../src/config/index.js';

const baseTask: SubagentTask = {
  taskId: 'T-cfg',
  prompt: 'do thing',
  stage: 'Implementation',
};

describe('buildQualityReviewPrompt', () => {
  it('emits one numbered line per checklist item', () => {
    const out = buildQualityReviewPrompt('TASK', ['rule A', 'rule B', 'rule C']);
    expect(out).toContain('Verify (ALL 3 must pass):');
    expect(out).toContain('1. rule A');
    expect(out).toContain('2. rule B');
    expect(out).toContain('3. rule C');
    expect(out).toContain('TASK');
  });

  it('handles empty checklist (no-op review)', () => {
    const out = buildQualityReviewPrompt('TASK', []);
    expect(out).toContain('No quality checks configured');
    expect(out).not.toContain('Verify');
  });

  it('quotes task prompt verbatim', () => {
    const out = buildQualityReviewPrompt('multi\nline\nprompt', ['x']);
    expect(out).toContain('multi\nline\nprompt');
  });
});

describe('QUALITY_REVIEW_PROMPT backward compatibility', () => {
  it('output matches buildQualityReviewPrompt with DEFAULT_CONFIG checklist', () => {
    const a = QUALITY_REVIEW_PROMPT('XYZ');
    const b = buildQualityReviewPrompt('XYZ', DEFAULT_CONFIG.qualityChecklist);
    expect(a).toBe(b);
  });

  it('still contains the original TS-specific lines (no regression)', () => {
    const out = QUALITY_REVIEW_PROMPT('XYZ');
    expect(out).toContain('npm run typecheck');
    expect(out).toContain('npx vitest run');
    expect(out).toContain('ESM .js suffix on imports');
  });
});

describe('runWithReview honors config.qualityChecklist', () => {
  it('injects python preset checklist into QualityReview prompt', async () => {
    const seenPrompts: string[] = [];
    const agent: AgentTool = vi.fn(async ({ prompt }: { prompt: string }) => {
      seenPrompts.push(prompt);
      return { status: 'Passed', output: 'ok' };
    });

    const result = await runWithReview(agent, baseTask, { config: getPreset('python') });
    expect(result.status).toBe('Passed');

    // Stage 3 is the QualityReview call — its prompt must contain python items
    expect(seenPrompts.length).toBe(3);
    const qualityPrompt = seenPrompts[2]!;
    expect(qualityPrompt).toContain('mypy src/');
    expect(qualityPrompt).toContain('pytest tests/');
    expect(qualityPrompt).not.toContain('npm run typecheck');
    expect(qualityPrompt).not.toContain('npx vitest');
  });

  it('uses DEFAULT_CONFIG (typescript) when options.config omitted', async () => {
    const seenPrompts: string[] = [];
    const agent: AgentTool = vi.fn(async ({ prompt }: { prompt: string }) => {
      seenPrompts.push(prompt);
      return { status: 'Passed', output: 'ok' };
    });

    await runWithReview(agent, baseTask);
    const qualityPrompt = seenPrompts[2]!;
    expect(qualityPrompt).toContain('npm run typecheck');
    expect(qualityPrompt).toContain('ESM .js suffix on imports');
  });

  it('extends=none yields empty checklist prompt at QualityReview stage', async () => {
    const seenPrompts: string[] = [];
    const agent: AgentTool = vi.fn(async ({ prompt }: { prompt: string }) => {
      seenPrompts.push(prompt);
      return { status: 'Passed', output: 'ok' };
    });

    await runWithReview(agent, baseTask, { config: getPreset('none') });
    const qualityPrompt = seenPrompts[2]!;
    expect(qualityPrompt).toContain('No quality checks configured');
  });
});
