import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectExisting, installHook } from '../src/cli/hook-install.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'hook-install-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('Pre-commit hook installer (T1.7, AC-R6-3, AC-R2-1, F2.1, F6.4, RISK-3, INV-10, TC-4)', () => {
  it('detects none when no hook exists', async () => {
    const r = await detectExisting(dir);
    expect(r.type).toBe('none');
  });

  it('detects husky v9', async () => {
    await mkdir(join(dir, '.husky'), { recursive: true });
    await writeFile(join(dir, '.husky/pre-commit'), 'npm test\n');
    const r = await detectExisting(dir);
    expect(r.type).toBe('husky');
  });

  it('detects husky v8 (underscore dir)', async () => {
    await mkdir(join(dir, '.husky/_'), { recursive: true });
    await writeFile(join(dir, '.husky/_/pre-commit'), 'npm test\n');
    const r = await detectExisting(dir);
    expect(r.type).toBe('husky');
  });

  it('detects lefthook', async () => {
    await writeFile(join(dir, 'lefthook.yml'), 'pre-commit:\n  commands:\n    lint: {run: npm run lint}\n');
    const r = await detectExisting(dir);
    expect(r.type).toBe('lefthook');
  });

  it('detects plain .git/hooks/pre-commit', async () => {
    await mkdir(join(dir, '.git/hooks'), { recursive: true });
    await writeFile(join(dir, '.git/hooks/pre-commit'), '#!/bin/sh\necho user hook\n');
    const r = await detectExisting(dir);
    expect(r.type).toBe('plain');
  });

  it('installs v4 hook when no existing (chain=false)', async () => {
    const r = await installHook(dir);
    expect(r.installed).toBe(true);
    expect(r.chainedExisting).toBe(false);
    const content = await readFile(r.hookPath, 'utf8');
    expect(content).toContain('plan-pipeline v4 hook chain');
  });

  it('backs up existing plain hook (INV-10 보존)', async () => {
    await mkdir(join(dir, '.git/hooks'), { recursive: true });
    await writeFile(join(dir, '.git/hooks/pre-commit'), '#!/bin/sh\necho user lint\n');

    const r = await installHook(dir);

    expect(r.installed).toBe(true);
    expect(r.chainedExisting).toBe(true);
    expect(r.backupPath).toBeDefined();

    const backup = await readFile(r.backupPath!, 'utf8');
    expect(backup).toContain('echo user lint');

    // New hook should chain
    const newHook = await readFile(r.hookPath, 'utf8');
    expect(newHook).toContain('user-original');
  });

  it('returns guidance instead of overwriting husky (INV-10)', async () => {
    await mkdir(join(dir, '.husky'), { recursive: true });
    await writeFile(join(dir, '.husky/pre-commit'), 'npm test\n');

    const r = await installHook(dir);
    expect(r.installed).toBe(false);
    expect(r.guidance).toContain('husky');
    expect(r.guidance).toContain('plan-pipeline check');
  });

  it('returns guidance instead of overwriting lefthook (INV-10)', async () => {
    await writeFile(join(dir, 'lefthook.yml'), 'pre-commit:\n  commands: {}\n');

    const r = await installHook(dir);
    expect(r.installed).toBe(false);
    expect(r.guidance).toContain('lefthook');
  });

  it('does not reinstall if v4 already present (without force)', async () => {
    await installHook(dir);
    const r2 = await installHook(dir);
    expect(r2.installed).toBe(false);
    expect(r2.guidance).toContain('already installed');
  });

  it('reinstalls with force=true', async () => {
    await installHook(dir);
    const r2 = await installHook(dir, { force: true });
    expect(r2.installed).toBe(true);
  });
});
