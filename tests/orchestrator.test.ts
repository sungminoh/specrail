import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { issueId, _resetCounterCache } from '../src/skill/orchestrator.js';
import { SpecTier } from '../src/spec/id.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'orchestrator-'));
  _resetCounterCache();
});

afterEach(async () => {
  _resetCounterCache();
  await rm(dir, { recursive: true, force: true });
});

describe('issueId orchestrator (US-T5.3, M5)', () => {
  it('issues R IDs sequentially', async () => {
    const r1 = await issueId(dir, SpecTier.Requirement, 1);
    const r2 = await issueId(dir, SpecTier.Requirement, 1);
    expect(r1).toBe('R1');
    expect(r2).toBe('R2');
  });

  it('issues F IDs with parent R index', async () => {
    const f1 = await issueId(dir, SpecTier.Feature, 1, [1]);
    const f2 = await issueId(dir, SpecTier.Feature, 1, [1]);
    expect(f1).toBe('F1.1');
    expect(f2).toBe('F1.2');
  });

  it('issues S IDs with parent R and F indices', async () => {
    const s1 = await issueId(dir, SpecTier.Specification, 1, [1, 1]);
    const s2 = await issueId(dir, SpecTier.Specification, 1, [1, 1]);
    expect(s1).toBe('S1.1.1');
    expect(s2).toBe('S1.1.2');
  });

  it('5 concurrent issueId calls produce 5 unique IDs', async () => {
    const results = await Promise.all([
      issueId(dir, SpecTier.Requirement, 1),
      issueId(dir, SpecTier.Requirement, 1),
      issueId(dir, SpecTier.Requirement, 1),
      issueId(dir, SpecTier.Requirement, 1),
      issueId(dir, SpecTier.Requirement, 1),
    ]);
    const unique = new Set(results);
    expect(unique.size).toBe(5);
    // All must be valid R IDs
    for (const id of results) {
      expect(id).toMatch(/^R\d+$/);
    }
  });

  it('persists counter state across cache reset (process restart simulation)', async () => {
    // First "process" issues some IDs
    const r1 = await issueId(dir, SpecTier.Requirement, 1);
    const r2 = await issueId(dir, SpecTier.Requirement, 1);
    expect(r1).toBe('R1');
    expect(r2).toBe('R2');

    // Simulate process restart: reset in-memory cache, reload from disk
    _resetCounterCache();

    // Next ID should continue from N+1
    const r3 = await issueId(dir, SpecTier.Requirement, 1);
    expect(r3).toBe('R3');
  });

  it('different projectRoots maintain independent counters', async () => {
    const dir2 = await mkdtemp(join(tmpdir(), 'orchestrator-b-'));
    try {
      const a1 = await issueId(dir, SpecTier.Requirement, 1);
      const b1 = await issueId(dir2, SpecTier.Requirement, 1);
      expect(a1).toBe('R1');
      expect(b1).toBe('R1');
    } finally {
      await rm(dir2, { recursive: true, force: true });
    }
  });
});
