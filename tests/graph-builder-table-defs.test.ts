import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';

/**
 * US-002 — table-row definition extraction via AST.
 *
 * A table counts as a definition table when EITHER its header row first
 * cell contains the word `ID` (e.g. `KPI ID`, `Spec ID`, `지표 ID`), OR
 * an HTML comment `<!-- specrail:deftable -->` immediately precedes it.
 *
 * The first cell of each body row is parsed as an ID only if the entire
 * trimmed cell text matches the ID grammar — descriptive cells like
 * `S1 Greenfield` are NOT counted as definitions.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'graph-tbl-'));
  await mkdir(join(dir, 'docs/spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function write(file: string, content: string) {
  await writeFile(join(dir, 'docs/spec', file), content, 'utf8');
}

describe('graph builder — table definition extraction (US-002)', () => {
  it('extracts defs when header column says "ID"', async () => {
    await write(
      '01-pain.md',
      [
        '---',
        'phase: 1',
        '---',
        '# Pain',
        '',
        '| Pain ID | Description |',
        '|---|---|',
        '| PAIN-1 | first pain |',
        '| PAIN-2 | second pain |',
        '| PAIN-3 | third pain |',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('PAIN-1')).toBe(true);
    expect(g.definedIds.has('PAIN-2')).toBe(true);
    expect(g.definedIds.has('PAIN-3')).toBe(true);
  });

  it('extracts defs when header column says "지표 ID" (Korean)', async () => {
    await write(
      '01-kpi.md',
      [
        '---',
        'phase: 1',
        '---',
        '',
        '| 지표 ID | 지표 | 단위 |',
        '|---|---|---|',
        '| KPI-1 | 완주율 | % |',
        '| KPI-2 | 활성화율 | % |',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('KPI-1')).toBe(true);
    expect(g.definedIds.has('KPI-2')).toBe(true);
  });

  it('extracts defs when preceded by specrail:deftable annotation', async () => {
    await write(
      '01-anno.md',
      [
        '---',
        'phase: 1',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| Name | Description |',
        '|---|---|',
        '| INV-1 | first invariant |',
        '| INV-2 | second invariant |',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('INV-1')).toBe(true);
    expect(g.definedIds.has('INV-2')).toBe(true);
  });

  it('does NOT extract defs from a plain reference table without "ID" header or annotation', async () => {
    await write(
      '01-ref.md',
      [
        '---',
        'phase: 1',
        '---',
        '',
        '| Scenario | Specs |',
        '|---|---|',
        '| S1 Greenfield (full chain) | R1, R2 |',
        '| S2 DELTA (single change) | R3 |',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    // Neither header signal nor annotation — should be NO defs from this table.
    // Specifically S1 / S2 in first cells must NOT be definitions.
    // (They appear as text and may be picked up as citations, but not defs.)
    expect(g.definedIds.has('S1')).toBe(false);
    expect(g.definedIds.has('S2')).toBe(false);
  });

  it('extracts def from ID-annotation cells (`TC-63 (NFR-SEC-12)`-style)', async () => {
    // Dogfood convention writes optional `(...)` annotations next to a
    // definition cell ID, e.g. `TC-63 (NFR-SEC-12)`. The leading token
    // is still the definition; the annotation is metadata. Cells with
    // descriptive non-ID prose (`something else`) remain non-defs.
    await write(
      '01-mixed.md',
      [
        '---',
        'phase: 1',
        '---',
        '',
        '| Pain ID | Description |',
        '|---|---|',
        '| PAIN-1 | a clean def |',
        '| PAIN-2 (deprecated) | parenthesised annotation IS a def |',
        '| something else | not ID-shaped — not a def |',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('PAIN-1')).toBe(true);
    expect(g.definedIds.has('PAIN-2')).toBe(true);
  });

  it('skips header row even when first header cell looks ID-shaped', async () => {
    // Edge case: a header cell that happens to be "ID-1" should not be a def.
    await write(
      '01-header-edge.md',
      [
        '---',
        'phase: 1',
        '---',
        '',
        '| ID | description |',
        '|---|---|',
        '| PAIN-1 | body row |',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('PAIN-1')).toBe(true);
    // The header word "ID" itself is not extracted as a def
    expect(g.definedIds.has('ID')).toBe(false);
  });
});
