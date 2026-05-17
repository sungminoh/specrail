import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractDownstream } from '../src/graph/downstream.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'ds-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('downstream (F4.2, AC-R4-2, TC-8)', () => {
  it('finds direct downstream phase', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-user-flow.md'),
      '---\nphase: 5\n---\n# Flow\nRefs R1.\n',
    );

    const r = await extractDownstream(dir, ['R1']);
    expect(r.affectedPhases).toContain('05');
  });

  it('finds transitive downstream (2 hops)', async () => {
    // Phase 3 defines R1
    // Phase 5 defines SEC-1, cites R1
    // Phase 8 cites SEC-1
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: req\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-user-flow.md'),
      '---\nphase: 5\n---\n## ENT-Flow: e\nCites R1.\n',
    );
    await writeFile(
      join(dir, 'docs/spec/08-architecture.md'),
      '---\nphase: 8\n---\n# Arch\nCites ENT-Flow.\n',
    );

    const r = await extractDownstream(dir, ['R1']);
    expect(r.affectedPhases).toContain('05'); // direct
    expect(r.affectedPhases).toContain('08'); // transitive
  });

  it('empty changedIds → 0 affected', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );
    const r = await extractDownstream(dir, []);
    expect(r.affectedPhases).toEqual([]);
  });

  it('changedIds not in graph → 0 affected', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );
    const r = await extractDownstream(dir, ['R99']);
    expect(r.affectedPhases).toEqual([]);
  });
});
