import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IdCounter } from '../src/spec/counter.js';
import { SpecTier } from '../src/spec/id.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'idc-'));
});

describe('IdCounter (F1.3, AC-R1-3, ADR-5, INV-1, TC-3, TC-30)', () => {
  it('issues sequential R IDs', async () => {
    const c = await IdCounter.load(dir);
    expect(await c.next(SpecTier.Requirement, 1)).toBe('R1');
    expect(await c.next(SpecTier.Requirement, 1)).toBe('R2');
    expect(await c.next(SpecTier.Requirement, 1)).toBe('R3');
  });

  it('issues F per parent R', async () => {
    const c = await IdCounter.load(dir);
    expect(await c.next(SpecTier.Feature, 3, [1])).toBe('F1.1');
    expect(await c.next(SpecTier.Feature, 3, [1])).toBe('F1.2');
    expect(await c.next(SpecTier.Feature, 3, [2])).toBe('F2.1');
  });

  it('issues S per parent F', async () => {
    const c = await IdCounter.load(dir);
    expect(await c.next(SpecTier.Specification, 3, [1, 1])).toBe('S1.1.1');
    expect(await c.next(SpecTier.Specification, 3, [1, 1])).toBe('S1.1.2');
    expect(await c.next(SpecTier.Specification, 3, [1, 2])).toBe('S1.2.1');
  });

  it('persists across loads (INV-1)', async () => {
    const c1 = await IdCounter.load(dir);
    await c1.next(SpecTier.Requirement, 1);
    await c1.save();

    const c2 = await IdCounter.load(dir);
    expect(await c2.next(SpecTier.Requirement, 1)).toBe('R2');
  });

  it('F without parent throws', async () => {
    const c = await IdCounter.load(dir);
    await expect(c.next(SpecTier.Feature, 3, [])).rejects.toThrow(/parent R/);
  });

  it('S without 2 parents throws', async () => {
    const c = await IdCounter.load(dir);
    await expect(c.next(SpecTier.Specification, 3, [1])).rejects.toThrow(/parent R and F/);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });
});

import { afterEach } from 'vitest';
