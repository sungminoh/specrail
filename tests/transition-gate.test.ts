import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canInvokePhase } from '../src/skill/gate.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gate-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('Phase transition gate (F2.2, AC-R2-2, INV-3, TC-5·32)', () => {
  it('allows Phase 1 always (INV-3 예외)', async () => {
    expect(await canInvokePhase(dir, 1)).toEqual({ allowed: true });
  });

  it('blocks Phase 2 if Phase 1 not Approved (status=Draft)', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n---\n# PRD\n',
    );
    const r = await canInvokePhase(dir, 2);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('Draft');
  });

  it('allows Phase 2 when Phase 1 Approved', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Approved\n---\n# PRD\n',
    );
    expect(await canInvokePhase(dir, 2)).toEqual({ allowed: true });
  });

  it('blocks when previous phase file missing', async () => {
    const r = await canInvokePhase(dir, 5);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('Phase 4 file missing');
  });

  it('blocks when status field missing in frontmatter', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n# Features\n',
    );
    const r = await canInvokePhase(dir, 4);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('missing');
  });

  it('blocks invalid target phase', async () => {
    expect((await canInvokePhase(dir, 14)).allowed).toBe(false);
    expect((await canInvokePhase(dir, 0)).allowed).toBe(false);
  });
});
