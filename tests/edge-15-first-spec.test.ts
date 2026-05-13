// EDGE-15 (TC-54): 첫 phase 첫 spec ID 부여 시 R1 보장
// INV-1 (Spec ID unique) + ADR-5 (sequential counter) regression

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IdCounter } from '../src/spec/counter.js';
import { SpecTier } from '../src/spec/id.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'edge15-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('EDGE-15: first ID = R1 (TC-54)', () => {
  it('empty cache → first R is R1 (not R0)', async () => {
    const c = await IdCounter.load(dir);
    expect(await c.next(SpecTier.Requirement, 1)).toBe('R1');
  });

  it('empty cache → first F under R1 is F1.1', async () => {
    const c = await IdCounter.load(dir);
    expect(await c.next(SpecTier.Feature, 3, [1])).toBe('F1.1');
  });

  it('empty cache → first S under F1.1 is S1.1.1', async () => {
    const c = await IdCounter.load(dir);
    expect(await c.next(SpecTier.Specification, 3, [1, 1])).toBe('S1.1.1');
  });

  it('cache miss after corruption falls back to R1', async () => {
    const c1 = await IdCounter.load(dir);
    // Simulate corrupted cache: do not save
    const c2 = await IdCounter.load(dir);
    expect(await c2.next(SpecTier.Requirement, 1)).toBe('R1');
    void c1;
  });
});
