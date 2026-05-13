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

  it('returns initialized=false when docs/spec missing (US-T6.3, M6)', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'graph-uninit-'));
    const g = await buildGraph(empty);
    expect(g.initialized).toBe(false);
    expect(g.nodes).toEqual([]);
    await rm(empty, { recursive: true, force: true });
  });

  it('returns initialized=true when docs/spec exists but empty (US-T6.3, M6)', async () => {
    // beforeEach already created docs/spec dir — no files
    const g = await buildGraph(dir);
    expect(g.initialized).toBe(true);
    expect(g.nodes).toEqual([]);
  });

  it('excludes heading line from citation scan — no self-edge (US-T6.5, M6)', async () => {
    // 'F2: Isolated' heading defines F2; body contains no other F2 references.
    // Without the fix, the heading line itself contributed a self-edge,
    // letting INV-6 incorrectly count downstream impact.
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## F2: Isolated\n본문 — 다른 ID 참조 없음.\n',
    );
    const g = await buildGraph(dir);
    expect(g.definedIds.has('F2')).toBe(true);
    // No edge should reference F2 (heading line excluded, body has no F2)
    const f2Edges = g.edges.filter((e) => e.to === 'F2');
    expect(f2Edges).toEqual([]);
  });

  it('detects dangling user-defined namespace IDs (US-T6.4, M6)', async () => {
    // GHOST-999 fits the user namespace shape but is never defined.
    // Pre-fix: silently passed as 'not an ID'. Post-fix: flagged dangling.
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-user-flow.md'),
      '---\nphase: 5\n---\n# Flow\nRefs GHOST-999 and R1.\n',
    );
    const g = await buildGraph(dir);
    expect(g.danglingCitations).toContainEqual({ from: '05', to: 'GHOST-999' });
  });

  it('matches user-defined namespace when defined (US-T6.4, M6)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## PAY-12: payment capability\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05.md'),
      '---\nphase: 5\n---\n# Flow\nCites PAY-12.\n',
    );
    const g = await buildGraph(dir);
    expect(g.definedIds.has('PAY-12')).toBe(true);
    expect(g.edges.find((e) => e.from === '05' && e.to === 'PAY-12')).toBeDefined();
    expect(g.danglingCitations.find((d) => d.to === 'PAY-12')).toBeUndefined();
  });

  it('ignores HTTP-style reserved words — no false dangling (US-T6.4, M6)', async () => {
    // HTTP-200, GET-401, POST-500 all match user namespace shape but
    // must not register as spec citations.
    await writeFile(
      join(dir, 'docs/spec/03.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05.md'),
      '---\nphase: 5\n---\n# Flow\nReturns HTTP-200, GET-401, POST-500, DELETE-204, PUT-200, HEAD-404, OPTIONS-200, PATCH-204, HTTPS-301.\n',
    );
    const g = await buildGraph(dir);
    const reservedHits = g.danglingCitations.filter((d) =>
      /^(HTTP|HTTPS|GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|CONNECT|TRACE)-/.test(d.to),
    );
    expect(reservedHits).toEqual([]);
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
