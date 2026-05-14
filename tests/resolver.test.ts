import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getValidIds, isDefined, matchesTier } from '../src/spec/resolver.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'res-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('ID resolver stub (F1.4, AC-R1-2, TC-2)', () => {
  it('extracts R/F/S definitions from headings', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: foo\n### F1.1: bar\n#### S1.1.1: baz\n',
    );
    const r = await getValidIds(dir);
    expect(r.ids).toContain('R1');
    expect(r.ids).toContain('F1.1');
    expect(r.ids).toContain('S1.1.1');
  });

  it('extracts ENT/INV/NFR/ADR definitions', async () => {
    await writeFile(
      join(dir, 'docs/spec/04-domain-model.md'),
      '---\nphase: 4\n---\n### ENT-Foo: bar\n### INV-1: rule\n### NFR-PERF-1: target\n### ADR-7: choice\n',
    );
    const r = await getValidIds(dir);
    expect(r.ids).toEqual(expect.arrayContaining(['ENT-Foo', 'INV-1', 'NFR-PERF-1', 'ADR-7']));
  });

  it('filters by tier R', async () => {
    await writeFile(
      join(dir, 'docs/spec/03.md'),
      '## R1: foo\n## R2: bar\n### F1.1: feat\n',
    );
    const r = await getValidIds(dir, 'R');
    expect(r.ids).toEqual(['R1', 'R2']);
  });

  it('returns empty when docs/spec missing', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'res-empty-'));
    const r = await getValidIds(empty);
    expect(r.ids).toEqual([]);
    await rm(empty, { recursive: true, force: true });
  });

  it('isDefined returns true for existing ID', async () => {
    await writeFile(join(dir, 'docs/spec/03.md'), '## R1: foo\n');
    expect(await isDefined(dir, 'R1')).toBe(true);
    expect(await isDefined(dir, 'R99')).toBe(false);
  });
});

describe('matchesTier strict (R2-M4)', () => {
  it('"TC" does not match "TCP-server" (R2-M4)', () => {
    expect(matchesTier('TCP-server', 'TC')).toBe(false);
    expect(matchesTier('TC-1', 'TC')).toBe(true);
  });

  it('"R" matches "R1" but not "RACE-1" (R2-M4)', () => {
    expect(matchesTier('R1', 'R')).toBe(true);
    expect(matchesTier('RACE-1', 'R')).toBe(false);
  });

  it('"ADR" matches "ADR-7" but not "ADRC-1" (R2-M4)', () => {
    expect(matchesTier('ADR-7', 'ADR')).toBe(true);
    expect(matchesTier('ADRC-1', 'ADR')).toBe(false);
  });
});
