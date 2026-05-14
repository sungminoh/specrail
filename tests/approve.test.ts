import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approve } from '../src/cli/approve.js';

// Mock hooks to control their behavior in tests
vi.mock('../src/hook/schema-validate.js', () => ({
  runHook: vi.fn(),
}));
vi.mock('../src/hook/id-consistency.js', () => ({
  runHook: vi.fn(),
}));

import { runHook as runSchemaHook } from '../src/hook/schema-validate.js';
import { runHook as runIdHook } from '../src/hook/id-consistency.js';

const mockSchema = vi.mocked(runSchemaHook);
const mockId = vi.mocked(runIdHook);

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'approve-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  // Default: hooks pass
  mockSchema.mockResolvedValue({ ok: true, message: 'F2.4 schema validation OK' });
  mockId.mockResolvedValue({ ok: true, message: 'INV-2 OK: 0 defined, 0 cited, 0 dangling' });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('approve (US-T5.5)', () => {
  it('Draft → Approved: writes status and approvedAt', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n---\n# PRD\n',
    );

    const result = await approve(dir, 1);

    expect(result.approved).toBe(true);
    expect(result.phaseFile).toBe('01-prd.md');
    expect(result.approvedAt).toBeDefined();

    const written = await readFile(join(dir, 'docs/spec/01-prd.md'), 'utf8');
    expect(written).toContain('status: Approved');
    expect(written).toMatch(/approvedAt: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('Empty → Approved: throws INV-3 violation', async () => {
    await writeFile(
      join(dir, 'docs/spec/02-arch.md'),
      '---\nphase: 2\nstatus: Empty\n---\n# Arch\n',
    );

    await expect(approve(dir, 2)).rejects.toThrow(/INV-3 violation/);
  });

  it('missing status (no status field) → throws INV-3 (treated as Empty)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n# Features\n',
    );

    await expect(approve(dir, 3)).rejects.toThrow(/INV-3 violation/);
  });

  it('already Approved → returns idempotent result without re-writing', async () => {
    const original = '---\nphase: 1\nstatus: Approved\napprovedAt: 2024-01-01T00:00:00.000Z\n---\n# PRD\n';
    await writeFile(join(dir, 'docs/spec/01-prd.md'), original);

    const result = await approve(dir, 1);

    expect(result.approved).toBe(false);
    expect(result.message).toContain('idempotent');
    // File not changed — hooks not called
    expect(mockSchema).not.toHaveBeenCalled();
    const written = await readFile(join(dir, 'docs/spec/01-prd.md'), 'utf8');
    expect(written).toBe(original);
  });

  it('schema hook fail → throws before writing file', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n---\n# PRD\n',
    );
    mockSchema.mockResolvedValue({ ok: false, message: 'F2.4 schema validation FAILED: missing field' });

    await expect(approve(dir, 1)).rejects.toThrow(/Schema validation FAILED/);

    // Status must remain Draft (no write occurred)
    const written = await readFile(join(dir, 'docs/spec/01-prd.md'), 'utf8');
    expect(written).toContain('status: Draft');
    expect(written).not.toContain('Approved');
  });

  it('INV-2 hook fail → throws before writing file', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n---\n# PRD\n',
    );
    mockId.mockResolvedValue({ ok: false, message: 'INV-2 violation: 1 cited IDs not defined' });

    await expect(approve(dir, 1)).rejects.toThrow(/INV-2 check FAILED/);

    const written = await readFile(join(dir, 'docs/spec/01-prd.md'), 'utf8');
    expect(written).toContain('status: Draft');
    expect(written).not.toContain('Approved');
  });

  it('phase file not found → throws', async () => {
    await expect(approve(dir, 5)).rejects.toThrow(/Phase 5 file not found/);
  });

  it('approvedAt is valid ISO 8601 timestamp', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n---\n# PRD\n',
    );

    const result = await approve(dir, 1);

    expect(result.approvedAt).toBeDefined();
    const ts = new Date(result.approvedAt!);
    expect(ts.toISOString()).toBe(result.approvedAt);
  });

  it('approve appends approvedAt without extra blank line (R7 M1)', async () => {
    // Setup: phase file with trailing newline in frontmatter body
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n\n---\n# PRD\n',
    );
    await approve(dir, 1);
    const result = await readFile(join(dir, 'docs/spec/01-prd.md'), 'utf8');
    // No double blank line before closing ---
    expect(result).not.toMatch(/approvedAt:[^\n]*\n\n+---/);
  });
});
