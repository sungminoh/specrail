import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';

/**
 * US-003 — bold-prefix list item definition extraction via AST.
 *
 * Pattern: `- **AC-R1-1:** GIVEN x WHEN y THEN z` defines `AC-R1-1`.
 * The strong (bold) child must come first inside the list-item's
 * paragraph and its text must match the `ID:` heading-definition shape.
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'graph-bold-'));
  await mkdir(join(dir, 'docs/spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function write(file: string, content: string) {
  await writeFile(join(dir, 'docs/spec', file), content, 'utf8');
}

describe('graph builder — bold-prefix list item definitions (US-003)', () => {
  it('extracts AC-R{n}-{m} from a GIVEN/WHEN/THEN bullet', async () => {
    await write(
      '03-ac.md',
      [
        '---',
        'phase: 3',
        '---',
        '',
        '- **AC-R1-1:** GIVEN a project WHEN lint runs THEN all checks pass',
        '- **AC-R1-2:** GIVEN a spec WHEN coverage checked THEN result returned',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('AC-R1-1')).toBe(true);
    expect(g.definedIds.has('AC-R1-2')).toBe(true);
  });

  it('extracts INV-{n} from a bold-prefix bullet', async () => {
    await write(
      '04-inv.md',
      [
        '---',
        'phase: 4',
        '---',
        '',
        '- **INV-3:** rule body — uniqueness across spec IDs',
        '- **INV-4:** referential integrity for ENT-* citations',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('INV-3')).toBe(true);
    expect(g.definedIds.has('INV-4')).toBe(true);
  });

  it('does NOT extract from a bullet whose strong child is not an ID prefix', async () => {
    await write(
      '03-noid.md',
      [
        '---',
        'phase: 3',
        '---',
        '',
        '- **Some heading:** body text',
        '- **Another note:** more body',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.size).toBe(0);
  });

  it('does NOT extract when the ID appears without strong wrapper', async () => {
    // No `**...**` — the heading extractor would not pick this up either,
    // and neither should the bold-prefix extractor.
    await write(
      '03-plain.md',
      [
        '---',
        'phase: 3',
        '---',
        '',
        '- AC-R1-1: GIVEN ... WHEN ... THEN ...',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('AC-R1-1')).toBe(false);
  });

  it('only triggers when strong is the FIRST child of the bullet paragraph', async () => {
    await write(
      '03-firstchild.md',
      [
        '---',
        'phase: 3',
        '---',
        '',
        '- prefix text **AC-R1-1:** trailing body',
        '',
      ].join('\n'),
    );

    const g = await buildGraph(dir);

    // Strong is NOT the first child — first child is the leading text node.
    expect(g.definedIds.has('AC-R1-1')).toBe(false);
  });
});
