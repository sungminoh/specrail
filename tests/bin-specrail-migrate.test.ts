// T-CSA.5 — specrail migrate codemod
// TC-81 (idempotency), TC-82 (conflict marker emission)
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.5

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMigrate, type MigrateOptions, type MigrateReport } from '../src/migrate/codemod.js';

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'specrail-migrate-'));
  mkdirSync(join(tmpRoot, 'docs', 'spec'), { recursive: true });
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function writeFixture(rel: string, content: string): void {
  const p = join(tmpRoot, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, content);
}

function read(rel: string): string {
  return readFileSync(join(tmpRoot, rel), 'utf8');
}

describe('runMigrate — Phase 5 FLN/FLE rename (T-CSA.5, TC-81)', () => {
  it('renames N-NNN tokens to FLN-N in Phase 5 file', async () => {
    writeFixture(
      'docs/spec/05-user-flow.md',
      `# User Flow
| N-001 | start |
| N-002 | next |
ref: N-001, N-076`,
    );
    const opts: MigrateOptions = { projectRoot: tmpRoot, apply: true };
    const r = await runMigrate(opts);
    const text = read('docs/spec/05-user-flow.md');
    expect(text).toContain('FLN-1');
    expect(text).toContain('FLN-2');
    expect(text).toContain('FLN-76');
    expect(text).not.toMatch(/N-001|N-002|N-076/);
    expect(r.renamed).toContainEqual(expect.objectContaining({ from: 'N-001', to: 'FLN-1', kind: 'FLN' }));
  });

  it('renames E-N tokens to FLE-N', async () => {
    writeFixture(
      'docs/spec/05-user-flow.md',
      `| E-1 | a | b |
| E-2 | b | c |
ref: E-1`,
    );
    const r = await runMigrate({ projectRoot: tmpRoot, apply: true });
    expect(read('docs/spec/05-user-flow.md')).toContain('FLE-1');
    expect(read('docs/spec/05-user-flow.md')).toContain('FLE-2');
    expect(read('docs/spec/05-user-flow.md')).not.toMatch(/\bE-[12]\b/);
    expect(r.renamed.some((x) => x.from === 'E-1' && x.to === 'FLE-1')).toBe(true);
  });

  it('is idempotent — second run produces 0-byte diff', async () => {
    writeFixture(
      'docs/spec/05-user-flow.md',
      `| N-001 | start | | N-002 | next | E-1 between`,
    );
    await runMigrate({ projectRoot: tmpRoot, apply: true });
    const after1 = read('docs/spec/05-user-flow.md');
    await runMigrate({ projectRoot: tmpRoot, apply: true });
    const after2 = read('docs/spec/05-user-flow.md');
    expect(after2).toBe(after1);
  });

  it('does NOT rename E-CC-N or other tokens that look adjacent', async () => {
    writeFixture(
      'docs/spec/05-user-flow.md',
      `Mentions E-CC-1 and ENT-Foo and E-1.`,
    );
    await runMigrate({ projectRoot: tmpRoot, apply: true });
    const after = read('docs/spec/05-user-flow.md');
    expect(after).toContain('E-CC-1'); // unchanged
    expect(after).toContain('ENT-Foo'); // unchanged
    expect(after).toContain('FLE-1'); // E-1 renamed
  });
});

describe('runMigrate — Phase 2 SCEN rename (T-CSA.5)', () => {
  it('does not rename inside code/yaml fences (defensive)', async () => {
    writeFixture(
      'docs/spec/02-personas-journey.md',
      `Prose ref to S1.

\`\`\`yaml
status: Approved
\`\`\`

| S1 | greenfield |`,
    );
    await runMigrate({ projectRoot: tmpRoot, apply: true });
    const after = read('docs/spec/02-personas-journey.md');
    // Code fence preserved
    expect(after).toContain('status: Approved');
  });
});

describe('runMigrate — dry-run mode (T-CSA.5)', () => {
  it('with apply=false, reports renames but does not write files', async () => {
    const original = `| N-001 | start | E-1 |`;
    writeFixture('docs/spec/05-user-flow.md', original);
    const r = await runMigrate({ projectRoot: tmpRoot, apply: false });
    expect(read('docs/spec/05-user-flow.md')).toBe(original);
    expect(r.renamed.length).toBeGreaterThan(0);
    expect(r.dryRun).toBe(true);
  });
});

describe('runMigrate — report shape (T-CSA.5, TC-82)', () => {
  it('writes .specrail/migrate-report.json on apply', async () => {
    writeFixture('docs/spec/05-user-flow.md', `| N-001 | x |`);
    await runMigrate({ projectRoot: tmpRoot, apply: true });
    const reportPath = join(tmpRoot, '.specrail', 'migrate-report.json');
    expect(existsSync(reportPath)).toBe(true);
    const report = JSON.parse(readFileSync(reportPath, 'utf8')) as MigrateReport;
    expect(report).toHaveProperty('renamed');
    expect(report).toHaveProperty('conflicts');
    expect(report).toHaveProperty('timestamp');
  });

  it('report.conflicts has shape {file, line, entityId, reason, ts}', async () => {
    writeFixture('docs/spec/05-user-flow.md', `| N-001 | x |`);
    const r = await runMigrate({ projectRoot: tmpRoot, apply: true });
    expect(Array.isArray(r.conflicts)).toBe(true);
    for (const c of r.conflicts) {
      expect(c).toMatchObject({
        file: expect.any(String),
        reason: expect.stringMatching(/yaml-conflict|ambiguous-id-mapping|partial-cross-ref/),
      });
    }
  });
});

describe('runMigrate — multi-file (T-CSA.5)', () => {
  it('processes every *.md in docs/spec/', async () => {
    writeFixture('docs/spec/05-user-flow.md', `| N-001 |`);
    writeFixture('docs/spec/02-personas-journey.md', `Some prose.`);
    const r = await runMigrate({ projectRoot: tmpRoot, apply: true });
    expect(r.filesScanned).toBeGreaterThanOrEqual(2);
    expect(read('docs/spec/05-user-flow.md')).toContain('FLN-1');
  });
});
