import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'graph-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('buildGraph (F4.1, INV-1·2, ADR-4·9, TC-7·8·31)', () => {
  it('extracts defined IDs and cross-phase edges', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n# Features\n## R1: foo\n### F1.1: bar\n',
    );
    await writeFile(
      join(dir, 'docs/spec/04-domain-model.md'),
      '---\nphase: 4\n---\n# Domain\nThis cites F1.1 and R1.\n',
    );

    const g = await buildGraph(dir);

    expect(g.nodes.map((n) => n.specId)).toEqual(expect.arrayContaining(['R1', 'F1.1']));
    expect(g.definedIds.has('R1')).toBe(true);
    const edge = g.edges.find((e) => e.from === '04' && e.to === 'F1.1');
    expect(edge).toBeDefined();
  });

  it('detects dangling citations (INV-2 violation)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-user-flow.md'),
      '---\nphase: 5\n---\n# Flow\nRefs S99.99.99 and R1.\n',
    );

    const g = await buildGraph(dir);

    expect(g.danglingCitations).toContainEqual({ from: '05', to: 'S99.99.99' });
    expect(g.danglingCitations.find((d) => d.to === 'R1')).toBeUndefined();
  });

  it('handles missing docs/spec gracefully', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'graph-empty-'));
    const g = await buildGraph(empty);
    expect(g.nodes).toEqual([]);
    expect(g.edges).toEqual([]);
    await rm(empty, { recursive: true, force: true });
  });

  it('extracts ENT/INV/NFR/ARCH/ADR definitions', async () => {
    await writeFile(
      join(dir, 'docs/spec/04-domain-model.md'),
      '---\nphase: 4\n---\n### ENT-Foo: x\n### INV-1: y\n### NFR-PERF-1: z\n### ARCH-2: w\n### ADR-7: q\n',
    );
    const g = await buildGraph(dir);
    expect([...g.definedIds]).toEqual(
      expect.arrayContaining(['ENT-Foo', 'INV-1', 'NFR-PERF-1', 'ARCH-2', 'ADR-7']),
    );
  });

  it('preserves heading line position', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n\n# Features\n\n## R1: foo\n\n### F1.1: bar\n',
    );
    const g = await buildGraph(dir);
    const r1 = g.nodes.find((n) => n.specId === 'R1');
    expect(r1?.definedAt.line).toBeGreaterThan(0);
  });

  it('handles 한국어 mixed body (NFR-I18N-1)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: 한국어 spec\n### F1.1: 한자 처리\n본문 한국어 + R1 인용\n',
    );
    const g = await buildGraph(dir);
    expect(g.definedIds.has('R1')).toBe(true);
    expect(g.definedIds.has('F1.1')).toBe(true);
  });
});
