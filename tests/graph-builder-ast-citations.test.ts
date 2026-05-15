import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';

/**
 * US-004 (AST citation extraction) + US-005 (ignore annotation state machine).
 *
 * Citation extraction now walks the markdown AST instead of line-regex.
 *   - text + inlineCode nodes → scanned for IDs
 *   - code (fenced) + yaml (frontmatter) nodes → never scanned
 *   - definition headings → not self-cited (INV-6 preserved)
 *   - HTML comment annotations `<!-- specrail:ignore-* -->` toggle a
 *     suppression state machine that hides citations inside their scope.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'graph-ast-cit-'));
  await mkdir(join(dir, 'docs/spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function write(file: string, content: string) {
  await writeFile(join(dir, 'docs/spec', file), content, 'utf8');
}

describe('graph builder — AST citation extraction (US-004)', () => {
  it('extracts IDs from plain prose text', async () => {
    await write('01-def.md', '---\nphase: 1\n---\n## R1: x\n');
    await write('05-cite.md', '---\nphase: 5\n---\n# Flow\nThe spec R1 is cited here.\n');

    const g = await buildGraph(dir);

    expect(g.edges.some((e) => e.from === '05' && e.to === 'R1')).toBe(true);
  });

  it('extracts IDs from inlineCode (backtick) — backtick is formatting, not illustrative', async () => {
    await write('01-def.md', '---\nphase: 1\n---\n## R1: x\n');
    await write('05-cite.md', '---\nphase: 5\n---\n# Flow\nUse the `R1` token.\n');

    const g = await buildGraph(dir);

    expect(g.edges.some((e) => e.from === '05' && e.to === 'R1')).toBe(true);
  });

  it('does NOT extract IDs from fenced code blocks (template content)', async () => {
    await write('01-def.md', '---\nphase: 1\n---\n## R1: x\n');
    await write(
      '05-cite.md',
      '---\nphase: 5\n---\n# Flow\n```\nThis fenced block mentions R1 but it is template.\n```\n',
    );

    const g = await buildGraph(dir);

    expect(g.edges.some((e) => e.from === '05' && e.to === 'R1')).toBe(false);
  });

  it('does NOT extract IDs from YAML frontmatter', async () => {
    await write('01-def.md', '---\nphase: 1\n---\n## R1: x\n');
    await write(
      '05-cite.md',
      '---\nphase: 5\nrefs: [R1]\n---\n# Flow no body citation here.\n',
    );

    const g = await buildGraph(dir);

    // R1 appears in frontmatter `refs: [R1]` but YAML is skipped.
    expect(g.edges.some((e) => e.from === '05' && e.to === 'R1')).toBe(false);
  });

  it('definition headings do not self-cite (INV-6 preserved)', async () => {
    await write('01-def.md', '---\nphase: 1\n---\n## R1: foo bar\n\nbody text.\n');

    const g = await buildGraph(dir);

    // R1 is defined here; its OWN heading line must not produce an edge
    // from '01' to 'R1' (that would be a self-edge).
    expect(g.definedIds.has('R1')).toBe(true);
    expect(g.edges.some((e) => e.from === '01' && e.to === 'R1')).toBe(false);
  });
});

describe('graph builder — ignore annotation state machine (US-005)', () => {
  it('ignore-start/ignore-end block suppresses citations inside', async () => {
    await write('01-def.md', '---\nphase: 1\n---\n## R1: x\n');
    await write(
      '05-cite.md',
      [
        '---',
        'phase: 5',
        '---',
        '# Flow',
        '',
        '<!-- specrail:ignore-start -->',
        '',
        'R1 mentioned illustratively here, do not count.',
        '',
        '<!-- specrail:ignore-end -->',
        '',
        'R1 mentioned normally here, must count.',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    const edges = g.edges.filter((e) => e.from === '05' && e.to === 'R1');
    expect(edges.length).toBe(1);
  });

  it('single-shot ignore suppresses the very next sibling only', async () => {
    await write('01-def.md', '---\nphase: 1\n---\n## R1: x\n');
    await write(
      '05-cite.md',
      [
        '---',
        'phase: 5',
        '---',
        '# Flow',
        '',
        '<!-- specrail:ignore -->',
        '',
        'R1 in this first paragraph is suppressed.',
        '',
        'R1 in this second paragraph still counts.',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    const edges = g.edges.filter((e) => e.from === '05' && e.to === 'R1');
    expect(edges.length).toBe(1);
  });

  it('ignore-start/end registers defs as illustrative (still in definedIds for INV-2, but excluded from verifier)', async () => {
    // Real semantics used by the dogfood spec (12-adr-risks.md
    // illustrative section): an ID declared inside an ignore block
    //
    //   - MUST still resolve INV-2 citations from elsewhere (otherwise
    //     every external `R0` mention would dangle), so it lives in
    //     `definedIds`.
    //   - MUST be excluded from the verifier's intent-vs-reality
    //     matrix (otherwise it's NotBuilt → false-positive lie), so
    //     it also lives in `illustrativeIds` and the runner skips it.
    //   - Citations INSIDE the block are themselves not citations
    //     (they're examples).
    await write(
      '04-mixed.md',
      [
        '---',
        'phase: 4',
        '---',
        '',
        '<!-- specrail:ignore-start -->',
        '',
        '### ENT-Stub: illustrative — referenced from elsewhere',
        '',
        'ENT-Stub mention here is suppressed (illustrative context).',
        '',
        '<!-- specrail:ignore-end -->',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    // Defined for INV-2 cross-file citation resolution.
    expect(g.definedIds.has('ENT-Stub')).toBe(true);
    // Marked illustrative so the verifier excludes it.
    expect(g.illustrativeIds.has('ENT-Stub')).toBe(true);
    // Citation inside the ignore block is still suppressed.
    expect(g.edges.some((e) => e.from === '04' && e.to === 'ENT-Stub')).toBe(false);
  });

  it('definitions OUTSIDE an ignore block are still extracted normally', async () => {
    // Regression guard: the ignore-range pre-pass must not affect
    // content outside the matched start/end pair.
    await write(
      '04-mixed.md',
      [
        '---',
        'phase: 4',
        '---',
        '',
        '<!-- specrail:ignore-start -->',
        '',
        '### ENT-Stub: illustrative',
        '',
        '<!-- specrail:ignore-end -->',
        '',
        '### ENT-Real: this one IS a real definition',
      ].join('\n'),
    );

    const g = await buildGraph(dir);
    expect(g.illustrativeIds.has('ENT-Stub')).toBe(true);
    expect(g.illustrativeIds.has('ENT-Real')).toBe(false);
    expect(g.definedIds.has('ENT-Real')).toBe(true);
  });

  it('unclosed ignore-start is a HARD ERROR (round-N P2 fix — was silent stderr)', async () => {
    // Architect round-N: leaving an unclosed `<!-- specrail:ignore-start -->`
    // used to swallow all evidence to EOF and only emit a stderr warning
    // the hook never read. Promoted to throw so commits / CI fail loud.
    await write('01-def.md', '---\nphase: 1\n---\n## R1: x\n');
    await write(
      '05-cite.md',
      [
        '---',
        'phase: 5',
        '---',
        '# Flow',
        '',
        '<!-- specrail:ignore-start -->',
        '',
        'R1 here is suppressed.',
        '',
        'R1 again here is also suppressed (no matching end).',
        '',
      ].join('\n'),
    );

    await expect(buildGraph(dir)).rejects.toThrow(
      /unclosed.*specrail:ignore-start.*05-cite\.md/,
    );
  });
});
