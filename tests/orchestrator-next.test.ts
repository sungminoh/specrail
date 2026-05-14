// US-T7.2 — nextPhase() orchestrator wire (M7)
// ADR-11: Phase N+1 manual trigger. nextPhase()는 suggestion만 반환.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { nextPhase } from '../src/skill/orchestrator.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'orchestrator-next-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

// Helper: create docs/spec dir + write phase files
async function setupSpec(phases: Array<{ file: string; status: string }>): Promise<void> {
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  for (const { file, status } of phases) {
    const phaseNum = parseInt(file.slice(0, 2), 10);
    await writeFile(
      join(dir, 'docs', 'spec', file),
      `---\nphase: ${phaseNum}\nstatus: ${status}\n---\n# Phase ${phaseNum}\n`,
    );
  }
}

describe('nextPhase() — ADR-11 Phase N+1 suggestion (US-T7.2, M7)', () => {
  it('empty project (docs/spec 없음) → hasNext: false, not initialized', async () => {
    const result = await nextPhase(dir);
    expect(result.hasNext).toBe(false);
    expect(result.nextPhase).toBeNull();
    expect(result.reason).toContain('not initialized');
    expect(result.blocked).toBeUndefined();
  });

  it('Phase 1 Empty → hasNext: true, nextPhase: 1', async () => {
    await setupSpec([{ file: '01-prd.md', status: 'Empty' }]);
    const result = await nextPhase(dir);
    expect(result.hasNext).toBe(true);
    expect(result.nextPhase).toBe(1);
    expect(result.reason).toContain('/specrail phase 1');
    expect(result.blocked).toBeUndefined();
  });

  it('Phase 1 Draft → hasNext:true + blocked:true + nextPhase:1 (R2 M8)', async () => {
    await setupSpec([{ file: '01-prd.md', status: 'Draft' }]);
    const result = await nextPhase(dir);
    // R2 M8: Draft branch returns hasNext:true so caller knows next phase number,
    // and blocked:true to signal approve required.
    expect(result.hasNext).toBe(true);
    expect(result.nextPhase).toBe(1);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('approve');
    expect(result.reason).toContain('1');
  });

  it('Phase 1 Draft → currentPhase set to 1 (R6 L7: approve current vs advance)', async () => {
    await setupSpec([{ file: '01-prd.md', status: 'Draft' }]);
    const result = await nextPhase(dir);
    expect(result.currentPhase).toBe(1);
  });

  it('Phase 1-3 Approved + Phase 4 Draft → currentPhase set to 4 (R6 L7)', async () => {
    await setupSpec([
      { file: '01-prd.md', status: 'Approved' },
      { file: '02-goals.md', status: 'Approved' },
      { file: '03-features.md', status: 'Approved' },
      { file: '04-ia.md', status: 'Draft' },
    ]);
    const result = await nextPhase(dir);
    expect(result.currentPhase).toBe(4);
    expect(result.blocked).toBe(true);
  });

  it('Phase 1 Empty → currentPhase is undefined (only set in Draft branch)', async () => {
    await setupSpec([{ file: '01-prd.md', status: 'Empty' }]);
    const result = await nextPhase(dir);
    expect(result.currentPhase).toBeUndefined();
  });

  it('Phase 1-3 Approved + Phase 4 Empty → hasNext: true, nextPhase: 4', async () => {
    await setupSpec([
      { file: '01-prd.md', status: 'Approved' },
      { file: '02-goals.md', status: 'Approved' },
      { file: '03-features.md', status: 'Approved' },
      { file: '04-ia.md', status: 'Empty' },
    ]);
    const result = await nextPhase(dir);
    expect(result.hasNext).toBe(true);
    expect(result.nextPhase).toBe(4);
    expect(result.reason).toContain('/specrail phase 4');
    expect(result.blocked).toBeUndefined();
  });

  it('Phase 1-3 Approved + Phase 4 Draft → hasNext:true + blocked:true + nextPhase:4 (R2 M8)', async () => {
    await setupSpec([
      { file: '01-prd.md', status: 'Approved' },
      { file: '02-goals.md', status: 'Approved' },
      { file: '03-features.md', status: 'Approved' },
      { file: '04-ia.md', status: 'Draft' },
    ]);
    const result = await nextPhase(dir);
    // R2 M8: Draft = blocked but next phase number IS known
    expect(result.hasNext).toBe(true);
    expect(result.nextPhase).toBe(4);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('4');
    expect(result.reason).toContain('approve');
  });

  it('All 13 phases Approved → hasNext: false, complete message', async () => {
    const phaseFiles = [
      '01-prd.md', '02-goals.md', '03-features.md', '04-ia.md',
      '05-data.md', '06-api.md', '07-ui.md', '08-security.md',
      '09-ops.md', '10-perf.md', '11-test.md', '12-risks.md', '13-roadmap.md',
    ];
    await setupSpec(phaseFiles.map((file) => ({ file, status: 'Approved' })));
    const result = await nextPhase(dir);
    expect(result.hasNext).toBe(false);
    expect(result.nextPhase).toBeNull();
    expect(result.reason).toContain('13 phases complete');
    expect(result.blocked).toBeUndefined();
  });

  it('Phase 1-12 Approved + Phase 13 missing → hasNext: true, nextPhase: 13', async () => {
    const phaseFiles = [
      '01-prd.md', '02-goals.md', '03-features.md', '04-ia.md',
      '05-data.md', '06-api.md', '07-ui.md', '08-security.md',
      '09-ops.md', '10-perf.md', '11-test.md', '12-risks.md',
    ];
    await setupSpec(phaseFiles.map((file) => ({ file, status: 'Approved' })));
    const result = await nextPhase(dir);
    expect(result.hasNext).toBe(true);
    expect(result.nextPhase).toBe(13);
    expect(result.reason).toContain('/specrail phase 13');
  });
});
