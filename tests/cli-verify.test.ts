import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs, runVerifyCli } from '../src/cli/verify.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cli-verify-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('verify CLI argument parsing (US-V16)', () => {
  it('defaults: human format, cache on, tests on', () => {
    const opts = parseArgs([]);
    expect(opts.format).toBe('human');
    expect(opts.useCache).toBe(true);
    expect(opts.skipTests).toBe(false);
    expect(opts.checkHonesty).toBe(false);
    expect(opts.filter).toBeUndefined();
  });

  it('--json switches format', () => {
    expect(parseArgs(['--json']).format).toBe('json');
  });

  it('--md / --markdown both work', () => {
    expect(parseArgs(['--md']).format).toBe('md');
    expect(parseArgs(['--markdown']).format).toBe('md');
  });

  it('--filter parses regex', () => {
    const opts = parseArgs(['--filter', '^R\\d+$']);
    expect(opts.filter?.test('R1')).toBe(true);
    expect(opts.filter?.test('AC-R1-1')).toBe(false);
  });

  it('--no-cache and --no-tests toggle off', () => {
    const opts = parseArgs(['--no-cache', '--no-tests']);
    expect(opts.useCache).toBe(false);
    expect(opts.skipTests).toBe(true);
  });

  it('--check-honesty enables honesty mode', () => {
    expect(parseArgs(['--check-honesty']).checkHonesty).toBe(true);
  });
});

describe('runVerifyCli (US-V16)', () => {
  it('emits human report by default', async () => {
    await writeFile(
      join(dir, 'docs', 'spec', '03-features.md'),
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: example',
      ].join('\n'),
      'utf8',
    );
    const { exitCode, output } = await runVerifyCli(dir, ['--no-cache', '--no-tests']);
    expect(exitCode).toBe(0);
    expect(output).toContain('R1');
    expect(output).toMatch(/Reality|Summary/);
  });

  it('--json emits parseable JSON', async () => {
    await writeFile(
      join(dir, 'docs', 'spec', '03-features.md'),
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: example',
      ].join('\n'),
      'utf8',
    );
    const { output } = await runVerifyCli(dir, ['--json', '--no-cache', '--no-tests']);
    const parsed = JSON.parse(output);
    expect(parsed.initialized).toBe(true);
    expect(parsed.results.R1).toBeDefined();
  });

  it('--filter narrows the result set', async () => {
    await writeFile(
      join(dir, 'docs', 'spec', '03-features.md'),
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: keep',
        '',
        '#### S1.1.1: drop',
      ].join('\n'),
      'utf8',
    );
    const { output } = await runVerifyCli(dir, [
      '--json',
      '--no-cache',
      '--no-tests',
      '--filter',
      '^R\\d+$',
    ]);
    const parsed = JSON.parse(output);
    expect(parsed.results.R1).toBeDefined();
    expect(parsed.results['S1.1.1']).toBeUndefined();
  });
});
