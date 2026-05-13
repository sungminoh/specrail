import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanFile, scanProject, type SycophancyViolation } from '../src/lint/anti-sycophancy.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'anti-syco-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('Anti-Sycophancy lint (US-9.1)', () => {
  // TC-1: Bare 'ship-ready' without evidence → violation with hasEvidence: false
  it('bare ship-ready (no evidence) → violation hasEvidence false', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, 'This implementation is ship-ready and good to go.\n');
    const violations = await scanFile(file);
    expect(violations.length).toBeGreaterThan(0);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
    expect(v!.hasEvidence).toBe(false);
    expect(v!.line).toBe(1);
  });

  // TC-2: 'ship-ready' followed by '(338 tests PASS)' within 1 line → hasEvidence: true
  it('ship-ready near "tests PASS" evidence → hasEvidence true', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, [
      'The system is ship-ready.',
      '(338 tests PASS)',
    ].join('\n') + '\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
    expect(v!.hasEvidence).toBe(true);
  });

  // TC-3: Code fence containing 'ship-ready' → skipped (no violation)
  it('ship-ready inside code fence → skipped', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, [
      'Example:',
      '```',
      'status: ship-ready',
      '```',
    ].join('\n') + '\n');
    const violations = await scanFile(file);
    expect(violations).toHaveLength(0);
  });

  // TC-4: HTML comment with ship-ready → skipped
  it('ship-ready inside HTML comment → skipped', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, '<!-- ship-ready note for internal use -->\n');
    const violations = await scanFile(file);
    expect(violations).toHaveLength(0);
  });

  // TC-5: Korean keyword '완료' mixed with 'verified by 338 tests' → hasEvidence: true
  it('Korean keyword near verified evidence → hasEvidence true', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, [
      '엔터프라이즈급 완료',
      'verified by 338 tests',
    ].join('\n') + '\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === '완료');
    expect(v).toBeDefined();
    expect(v!.hasEvidence).toBe(true);
  });

  // TC-6: scanProject recursive — multi-file fixture
  it('scanProject finds violations across multiple files', async () => {
    await mkdir(join(dir, 'docs'), { recursive: true });
    await writeFile(join(dir, 'docs', 'a.md'), 'This is production-ready.\n');
    await writeFile(join(dir, 'docs', 'b.md'), 'All flawless work here.\n');
    await writeFile(join(dir, 'README.md'), 'This is release-ready.\n');

    const violations = await scanProject(dir);
    const keywords = violations.map((v: SycophancyViolation) => v.keyword);
    expect(keywords).toContain('production-ready');
    expect(keywords).toContain('flawless');
    expect(keywords).toContain('release-ready');
    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  // TC-7: 'perfect' bare keyword → violation
  it('bare perfect keyword → violation hasEvidence false', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, 'The implementation is perfect.\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'perfect');
    expect(v).toBeDefined();
    expect(v!.hasEvidence).toBe(false);
  });

  // TC-9 regression: scanProject finds docs/*.md when root passed as nested
  // sub-path (e.g. './subdir'). Bug: collectFiles checked `fullPath.includes('/docs/')`
  // which failed when fullPath had no leading slash. Fixed via path.resolve in
  // scanProject + sep-based segment check in collectFiles.
  // (Cannot test relative '.' directly — vitest workers reject process.chdir.)
  it('scanProject with nested docs subdir finds .md files (regression)', async () => {
    const sub = join(dir, 'project');
    await mkdir(join(sub, 'docs'), { recursive: true });
    await writeFile(join(sub, 'docs', 'guide.md'), 'This is ship-ready output.\n');
    await writeFile(join(sub, 'docs', 'no-trigger.md'), 'innocent content.\n');
    const violations = await scanProject(sub);
    const bare = violations.filter((v) => !v.hasEvidence);
    expect(bare.length).toBeGreaterThan(0);
    expect(
      bare.some((v) => v.filePath.includes('docs') && v.keyword === 'ship-ready'),
    ).toBe(true);
  });

  // TC-8: context excerpt contains ±2 lines around match
  it('context field contains surrounding lines', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, [
      'line one',
      'line two',
      'This is ship-ready output',
      'line four',
      'line five',
    ].join('\n') + '\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
    expect(v!.context).toContain('line two');
    expect(v!.context).toContain('line four');
  });
});
