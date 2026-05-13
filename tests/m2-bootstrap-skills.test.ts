import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readdir, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrap } from '../src/cli/install.js';
import { ALL_FORCING_QUESTIONS, Q1_DEMAND_REALITY } from '../src/skill/forcing-questions.js';
import { routeQuestions, detectStage } from '../src/skill/smart-routing.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'm2-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('T2.11 install bootstrap (F6.2, AC-R6-2, TC-13)', () => {
  it('creates docs/spec + Phase 1 placeholder', async () => {
    const r = await bootstrap(dir);
    expect(r.created).toBe(true);
    const entries = await readdir(join(dir, 'docs', 'spec'));
    expect(entries).toContain('01-prd.md');
  });

  it('creates .plan-pipeline-cache/state.json', async () => {
    await bootstrap(dir);
    const stats = await stat(join(dir, '.plan-pipeline-cache', 'state.json'));
    expect(stats.isFile()).toBe(true);
  });

  it('returns Phase 1 trigger string', async () => {
    const r = await bootstrap(dir);
    expect(r.phase1Trigger).toBe('/plan-pipeline phase 1');
  });

  it('skips re-init if already initialized', async () => {
    await bootstrap(dir);
    const r2 = await bootstrap(dir);
    expect(r2.created).toBe(false);
    expect(r2.message).toContain('already initialized');
  });
});

describe('T2.8 6 forcing questions (F5.2, AC-R5-1, TC-9)', () => {
  it('exports 6 questions', () => {
    expect(ALL_FORCING_QUESTIONS).toHaveLength(6);
  });

  it('Q1 is demand-reality', () => {
    expect(Q1_DEMAND_REALITY.id).toBe('q1-demand-reality');
    expect(Q1_DEMAND_REALITY.prompt).toContain('진짜 원한다는');
  });

  it('all questions have unique IDs', () => {
    const ids = ALL_FORCING_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(6);
  });
});

describe('T2.9 Smart Routing (AC-R5-1)', () => {
  it('pre-product → Q1·Q2·Q3', () => {
    const r = routeQuestions({ stage: 'pre-product' });
    expect(r.map((q) => q.id)).toEqual([
      'q1-demand-reality',
      'q2-status-quo',
      'q3-desperate-specificity',
    ]);
  });

  it('has-users → Q2·Q4·Q5', () => {
    const r = routeQuestions({ stage: 'has-users' });
    expect(r.map((q) => q.id)).toEqual([
      'q2-status-quo',
      'q4-narrowest-wedge',
      'q5-observation',
    ]);
  });

  it('has-paying → Q4·Q5·Q6', () => {
    const r = routeQuestions({ stage: 'has-paying' });
    expect(r.map((q) => q.id)).toEqual([
      'q4-narrowest-wedge',
      'q5-observation',
      'q6-future-fit',
    ]);
  });

  it('pure-infra → Q2·Q4 (2 only)', () => {
    const r = routeQuestions({ stage: 'pure-infra' });
    expect(r).toHaveLength(2);
  });

  it('skips already-answered questions', () => {
    const r = routeQuestions({
      stage: 'pre-product',
      answered: ['q1-demand-reality'],
    });
    expect(r.map((q) => q.id)).not.toContain('q1-demand-reality');
    expect(r).toHaveLength(2);
  });

  it('detectStage routes by hints', () => {
    expect(detectStage({ hasPaying: true })).toBe('has-paying');
    expect(detectStage({ hasUsers: true })).toBe('has-users');
    expect(detectStage({ isInfra: true })).toBe('pure-infra');
    expect(detectStage({})).toBe('pre-product');
  });
});
