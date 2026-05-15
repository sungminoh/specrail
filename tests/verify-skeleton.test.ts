// TC-53: EDGE-14 empty docs/spec directory
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify, classifyId } from '../src/verify/index.js';

/**
 * US-V01 — foundation skeleton.
 *
 * The runner walks `buildGraph` output and applies the skeleton rule
 * (NotBuilt with low confidence) for every defined ID. No real rules
 * are registered yet; subsequent stories layer them on.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-skel-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('verify() skeleton (US-V01)', () => {
  it('returns initialized=false for projects without docs/spec/', async () => {
    const r = await verify(dir, { skipTests: true });
    expect(r.initialized).toBe(false);
    expect(r.results.size).toBe(0);
    expect(typeof r.timestamp).toBe('string');
    expect(r.projectRoot).toBe(dir);
  });

  it('runner walks every defined ID and produces a result per ID', async () => {
    await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
    await writeFile(
      join(dir, 'docs', 'spec', '03-features.md'),
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: an example requirement',
        '',
        '### F1.1: an example feature',
        '',
        '#### S1.1.1: an example spec',
      ].join('\n'),
      'utf8',
    );

    const r = await verify(dir, { skipTests: true });

    expect(r.initialized).toBe(true);
    expect(r.results.size).toBeGreaterThanOrEqual(3);
    for (const ev of r.results.values()) {
      expect(ev.intent).toBe('Approved');
      // Real rules are registered now; each ID gets a typed reality
      // (Built / Partial / NotBuilt / ManualReview / ManualReview-Stale).
      expect([
        'Built',
        'Partial',
        'NotBuilt',
        'ManualReview',
        'ManualReview-Stale',
      ]).toContain(ev.reality);
    }
  });

  it('respects the filter regex', async () => {
    await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
    await writeFile(
      join(dir, 'docs', 'spec', '03-features.md'),
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: an R',
        '',
        '### F1.1: an F',
      ].join('\n'),
      'utf8',
    );

    const r = await verify(dir, { filter: /^R/ });

    for (const id of r.results.keys()) {
      expect(/^R/.test(id)).toBe(true);
    }
  });
});

describe('classifyId()', () => {
  it('classifies canonical taxonomy IDs', () => {
    expect(classifyId('AC-R1-1')).toBe('AC');
    expect(classifyId('TC-42')).toBe('TC');
    expect(classifyId('INV-3')).toBe('INV');
    expect(classifyId('EDGE-7')).toBe('EDGE');
    expect(classifyId('NFR-PERF-1')).toBe('NFR');
    expect(classifyId('NFR-SEC-COMP-1')).toBe('NFR');
    expect(classifyId('ENT-User')).toBe('ENT');
    expect(classifyId('ARCH-2')).toBe('ARCH');
    expect(classifyId('EXT-3')).toBe('EXT');
    expect(classifyId('OPS-5')).toBe('OPS');
    expect(classifyId('RB-1')).toBe('RB');
    expect(classifyId('ADR-7')).toBe('ADR');
    expect(classifyId('RISK-2')).toBe('RISK');
    expect(classifyId('KPI-1')).toBe('KPI');
    expect(classifyId('PAIN-4')).toBe('PAIN');
    expect(classifyId('OQ-1-2')).toBe('OQ');
    expect(classifyId('R1')).toBe('R');
    expect(classifyId('F1.2')).toBe('F');
    expect(classifyId('S1.2.3')).toBe('S');
    expect(classifyId('T5.1')).toBe('T');
  });

  it('returns unknown for unrecognised forms', () => {
    expect(classifyId('XYZ-99')).toBe('unknown');
    expect(classifyId('R')).toBe('unknown');
  });
});
