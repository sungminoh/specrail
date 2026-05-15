// TC-56: EDGE-17 DELTA zero affected phases graceful reject
// TC-35: INV-6 Change.affectedPhases
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { draftChange } from '../src/cli/change.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'change-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('change skill (T2.4, F4.3, AC-R4-1, TC-7)', () => {
  it('drafts proposal.md in changes/{date}-{slug}/', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: payment\n',
    );
    // US-T6.5 (M6): real downstream citer required after self-edge fix
    await writeFile(
      join(dir, 'docs/spec/05.md'),
      '---\nphase: 5\n---\n# Flow\nRefs R1.\n',
    );

    const r = await draftChange(dir, 'Add payment', ['R1']);

    expect(r.proposalPath).toMatch(/changes\/\d{4}-\d{2}-\d{2}-add-payment\/proposal\.md/);
    const content = await readFile(r.proposalPath, 'utf8');
    expect(content).toContain('Change Proposal: Add payment');
    expect(content).toContain('status: proposed');
  });

  it('lists affected phases from graph downstream', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: req\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-user-flow.md'),
      '---\nphase: 5\n---\n## ENT-Foo: e\nCites R1.\n',
    );

    const r = await draftChange(dir, 'Modify R1', ['R1']);
    expect(r.affectedPhases).toContain('05');
  });

  it('INV-6 throws when changed ID has zero real downstream (US-T6.5, M6)', async () => {
    // Pre-fix: heading-line self-edge spuriously satisfied INV-6.
    // Post-fix: no self-edge, so isolated ID correctly throws.
    await writeFile(
      join(dir, 'docs/spec/03.md'),
      '---\nphase: 3\n---\n## F2: Isolated\n본문 — 다른 ID 참조 없음.\n',
    );
    await expect(draftChange(dir, 'isolated change', ['F2'])).rejects.toThrow(/INV-6/);
  });

  it('handles 한국어 topic (NFR-I18N-1)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );
    // US-T6.5 (M6): real downstream citer required — self-edge no longer
    // satisfies INV-6 after heading-line citation-scan exclusion.
    await writeFile(
      join(dir, 'docs/spec/05.md'),
      '---\nphase: 5\n---\n# Flow\nRefs R1.\n',
    );

    const r = await draftChange(dir, '결제 추가', ['R1']);
    expect(r.proposalPath).toMatch(/결제-추가/);
  });

  it('kebabize empty input returns "untitled" (R3 M-Round3-6)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\nstatus: Approved\n---\n## R1: x\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05.md'),
      '---\nphase: 5\n---\n# Flow\nRefs R1.\n',
    );
    // Topic with only chars that kebabize strips
    const r = await draftChange(dir, '!!!', ['R1']);
    expect(r.proposalPath).toMatch(/untitled/);
  });

  it('kebabize Japanese topic falls back to untitled (R3 M-Round3-6)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\nstatus: Approved\n---\n## R1: x\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05.md'),
      '---\nphase: 5\n---\n# Flow\nRefs R1.\n',
    );
    const r = await draftChange(dir, '技術改善', ['R1']);
    expect(r.proposalPath).toMatch(/untitled/);
  });
});
