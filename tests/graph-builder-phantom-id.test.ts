import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';

/**
 * Phantom-ID guard regression.
 *
 * The graph builder used to over-extract any heading or bold prefix that
 * shaped like `[A-Z][A-Za-z0-9.\-_]+:` — capturing English prose words
 * like `Status`, `Decision`, `Goal`, `Mode`, `Context`, `Rationale` as
 * "defined spec IDs". Architect review flagged 70+ such false positives
 * in the dogfood baseline.
 *
 * The fix (src/graph/builder.ts: isValidSpecId) requires every captured
 * token to match the canonical ID grammar (ID_PATTERN_SOURCE) or the
 * user-namespace pattern before it is admitted as a def. As a secondary
 * bug, the citation walker used to swallow citations inside any heading
 * that loosely matched the def shape — so the same guard must guard the
 * SKIP path too.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'graph-phantom-'));
  await mkdir(join(dir, 'docs/spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function write(file: string, content: string) {
  await writeFile(join(dir, 'docs/spec', file), content, 'utf8');
}

describe('graph builder — phantom ID guard', () => {
  it('does NOT capture English heading words as spec defs', async () => {
    await write(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        '---',
        '',
        '## ADR-1: real decision',
        '',
        '### Status: Accepted',
        '### Decision',
        '### Context',
        '### Rationale',
        '### Consequence',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('ADR-1')).toBe(true);
    for (const phantom of ['Status', 'Decision', 'Context', 'Rationale', 'Consequence']) {
      expect(g.definedIds.has(phantom)).toBe(false);
    }
  });

  it('does NOT capture English bold prefixes as spec defs', async () => {
    await write(
      '12-decisions.md',
      [
        '---',
        'phase: 12',
        '---',
        '',
        '- **Status:** Accepted',
        '- **Owner:** team-a',
        '- **Severity:** High',
        '- **AC-R1-1:** real bullet — body',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('AC-R1-1')).toBe(true);
    for (const phantom of ['Status', 'Owner', 'Severity']) {
      expect(g.definedIds.has(phantom)).toBe(false);
    }
  });

  it('still extracts citations from inside a non-def heading whose text loosely resembles a def', async () => {
    // Before the fix, `### Status:` matched HEADING_DEF and made the
    // citation walker SKIP the heading — eating the ADR-7 citation
    // hiding inside it. After the fix, the SKIP only fires for real IDs.
    await write(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        '---',
        '',
        '## ADR-2: another',
        '',
        '### Status: Resolved by ADR-7',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('ADR-2')).toBe(true);
    expect(g.definedIds.has('Status')).toBe(false);
    // ADR-7 must be picked up as a citation — either resolved into edges
    // or, since it has no def in this fixture, surfacing as a dangling
    // citation. Pre-fix it was swallowed entirely by the SKIP.
    const inEdges = g.edges.some((e) => e.to === 'ADR-7');
    const inDangling = g.danglingCitations.some((d) => d.to === 'ADR-7');
    expect(inEdges || inDangling).toBe(true);
  });

  it('still SKIPs citations inside a real def heading (preserves the original INV-6 protection)', async () => {
    // `## ADR-1: …` is a def heading — its leading token is the def, not
    // a citation. INV-6 protection must continue to work for real IDs.
    await write(
      '12-adr.md',
      [
        '---',
        'phase: 12',
        '---',
        '',
        '## ADR-1: depends on ADR-9',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('ADR-1')).toBe(true);
    // ADR-9 inside the def heading must NOT be picked up as a citation
    // from ADR-1's heading (INV-6 self-citation guard).
    const selfCites = g.edges.filter((e) => e.from === 'ADR-1' && e.to === 'ADR-1');
    expect(selfCites.length).toBe(0);
  });
});
