import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const BIN = resolve(REPO_ROOT, 'src/bin/plan-pipeline.ts');

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cli-bin-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('plan-pipeline CLI bin (R3 M-Round3-5)', () => {
  it('--help / no args prints command list', () => {
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    try {
      stdout = execSync(`npx --yes tsx "${BIN}"`, { stdio: 'pipe', cwd: dir }).toString();
    } catch (e: any) {
      stderr = String(e.stderr ?? '');
      stdout = String(e.stdout ?? '');
      exitCode = e.status ?? 1;
    }
    const out = stderr + stdout;
    expect(out).toMatch(/Commands:/);
    expect(out).toMatch(/init/);
    expect(out).toMatch(/approve/);
  });

  it('status command runs against empty dir without crash', () => {
    const stdout = execSync(`npx --yes tsx "${BIN}" status`, { stdio: 'pipe', cwd: dir }).toString();
    expect(stdout).toMatch(/initialized|currentPhase/);
  });

  it('check command runs and reports lint state', () => {
    let exitCode = 0;
    let stdout = '';
    try {
      stdout = execSync(`npx --yes tsx "${BIN}" check`, { stdio: 'pipe', cwd: dir }).toString();
    } catch (e: any) {
      stdout = String(e.stdout ?? '');
      exitCode = e.status ?? 1;
    }
    expect(stdout).toMatch(/Overall:/);
  });
});
