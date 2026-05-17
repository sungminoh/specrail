import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanFile, scanProject, type SycophancyViolation } from '../src/lint/anti-sycophancy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SCRIPT = resolve(REPO_ROOT, 'src/lint/anti-sycophancy.ts');

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

  // TC-H2a: keyword AFTER same-line HTML comment close IS detected
  it('keyword after same-line HTML comment close → detected (H2 fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, '<!-- prefix --> ship-ready\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
  });

  // TC-H2b: multi-line comment spanning 3 lines containing keyword in middle → all skipped
  it('keyword inside multi-line HTML comment → skipped (H2 fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, '<!--\nship-ready in middle\n-->\n');
    const violations = await scanFile(file);
    expect(violations).toHaveLength(0);
  });

  // TC-H2c: comment closed, keyword on next line → detected
  it('keyword on line after HTML comment closes → detected (H2 fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, '<!--\n-->\nship-ready after close\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
  });

  // TC-H3a: weak evidence present but not structured → hasStrongEvidence: false
  it('weak evidence only → hasEvidence true, hasStrongEvidence false (H3 fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, 'ship-ready (we ran the tests but they all failed)\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
    expect(v!.hasEvidence).toBe(true);
    expect(v!.hasStrongEvidence).toBe(false);
  });

  // TC-H3b: structured N tests PASS → hasStrongEvidence: true
  it('structured "403 tests PASS" → hasStrongEvidence true (H3 fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, 'ship-ready (403 tests PASS)\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
    expect(v!.hasStrongEvidence).toBe(true);
  });

  // TC-H3c: test file reference → hasStrongEvidence: true
  it('"verified by tests/foo.test.ts" → hasStrongEvidence true (H3 fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, 'ship-ready\nverified by tests/foo.test.ts\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === 'ship-ready');
    expect(v).toBeDefined();
    expect(v!.hasStrongEvidence).toBe(true);
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

  // TC-R2-N1: 완료 in table cell (pipe on line) → benign, no violation
  it('완료 in table cell → benign, no violation (R2 noun-context fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, '| 단계 | 상태 | 비고 |\n| --- | --- | --- |\n| 요청 처리 | 응답 완료 | OK |\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === '완료');
    expect(v).toBeUndefined();
  });

  // TC-R2-N2: 완료 in mermaid edge label (arrow on line) → benign, no violation
  it('완료 in mermaid edge label → benign, no violation (R2 noun-context fix)', async () => {
    const file = join(dir, 'test.md');
    await writeFile(file, 'A --> B: 호출 완료\n');
    const violations = await scanFile(file);
    const v = violations.find((x: SycophancyViolation) => x.keyword === '완료');
    expect(v).toBeUndefined();
  });

  // TC-R2-M2: CRLF files — stripHtmlComments preserves \r
  it('CRLF files: stripHtmlComments preserves \\r (R2-M2 fix)', async () => {
    const file = join(dir, 'crlf.md');
    await writeFile(file, '<!-- ship-ready -->\r\nBody line\r\n');
    const violations = await scanFile(file);
    expect(violations).toHaveLength(0);
  });

  // TC-R2-CLI1: CLI exits 0 when no bare violations (clean fixture)
  it('CLI exits 0 when no bare violations (clean fixture)', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'anti-syco-cli-clean-'));
    try {
      await mkdir(join(fixture, 'docs'), { recursive: true });
      await writeFile(join(fixture, 'docs', 'a.md'), 'innocent content\n');
      const result = execSync(
        `npx --yes tsx "${SCRIPT}" "${fixture}"`,
        { stdio: 'pipe', cwd: REPO_ROOT },
      );
      expect(result.toString()).toMatch(/clean/i);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });

  // TC-R2-CLI2: CLI exits 1 when bare violations exist
  it('CLI exits 1 when bare violations exist', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'anti-syco-cli-fail-'));
    try {
      await mkdir(join(fixture, 'docs'), { recursive: true });
      await writeFile(join(fixture, 'docs', 'a.md'), 'This is ship-ready.\n');
      expect(() => execSync(
        `npx --yes tsx "${SCRIPT}" "${fixture}"`,
        { stdio: 'pipe', cwd: REPO_ROOT },
      )).toThrow();
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });

  // R3 M-Round3-2: mermaid regex dedupe + horizontal rule
  it('keyword on line with markdown horizontal rule does not match (R3 M-Round3-2)', async () => {
    const file = join(dir, 'test.md');
    // 완료 in heading should be DETECTED — no special context
    await writeFile(file, '## Phase 1 완료\n', 'utf8');
    const violations = await scanFile(file);
    const v = violations.find((x) => x.keyword === '완료');
    expect(v).toBeDefined(); // 완료 in heading is real claim
  });

  it('mermaid edge arrow patterns recognized — 완료 in label silenced (R3 M-Round3-2)', async () => {
    const file = join(dir, 'test.md');
    // 완료 in mermaid edge label → benign
    await writeFile(file, 'A --> 완료 안내 --> B\n', 'utf8');
    const violations = await scanFile(file);
    expect(violations.find((x) => x.keyword === '완료')).toBeUndefined();
  });

  // R3 M-Round3-3: O(N) fence mask perf test
  it('handles large file (5000 lines) without quadratic slowdown (R3 M-Round3-3)', async () => {
    const file = join(dir, 'big.md');
    const lines: string[] = [];
    for (let i = 0; i < 5000; i++) {
      lines.push(`Line ${i}: some content`);
    }
    lines.push('ship-ready');
    await writeFile(file, lines.join('\n'));
    const start = Date.now();
    const violations = await scanFile(file);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000); // sanity bound
    expect(violations.find((v) => v.keyword === 'ship-ready')).toBeDefined();
  });

  // TC-R2-CLI3: --strict CLI flag filters by hasStrongEvidence
  it('--strict CLI flag: weak evidence passes default but fails strict (R2-H3 fix)', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'anti-syco-cli-strict-'));
    try {
      await mkdir(join(fixture, 'docs'), { recursive: true });
      await writeFile(join(fixture, 'docs', 'a.md'), 'ship-ready (we ran the tests)\n');

      // Default mode — weak evidence present → exit 0
      expect(() => execSync(
        `npx --yes tsx "${SCRIPT}" "${fixture}"`,
        { stdio: 'pipe', cwd: REPO_ROOT },
      )).not.toThrow();

      // --strict mode — no strong evidence → exit 1
      expect(() => execSync(
        `npx --yes tsx "${SCRIPT}" "${fixture}" --strict`,
        { stdio: 'pipe', cwd: REPO_ROOT },
      )).toThrow();
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });
});
