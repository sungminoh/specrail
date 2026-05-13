// US-T7.3 (M7) — S2 DELTA delta skill invoke chain
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { invokeDeltaPhase, invokeDeltaChain } from '../src/cli/change.js';

let dir: string;
let changeDir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'change-delta-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  // Seed phase files
  await writeFile(
    join(dir, 'docs/spec/03-features.md'),
    '---\nphase: 3\ncapability: payment\n---\n## R1: payment\n',
  );
  await writeFile(
    join(dir, 'docs/spec/05-user-flow.md'),
    '---\nphase: 5\nfeatureRef: R1\n---\n## ENT-Foo: e\nCites R1.\n',
  );
  await writeFile(
    join(dir, 'docs/spec/07-design.md'),
    '---\nphase: 7\n---\n## D1: design\nRefs R1.\n',
  );
  changeDir = join(dir, 'docs/spec/changes/2026-05-13-add-feature');
  await mkdir(changeDir, { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('invokeDeltaPhase (US-T7.3)', () => {
  it('creates delta skeleton at deltas/{NN-name}-delta.md', async () => {
    const r = await invokeDeltaPhase(dir, changeDir, 5, ['R1'], ['R1', 'ENT-Foo']);
    expect(r.created).toBe(true);
    expect(r.deltaPath).toMatch(/deltas\/05-user-flow-delta\.md$/);
    const content = await readFile(r.deltaPath, 'utf8');
    expect(content).toContain('phase: 5');
    expect(content).toContain('deltaOf: 5');
    expect(content).toContain('changeId: 2026-05-13-add-feature');
    expect(content).toContain('status: Draft');
    expect(content).toContain('## ADDED');
    expect(content).toContain('## MODIFIED');
    expect(content).toContain('## REMOVED');
  });

  it('injects current phase frontmatter as read-only context', async () => {
    const r = await invokeDeltaPhase(dir, changeDir, 5, ['R1'], ['R1']);
    const content = await readFile(r.deltaPath, 'utf8');
    expect(content).toContain('Current frontmatter (read-only context)');
    expect(content).toContain('F1.2 auto-inject');
    expect(content).toContain('featureRef');
  });

  it('lists changedIds and affectedIds in body', async () => {
    const r = await invokeDeltaPhase(
      dir,
      changeDir,
      5,
      ['R1', 'R2'],
      ['R1', 'R2', 'ENT-Foo', 'ENT-Bar'],
    );
    const content = await readFile(r.deltaPath, 'utf8');
    expect(content).toContain('## Changed IDs (trigger)');
    expect(content).toContain('- R1');
    expect(content).toContain('- R2');
    expect(content).toContain('## Affected IDs (transitive');
    expect(content).toContain('- ENT-Foo');
    expect(content).toContain('- ENT-Bar');
  });

  it('is idempotent — second call returns created:false and does not overwrite', async () => {
    const r1 = await invokeDeltaPhase(dir, changeDir, 5, ['R1'], ['R1']);
    expect(r1.created).toBe(true);
    const before = await readFile(r1.deltaPath, 'utf8');
    // mutate by hand
    await writeFile(r1.deltaPath, before + '\nUSER EDIT\n');

    const r2 = await invokeDeltaPhase(dir, changeDir, 5, ['R1'], ['R1']);
    expect(r2.created).toBe(false);
    expect(r2.deltaPath).toBe(r1.deltaPath);
    const after = await readFile(r2.deltaPath, 'utf8');
    expect(after).toContain('USER EDIT'); // not overwritten
  });

  it('truncates affectedIds list at 30 with overflow message', async () => {
    const many = Array.from({ length: 45 }, (_, i) => `ID-${i}`);
    const r = await invokeDeltaPhase(dir, changeDir, 5, ['R1'], many);
    const content = await readFile(r.deltaPath, 'utf8');
    expect(content).toContain('- ID-29');
    expect(content).not.toContain('- ID-30');
    expect(content).toContain('and 15 more');
  });

  it('throws when phase file does not exist', async () => {
    await expect(invokeDeltaPhase(dir, changeDir, 99, ['R1'], ['R1'])).rejects.toThrow(
      /Phase 99 spec file not found/,
    );
  });
});

describe('invokeDeltaChain (US-T7.3)', () => {
  it('creates delta for every affected phase', async () => {
    const r = await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05', '07'], affectedIds: ['R1', 'ENT-Foo', 'D1'] },
      ['R1'],
    );
    expect(r.created).toBe(2);
    expect(r.deltas).toHaveLength(2);
    expect(r.deltas.some((p) => p.endsWith('05-user-flow-delta.md'))).toBe(true);
    expect(r.deltas.some((p) => p.endsWith('07-design-delta.md'))).toBe(true);

    // deltas dir physical check
    const s = await stat(join(changeDir, 'deltas'));
    expect(s.isDirectory()).toBe(true);
  });

  it('handles single affected phase', async () => {
    const r = await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1'] },
      ['R1'],
    );
    expect(r.created).toBe(1);
    expect(r.deltas).toHaveLength(1);
  });

  it('handles empty downstream — created:0, deltas:[]', async () => {
    const r = await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: [], affectedIds: [] },
      [],
    );
    expect(r.created).toBe(0);
    expect(r.deltas).toEqual([]);
  });

  it('is idempotent across chain — second call created:0 but deltas listed', async () => {
    const r1 = await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05', '07'], affectedIds: ['R1'] },
      ['R1'],
    );
    expect(r1.created).toBe(2);

    const r2 = await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05', '07'], affectedIds: ['R1'] },
      ['R1'],
    );
    expect(r2.created).toBe(0);
    expect(r2.deltas).toHaveLength(2);
  });
});
