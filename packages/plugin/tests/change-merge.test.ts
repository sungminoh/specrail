// US-T7.4 (M7) — S2 DELTA current/ merge
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { invokeDeltaChain, mergeChange } from '../src/cli/change.js';

let dir: string;
let changeDir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'change-merge-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  // Seed spec phases that pass schema + INV-2 (R1 defined in 03, cited in 05)
  await writeFile(
    join(dir, 'docs/spec/03-features.md'),
    '---\nphase: 3\nstatus: Approved\n---\n## R1: payment\n',
  );
  await writeFile(
    join(dir, 'docs/spec/05-user-flow.md'),
    '---\nphase: 5\nstatus: Approved\n---\n## ENT-Foo: e\nCites R1.\n',
  );
  changeDir = join(dir, 'docs/spec/changes/2026-05-13-add-feature');
  await mkdir(changeDir, { recursive: true });
  await writeFile(
    join(changeDir, 'proposal.md'),
    '---\nstatus: proposed\ndate: 2026-05-13\ncapability: add-feature\n---\n# Change Proposal\n',
  );
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('mergeChange (US-T7.4)', () => {
  it('appends delta body to current phase as ## DELTA section (MODIFIED)', async () => {
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1', 'ENT-Foo'] },
      ['R1'],
    );
    // Edit the delta to have meaningful content
    const deltaFile = join(changeDir, 'deltas', '05-user-flow-delta.md');
    const original = await readFile(deltaFile, 'utf8');
    await writeFile(
      deltaFile,
      original.replace('## MODIFIED\n- (작성 필요)', '## MODIFIED\n- ENT-Foo: cite R1.new instead'),
    );

    const r = await mergeChange(dir, changeDir);
    expect(r.merged).toBe(true);
    expect(r.phases).toEqual(['05']);
    expect(r.message).toMatch(/Merged 1 delta/);

    const currentContent = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    expect(currentContent).toContain('## DELTA — 2026-05-13-add-feature');
    expect(currentContent).toContain('ENT-Foo: cite R1.new instead');
    // Original content preserved
    expect(currentContent).toContain('## ENT-Foo: e');
  });

  it('merges ADDED, MODIFIED, REMOVED sections from delta body', async () => {
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1'] },
      ['R1'],
    );
    const deltaFile = join(changeDir, 'deltas', '05-user-flow-delta.md');
    const original = await readFile(deltaFile, 'utf8');
    const populated = original
      .replace('## ADDED\n- (작성 필요)', '## ADDED\n- ENT-NewThing: novel')
      .replace('## MODIFIED\n- (작성 필요)', '## MODIFIED\n- ENT-Foo: changed')
      .replace('## REMOVED\n- (작성 필요)', '## REMOVED\n- ENT-OldThing: gone');
    await writeFile(deltaFile, populated);

    await mergeChange(dir, changeDir);
    const cur = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    expect(cur).toContain('ENT-NewThing: novel');
    expect(cur).toContain('ENT-Foo: changed');
    expect(cur).toContain('ENT-OldThing: gone');
  });

  it('updates proposal.md status to applied after merge', async () => {
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1'] },
      ['R1'],
    );
    await mergeChange(dir, changeDir);
    const proposal = await readFile(join(changeDir, 'proposal.md'), 'utf8');
    expect(proposal).toMatch(/^status: applied$/m);
  });

  it('is idempotent — second call returns merged:false on applied status', async () => {
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1'] },
      ['R1'],
    );
    const r1 = await mergeChange(dir, changeDir);
    expect(r1.merged).toBe(true);

    const r2 = await mergeChange(dir, changeDir);
    expect(r2.merged).toBe(false);
    expect(r2.message).toMatch(/Already applied/);
    expect(r2.phases).toEqual([]);

    // Current file should only have ONE DELTA section (not appended twice)
    const cur = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    const matches = cur.match(/## DELTA — 2026-05-13-add-feature/g);
    expect(matches).toHaveLength(1);
  });

  it('throws when schema hook fails (conflict detection: malformed frontmatter)', async () => {
    // Corrupt phase 03 frontmatter to fail schema
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\nstatus: BadStatusValue\n---\n## R1: payment\n',
    );
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1'] },
      ['R1'],
    );
    await expect(mergeChange(dir, changeDir)).rejects.toThrow(/Schema fail before merge/);
  });

  it('throws when INV-2 hook fails (dangling citation)', async () => {
    // Add dangling citation in phase 05
    await writeFile(
      join(dir, 'docs/spec/05-user-flow.md'),
      '---\nphase: 5\nstatus: Approved\n---\n## ENT-Foo: e\nCites R1 and R999.\n',
    );
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1'] },
      ['R1'],
    );
    await expect(mergeChange(dir, changeDir)).rejects.toThrow(/INV-2 fail before merge/);
  });

  it('returns merged:false when no deltas directory exists', async () => {
    const r = await mergeChange(dir, changeDir);
    expect(r.merged).toBe(false);
    expect(r.message).toMatch(/No deltas to merge/);
  });

  it('multi-phase partial fail → all restore: phase 03 and 05 both unchanged after INV-2 fail', async () => {
    // Seed phase 03 with a dangling citation that fails INV-2 — both phases have deltas
    // but the hook failure prevents any write, so both originals must be preserved
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\nstatus: Approved\n---\n## R1: payment\nCites S999.99.99.\n',
    );

    // Create deltas for BOTH phase 03 and phase 05
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['03', '05'], affectedIds: ['R1', 'ENT-Foo'] },
      ['R1'],
    );

    const delta03File = join(changeDir, 'deltas', '03-features-delta.md');
    const raw03 = await readFile(delta03File, 'utf8');
    await writeFile(
      delta03File,
      raw03.replace('## MODIFIED\n- (작성 필요)', '## MODIFIED\n- R1: updated payment flow'),
    );

    const delta05File = join(changeDir, 'deltas', '05-user-flow-delta.md');
    const raw05 = await readFile(delta05File, 'utf8');
    await writeFile(
      delta05File,
      raw05.replace('## MODIFIED\n- (작성 필요)', '## MODIFIED\n- ENT-Foo: cite R1.v2'),
    );

    // mergeChange must throw because INV-2 fails (S999.99.99 is dangling)
    await expect(mergeChange(dir, changeDir)).rejects.toThrow(/INV-2 fail before merge/);

    // Phase 03 current: must NOT contain DELTA section (no write occurred)
    const cur03 = await readFile(join(dir, 'docs/spec/03-features.md'), 'utf8');
    expect(cur03).not.toContain('## DELTA');
    expect(cur03).toContain('## R1: payment');

    // Phase 05 current: must NOT contain DELTA section
    const cur05 = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    expect(cur05).not.toContain('## DELTA');
    expect(cur05).toContain('## ENT-Foo: e');

    // Proposal must still be 'proposed' (not flipped to applied)
    const proposal = await readFile(join(changeDir, 'proposal.md'), 'utf8');
    expect(proposal).toMatch(/^status: proposed$/m);
  });

  it('accumulates multiple deltas for same phase (C3 fix)', async () => {
    // Manually create 2 delta files for phase 05 (same currentPath)
    await mkdir(join(changeDir, 'deltas'), { recursive: true });
    await writeFile(
      join(changeDir, 'deltas', '05-user-flow-A-delta.md'),
      '---\nphase: 5\n---\n## MODIFIED\n- ENT-Foo: change A\n',
    );
    await writeFile(
      join(changeDir, 'deltas', '05-user-flow-B-delta.md'),
      '---\nphase: 5\n---\n## MODIFIED\n- ENT-Foo: change B\n',
    );

    const r = await mergeChange(dir, changeDir);
    expect(r.merged).toBe(true);
    // Both delta phaseStrs are '05' — verify both phases entries
    expect(r.phases).toEqual(['05', '05']);

    const cur = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    // Both DELTA sections must be present (accumulating, not overwriting)
    expect(cur).toContain('change A');
    expect(cur).toContain('change B');
    expect(cur.match(/## DELTA — /g)?.length).toBe(2);
  });

  it('mergeChange writes atomically — no .tmp file leftover (R6 M3)', async () => {
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['05'], affectedIds: ['R1'] },
      ['R1'],
    );
    await mergeChange(dir, changeDir);

    // No .tmp files should remain after successful merge
    const specFiles = await readdir(join(dir, 'docs', 'spec'));
    expect(specFiles.filter((f) => f.endsWith('.tmp'))).toHaveLength(0);

    // Verify changeDir proposal has no .tmp either
    const changeFiles = await readdir(changeDir);
    expect(changeFiles.filter((f) => f.endsWith('.tmp'))).toHaveLength(0);
  });

  it('restores ORIGINAL (not intermediate) on multi-delta failure (C3 fix)', async () => {
    // Setup: one valid delta (phase 05) + one invalid (phase 99 — file not found)
    await mkdir(join(changeDir, 'deltas'), { recursive: true });
    await writeFile(
      join(changeDir, 'deltas', '05-user-flow-delta.md'),
      '---\nphase: 5\n---\n## MODIFIED\n- ENT-Foo: legitimate change\n',
    );
    await writeFile(
      join(changeDir, 'deltas', '99-nonexistent-delta.md'),
      '---\nphase: 99\n---\n## MODIFIED\n- something\n',
    );

    await expect(mergeChange(dir, changeDir)).rejects.toThrow(/Phase 99/);

    // Original 05 content must be intact (no leftover DELTA)
    const cur = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    expect(cur).not.toContain('## DELTA');
    expect(cur).not.toContain('legitimate change');
  });

  it('success path — 2-phase merge: both currents have DELTA section and proposal is applied', async () => {
    // Both phase 03 and phase 05 have valid content (no dangling citations)
    // Deltas for both phases merge cleanly
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: ['03', '05'], affectedIds: ['R1', 'ENT-Foo'] },
      ['R1'],
    );

    const delta03File = join(changeDir, 'deltas', '03-features-delta.md');
    const raw03 = await readFile(delta03File, 'utf8');
    await writeFile(
      delta03File,
      raw03.replace('## MODIFIED\n- (작성 필요)', '## MODIFIED\n- R1: updated payment flow'),
    );

    const delta05File = join(changeDir, 'deltas', '05-user-flow-delta.md');
    const raw05 = await readFile(delta05File, 'utf8');
    await writeFile(
      delta05File,
      raw05.replace('## MODIFIED\n- (작성 필요)', '## MODIFIED\n- ENT-Foo: cite R1.v2'),
    );

    const r = await mergeChange(dir, changeDir);
    expect(r.merged).toBe(true);
    expect(r.phases).toContain('03');
    expect(r.phases).toContain('05');

    // Both phase currents have DELTA section appended
    const cur03 = await readFile(join(dir, 'docs/spec/03-features.md'), 'utf8');
    expect(cur03).toContain('## DELTA — 2026-05-13-add-feature');
    expect(cur03).toContain('R1: updated payment flow');

    const cur05 = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    expect(cur05).toContain('## DELTA — 2026-05-13-add-feature');
    expect(cur05).toContain('ENT-Foo: cite R1.v2');

    // Proposal flipped to applied
    const proposal = await readFile(join(changeDir, 'proposal.md'), 'utf8');
    expect(proposal).toMatch(/^status: applied$/m);
  });
});
