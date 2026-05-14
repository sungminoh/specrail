import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectExisting, installHook, HOOK_TEMPLATE } from '../src/cli/hook-install.js';

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

  it('installs specrail hook when no existing (chain=false)', async () => {
    const r = await installHook(dir);
    expect(r.installed).toBe(true);
    expect(r.chainedExisting).toBe(false);
    const content = await readFile(r.hookPath, 'utf8');
    expect(content).toContain('specrail hook chain');
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
    expect(r.guidance).toContain('specrail check');
  });

  it('returns guidance instead of overwriting lefthook (INV-10)', async () => {
    await writeFile(join(dir, 'lefthook.yml'), 'pre-commit:\n  commands: {}\n');

    const r = await installHook(dir);
    expect(r.installed).toBe(false);
    expect(r.guidance).toContain('lefthook');
  });

  it('does not reinstall if specrail hook already present (without force)', async () => {
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

describe('R6 M1: detectExisting alreadyChained flag', () => {
  it('alreadyChained is true when .git/hooks/pre-commit contains HOOK_MARKER', async () => {
    await mkdir(join(dir, '.git/hooks'), { recursive: true });
    await writeFile(
      join(dir, '.git/hooks/pre-commit'),
      '#!/usr/bin/env node\n// specrail hook chain (INV-10 보존)\n',
    );
    const r = await detectExisting(dir);
    expect(r.type).toBe('plain');
    expect(r.alreadyChained).toBe(true);
  });

  it('alreadyChained is false when .git/hooks/pre-commit is an external hook', async () => {
    await mkdir(join(dir, '.git/hooks'), { recursive: true });
    await writeFile(join(dir, '.git/hooks/pre-commit'), '#!/bin/sh\necho user hook\n');
    const r = await detectExisting(dir);
    expect(r.type).toBe('plain');
    expect(r.alreadyChained).toBe(false);
  });

  it('alreadyChained is undefined for non-plain types', async () => {
    await mkdir(join(dir, '.husky'), { recursive: true });
    await writeFile(join(dir, '.husky/pre-commit'), 'npm test\n');
    const r = await detectExisting(dir);
    expect(r.type).toBe('husky');
    expect(r.alreadyChained).toBeUndefined();
  });
});

describe('HOOK_TEMPLATE ESM compatibility (R3 M-Round3-1)', () => {
  it('HOOK_TEMPLATE does not use require() in ESM context (R3 M-Round3-1)', () => {
    // Template should NOT contain bare require( calls (only createRequire is OK)
    const bareRequireMatches = HOOK_TEMPLATE.match(/(?<!create)require\s*\(/g) ?? [];
    expect(bareRequireMatches.length).toBe(0);
  });
});

describe('HOOK_TEMPLATE source string contents', () => {
  it('R2-H1: IIFE has .catch() after closing paren', () => {
    // The IIFE must end with })().catch( to ensure uncaught rejections are handled
    expect(HOOK_TEMPLATE).toContain('.catch(');
    // Verify the catch comes AFTER the closing })() of the IIFE
    const iifeClose = HOOK_TEMPLATE.indexOf('})()');
    const catchIdx = HOOK_TEMPLATE.indexOf('.catch(', iifeClose);
    expect(catchIdx).toBeGreaterThan(iifeClose);
  });

  it('R2-H2: template contains npm package loaded message', () => {
    expect(HOOK_TEMPLATE).toContain('loaded from specrail package');
  });

  it('R2-H2: template contains local dist loaded message', () => {
    expect(HOOK_TEMPLATE).toContain('loaded from local dist');
  });

  it('R2-H2: template contains dist-not-found exit message', () => {
    expect(HOOK_TEMPLATE).toContain('dist not found');
  });
});

describe('M3: dual-tool existence warning', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'hook-install-m3-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('emits WARNING when both .husky/pre-commit and .git/hooks/pre-commit exist', async () => {
    // Set up .husky/pre-commit
    await mkdir(join(dir, '.husky'), { recursive: true });
    await writeFile(join(dir, '.husky/pre-commit'), 'npm test\n');

    // Set up .git/hooks/pre-commit
    await mkdir(join(dir, '.git/hooks'), { recursive: true });
    await writeFile(join(dir, '.git/hooks/pre-commit'), '#!/bin/sh\necho legacy\n');

    const stderrChunks: string[] = [];
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      stderrChunks.push(String(chunk));
      return true;
    });

    try {
      await installHook(dir);
    } finally {
      vi.restoreAllMocks();
    }

    const stderrOutput = stderrChunks.join('');
    expect(stderrOutput).toContain('WARNING');
    expect(stderrOutput).toContain('.husky/pre-commit');
    expect(stderrOutput).toContain('.git/hooks/pre-commit');
  });
});
