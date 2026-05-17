import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';

/**
 * US-006 — recursive subdirectory scan.
 *
 * NN-prefixed subdirectories under docs/spec/ are descended one level
 * deep. All `*.md` files inside inherit the directory's NN as their
 * phase id. Flat top-level NN-prefixed files keep working as before.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'graph-recursive-'));
  await mkdir(join(dir, 'docs/spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('graph builder — recursive subdirectory scan (US-006)', () => {
  it('discovers ADR files inside docs/spec/12-adr-risks/', async () => {
    await mkdir(join(dir, 'docs/spec/12-adr-risks'), { recursive: true });
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\n---\nThe decision ADR-1 governs storage choice.\n',
      'utf8',
    );
    await writeFile(
      join(dir, 'docs/spec/12-adr-risks/ADR-1-storage.md'),
      '---\nphase: 12\n---\n## ADR-1: storage choice\n\nbody\n',
      'utf8',
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('ADR-1')).toBe(true);
    // The citation from 01-prd.md to ADR-1 is now a valid edge, not dangling
    expect(g.edges.some((e) => e.from === '01' && e.to === 'ADR-1')).toBe(true);
    expect(g.danglingCitations.find((d) => d.to === 'ADR-1')).toBeUndefined();
  });

  it('uses parent directory NN as phase id, not the file name', async () => {
    await mkdir(join(dir, 'docs/spec/12-adr-risks'), { recursive: true });
    // File name does NOT have NN prefix
    await writeFile(
      join(dir, 'docs/spec/12-adr-risks/ADR-7-something.md'),
      '---\nphase: 12\n---\n## ADR-7: a topic\n',
      'utf8',
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('ADR-7')).toBe(true);
    expect(g.nodes.find((n) => n.specId === 'ADR-7')?.phaseId).toBe('12');
  });

  it('still works for flat top-level files', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\n---\n## R1: x\n',
      'utf8',
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('R1')).toBe(true);
    expect(g.initialized).toBe(true);
  });

  it('does NOT descend into directories without an NN prefix', async () => {
    await mkdir(join(dir, 'docs/spec/notes'), { recursive: true });
    await writeFile(
      join(dir, 'docs/spec/notes/ADR-99-stray.md'),
      '---\nphase: 99\n---\n## ADR-99: stray\n',
      'utf8',
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('ADR-99')).toBe(false);
  });
});
