import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runHook, checkSchemas } from '../src/hook/schema-validate.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'schema-hook-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('schema validation hook (F2.4, AC-R2-3, TC-6·34)', () => {
  it('passes valid frontmatter (phase 1)', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n---\n# PRD\n',
    );
    const r = await runHook(dir);
    expect(r.ok).toBe(true);
  });

  it('fails on missing required status', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\n---\n# PRD\n',
    );
    const r = await runHook(dir);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('01-prd.md');
  });

  it('fails on wrong phase number for file', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 5\nstatus: Draft\n---\n',
    );
    const r = await runHook(dir);
    expect(r.ok).toBe(false);
  });

  it('fails on invalid status enum', async () => {
    await writeFile(
      join(dir, 'docs/spec/02-personas.md'),
      '---\nphase: 2\nstatus: InProgress\n---\n',
    );
    const r = await runHook(dir);
    expect(r.ok).toBe(false);
  });

  it('fails on missing frontmatter', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '# Just heading, no frontmatter',
    );
    const r = await runHook(dir);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('missing frontmatter');
  });

  it('empty docs/spec → ok', async () => {
    const r = await runHook(dir);
    expect(r.ok).toBe(true);
  });
});

describe('schema missing → warning (US-T6.2)', () => {
  it('missing schema file produces warning, ok: true (lenient default)', async () => {
    // Phase 99 has no schema file in schemas/
    await writeFile(
      join(dir, 'docs/spec/99-unknown.md'),
      '---\nphase: 99\nstatus: Draft\n---\n# Unknown\n',
    );
    const r = await checkSchemas(dir);
    expect(r.ok).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0].messages[0]).toContain('schema file not found at');
    expect(r.warnings[0].messages[0]).toContain('validation skipped');
    expect(r.errors.length).toBe(0);
  });

  it('missing schema file + strict: true → ok: false', async () => {
    await writeFile(
      join(dir, 'docs/spec/99-unknown.md'),
      '---\nphase: 99\nstatus: Draft\n---\n# Unknown\n',
    );
    const r = await checkSchemas(dir, { strict: true });
    expect(r.ok).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('SchemaCheckResult has warnings field', async () => {
    const r = await checkSchemas(dir);
    expect(r).toHaveProperty('warnings');
    expect(Array.isArray(r.warnings)).toBe(true);
  });
});
