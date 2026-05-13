// US-T7.4 (M7) — S2 DELTA current/ merge
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
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
});
