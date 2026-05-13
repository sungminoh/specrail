import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkIdConsistency, runHook } from '../src/hook/id-consistency.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'idc-hook-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('ID consistency hook (F2.3, INV-2, TC-31)', () => {
  it('finds 0 dangling when all citations defined', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '## R1: foo\n### F1.1: bar\nBody refs R1, F1.1.',
    );
    const r = await checkIdConsistency(dir);
    expect(r.dangling).toEqual([]);
    expect(r.defined.has('R1')).toBe(true);
    expect(r.cited.has('R1')).toBe(true);
  });

  it('detects dangling citation (INV-2 violation)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '## R1: foo\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-user-flow.md'),
      'Refs S99.99.99 and R1.',
    );
    const r = await checkIdConsistency(dir);
    expect(r.dangling).toContain('S99.99.99');
    expect(r.dangling).not.toContain('R1'); // R1 defined
  });

  it('runHook returns ok=true when no dangling', async () => {
    await writeFile(join(dir, 'docs/spec/03.md'), '## R1: foo');
    const r = await runHook(dir);
    expect(r.ok).toBe(true);
    expect(r.message).toContain('INV-2 OK');
  });

  it('runHook returns ok=false with details on dangling', async () => {
    await writeFile(join(dir, 'docs/spec/03.md'), '## R1: foo');
    await writeFile(join(dir, 'docs/spec/05.md'), 'Refs ENT-Bogus, NFR-PERF-99');
    const r = await runHook(dir);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('INV-2 violation');
    expect(r.message).toContain('ENT-Bogus');
    expect(r.message).toContain('NFR-PERF-99');
  });

  it('empty docs/spec → ok (no IDs to violate)', async () => {
    const r = await runHook(dir);
    expect(r.ok).toBe(true);
  });
});
