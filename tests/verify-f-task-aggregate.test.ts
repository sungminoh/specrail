import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';
import { _clearFTaskMapCache } from '../src/verify/id-rules/f-task-aggregate.js';

/**
 * F-task-aggregate rule tests (round-N+1 architect BLOCKED: ship dedicated
 * tests). The rule scans Phase-13 `#### TX.Y:` headings for F citations,
 * builds a reverse map, and rolls F-tier reality up over those tasks.
 *
 * Architect attack vectors specifically covered:
 *   - dot-list shorthand `F8.1·8.2` must expand to both Fs
 *   - F not cited by any task → ManualReview (not NotBuilt)
 *   - missing 13-implementation-plan.md → all Fs ManualReview
 *   - multiple T-tasks cite same F → aggregation rolls up
 *   - F citation in task body (not heading) — NOT captured (documented gap)
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-f-task-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  _clearFTaskMapCache(); // module-level cache from prior test contaminates
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('f-task-aggregate rule', () => {
  it('Built when a single task heading cites the F via comma', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'real.ts'), '// ok', 'utf8');
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: req',
        '',
        '### F1.1: feature',
      ].join('\n'),
    );
    await writeSpec(
      '13-implementation-plan.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '#### T1.4: real task — F1.1, AC-R1-1',
        '',
        'Files: `src/real.ts`.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('F1.1');
    expect(ev?.reality).toBe('Built');
    expect(ev?.rule).toBe('f-task-aggregate');
  });

  it('dot-list shorthand F8.1·8.2 credits BOTH F8.1 and F8.2 (architect BLOCKED fix)', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'real.ts'), '// ok', 'utf8');
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R8: req',
        '',
        '### F8.1: feature A',
        '### F8.2: feature B',
      ].join('\n'),
    );
    await writeSpec(
      '13-implementation-plan.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '#### T3.4: CC Agent wrapper — F8.1·8.2, AC-R8-1, TC-18',
        '',
        'Files: `src/real.ts`.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('F8.1')?.reality).toBe('Built');
    expect(r.results.get('F8.2')?.reality).toBe('Built');
  });

  it('ManualReview when no task heading cites this F', async () => {
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R5: req',
        '',
        '### F5.99: orphan feature with no tasks',
      ].join('\n'),
    );
    await writeSpec(
      '13-implementation-plan.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '#### T1.1: unrelated task — F1.1',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('F5.99');
    expect(ev?.reality).toBe('ManualReview');
    expect(ev?.evidence[0]?.kind).toBe('no-task-citation');
  });

  it('ManualReview when 13-implementation-plan.md is missing entirely', async () => {
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R1: req',
        '',
        '### F1.1: orphan',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('F1.1')?.reality).toBe('ManualReview');
    expect(r.results.get('F1.1')?.evidence[0]?.kind).toBe('no-task-citation');
  });

  it('aggregates over multiple T-tasks citing the same F', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'a.ts'), '// ok', 'utf8');
    await writeFile(join(dir, 'src', 'b.ts'), '// ok', 'utf8');
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R2: req',
        '',
        '### F2.1: feature with two tasks',
      ].join('\n'),
    );
    await writeSpec(
      '13-implementation-plan.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '#### T1.1: first task — F2.1',
        '',
        'Files: `src/a.ts`.',
        '',
        '#### T1.2: second task — F2.1',
        '',
        'Files: `src/b.ts`.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('F2.1')?.reality).toBe('Built');
  });

  it('NotBuilt propagation when cited tasks are themselves NotBuilt', async () => {
    await writeSpec(
      '03-features.md',
      [
        '---',
        'phase: 3',
        'status: Approved',
        '---',
        '',
        '## R6: req',
        '',
        '### F6.1: feature whose task points at missing file',
      ].join('\n'),
    );
    await writeSpec(
      '13-implementation-plan.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '#### T6.1: task referring missing — F6.1',
        '',
        'Files: `src/never/exists.ts`.',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    expect(r.results.get('F6.1')?.reality).toBe('NotBuilt');
  });
});
