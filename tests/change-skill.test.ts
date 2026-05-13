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

  it('handles 한국어 topic (NFR-I18N-1)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03.md'),
      '---\nphase: 3\n---\n## R1: foo\n',
    );

    const r = await draftChange(dir, '결제 추가', ['R1']);
    expect(r.proposalPath).toMatch(/결제-추가/);
  });
});
