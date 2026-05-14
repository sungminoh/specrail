// C2 /plan-pipeline status command — analyst ambiguity #6 resolved
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { status } from '../src/cli/status.js';
import { bootstrap } from '../src/cli/install.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'status-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('C2 /plan-pipeline status command', () => {
  it('빈 프로젝트 (docs/spec 없음) → initialized: false', async () => {
    const s = await status(dir);
    expect(s.initialized).toBe(false);
    expect(s.phases).toHaveLength(0);
    expect(s.phasesApproved).toBe(0);
    expect(s.currentPhase).toBeNull();
    expect(s.totalIds).toBe(0);
    expect(s.complete).toBe(false);
    expect(s.message).toContain('초기화');
  });

  it('Bootstrap만 한 프로젝트 (Phase 1 Empty) → phasesApproved: 0, currentPhase: 1', async () => {
    await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
    await writeFile(
      join(dir, 'docs', 'spec', '01-prd.md'),
      '---\nphase: 1\nstatus: Empty\n---\n# PRD\n',
    );
    const s = await status(dir);
    expect(s.initialized).toBe(true);
    expect(s.phasesApproved).toBe(0);
    expect(s.currentPhase).toBe(1);
    expect(s.complete).toBe(false);
    // phase 1 present with status Empty
    const p1 = s.phases.find((p) => p.phase === 1);
    expect(p1).toBeDefined();
    expect(p1!.status).toBe('Empty');
    // phases 2-13 missing
    expect(s.phases.filter((p) => p.status === 'missing')).toHaveLength(12);
  });

  it('Phase 1·2·3 Approved + Phase 4 Draft → phasesApproved: 3, currentPhase: 4', async () => {
    await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
    const files = [
      ['01-prd.md', 'Approved'],
      ['02-goals.md', 'Approved'],
      ['03-features.md', 'Approved'],
      ['04-ia.md', 'Draft'],
    ];
    for (const [file, st] of files) {
      await writeFile(
        join(dir, 'docs', 'spec', file),
        `---\nphase: ${parseInt(file)}\nstatus: ${st}\n---\n# Phase\n`,
      );
    }
    const s = await status(dir);
    expect(s.initialized).toBe(true);
    expect(s.phasesApproved).toBe(3);
    expect(s.currentPhase).toBe(4);
    expect(s.complete).toBe(false);
    const p4 = s.phases.find((p) => p.phase === 4);
    expect(p4!.status).toBe('Draft');
  });

  it('13 phase 모두 Approved → complete: true, phasesApproved: 13', async () => {
    await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
    const phaseFiles = [
      '01-prd.md', '02-goals.md', '03-features.md', '04-ia.md',
      '05-data.md', '06-api.md', '07-ui.md', '08-security.md',
      '09-ops.md', '10-perf.md', '11-test.md', '12-risks.md', '13-roadmap.md',
    ];
    for (let i = 0; i < phaseFiles.length; i++) {
      await writeFile(
        join(dir, 'docs', 'spec', phaseFiles[i]),
        `---\nphase: ${i + 1}\nstatus: Approved\n---\n# Phase ${i + 1}\n`,
      );
    }
    const s = await status(dir);
    expect(s.initialized).toBe(true);
    expect(s.phasesApproved).toBe(13);
    expect(s.currentPhase).toBeNull();
    expect(s.complete).toBe(true);
    expect(s.message).toContain('완료');
  });

  it('totalIds = graph node count (NFR-SCAL-2 측정)', async () => {
    await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
    // spec with 2 defined IDs
    const content = `---
phase: 1
status: Draft
---

## R1: First requirement

Some text.

## R2: Second requirement

More text.
`;
    await writeFile(join(dir, 'docs', 'spec', '01-prd.md'), content);
    const s = await status(dir);
    expect(s.initialized).toBe(true);
    expect(s.totalIds).toBe(2);
  });
});

describe('R2-M7: bootstrap currentPhase sentinel', () => {
  it('bootstrap creates state with null not-started sentinel (R2-M7)', async () => {
    await bootstrap(dir);
    const raw = await readFile(join(dir, '.plan-pipeline-cache/state.json'), 'utf8');
    const state = JSON.parse(raw);
    // Must NOT be 0 — null is the correct "not started" sentinel
    expect(state.currentPhase).not.toBe(0);
    expect(state.currentPhase).toBeNull();
  });
});
