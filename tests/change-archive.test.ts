// US-T7.5 (M7) — S2 DELTA archive 이동
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveChange } from '../src/cli/change.js';

let dir: string;
let changeDir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'change-archive-'));
  await mkdir(join(dir, 'docs', 'spec', 'changes'), { recursive: true });
  changeDir = join(dir, 'docs/spec/changes/2026-05-13-add-feature');
  await mkdir(changeDir, { recursive: true });
  await writeFile(
    join(changeDir, 'proposal.md'),
    '---\nstatus: applied\ndate: 2026-05-13\ncapability: add-feature\n---\n# Change Proposal\n',
  );
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('archiveChange (US-T7.5)', () => {
  it('renames changeDir to changes/archive/{name}', async () => {
    const r = await archiveChange(dir, changeDir);
    expect(r.archived).toBe(true);
    expect(r.archivePath).toMatch(
      /docs\/spec\/changes\/archive\/2026-05-13-add-feature$/,
    );
    expect(r.message).toMatch(/Archived to /);

    // Source removed
    await expect(stat(changeDir)).rejects.toThrow();
    // Destination exists
    const s = await stat(r.archivePath);
    expect(s.isDirectory()).toBe(true);
  });

  it('creates archive directory recursively if missing', async () => {
    // archive subdir doesn't exist yet
    await expect(
      stat(join(dir, 'docs/spec/changes/archive')),
    ).rejects.toThrow();
    await archiveChange(dir, changeDir);
    const s = await stat(join(dir, 'docs/spec/changes/archive'));
    expect(s.isDirectory()).toBe(true);
  });

  it('updates proposal.md status to archived', async () => {
    const r = await archiveChange(dir, changeDir);
    const proposal = await readFile(join(r.archivePath, 'proposal.md'), 'utf8');
    expect(proposal).toMatch(/^status: archived$/m);
    expect(proposal).not.toMatch(/^status: applied$/m);
  });

  it('is idempotent — second call when already archived returns archived:false', async () => {
    const r1 = await archiveChange(dir, changeDir);
    expect(r1.archived).toBe(true);

    // Make a fresh changeDir with same name and try to re-archive
    await mkdir(changeDir, { recursive: true });
    await writeFile(
      join(changeDir, 'proposal.md'),
      '---\nstatus: applied\n---\n# Re-proposed\n',
    );
    const r2 = await archiveChange(dir, changeDir);
    expect(r2.archived).toBe(false);
    expect(r2.message).toMatch(/Already archived/);
    // Source changeDir still exists (not renamed since target exists)
    const s = await stat(changeDir);
    expect(s.isDirectory()).toBe(true);
  });

  it('throws when changeDir does not exist (and not already archived)', async () => {
    await rm(changeDir, { recursive: true, force: true });
    await expect(archiveChange(dir, changeDir)).rejects.toThrow(
      /Change directory not found/,
    );
  });

  it('preserves deltas directory contents in archive', async () => {
    await mkdir(join(changeDir, 'deltas'), { recursive: true });
    await writeFile(
      join(changeDir, 'deltas', '05-user-flow-delta.md'),
      '---\nphase: 5\ndeltaOf: 5\n---\n# Delta\n',
    );
    const r = await archiveChange(dir, changeDir);
    const deltaContent = await readFile(
      join(r.archivePath, 'deltas', '05-user-flow-delta.md'),
      'utf8',
    );
    expect(deltaContent).toContain('# Delta');
  });
});
