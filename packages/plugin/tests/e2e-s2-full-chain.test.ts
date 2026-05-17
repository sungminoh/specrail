// M7 polish (architect APPROVE follow-up) — S2 DELTA full chain e2e
// draftChange → invokeDeltaChain → mergeChange → archiveChange in one scenario.
//
// architect 검수에서 "한 가지 e2e gap (운영 risk): 어떤 자동 테스트도
// 4단계를 한 시나리오에서 순차 실행하지 않음" — close.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm, stat, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  draftChange,
  invokeDeltaChain,
  mergeChange,
  archiveChange,
} from '../src/cli/change.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'e2e-s2-chain-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  // Seed two phases — R1 defined in 03, cited in 05.
  await writeFile(
    join(dir, 'docs/spec/03-features.md'),
    '---\nphase: 3\nstatus: Approved\n---\n## R1: payment capability\n',
  );
  await writeFile(
    join(dir, 'docs/spec/05-user-flow.md'),
    '---\nphase: 5\nstatus: Approved\n---\n## ENT-Pay: flow\nCites R1 in body.\n',
  );
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('S2 DELTA full chain e2e — draft → chain → merge → archive', () => {
  it('runs all 4 stages sequentially in one scenario (architect-flagged gap)', async () => {
    // Stage 1 — draftChange
    const proposal = await draftChange(dir, 'tweak payment', ['R1']);
    expect(proposal.affectedPhases).toContain('05');
    expect(proposal.affectedIds).toEqual(expect.arrayContaining(['R1']));
    const changeDir = join(dir, 'docs/spec/changes', `${proposal.date}-tweak-payment`);
    expect((await stat(proposal.proposalPath)).isFile()).toBe(true);

    // Stage 2 — invokeDeltaChain
    const chain = await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: proposal.affectedPhases, affectedIds: proposal.affectedIds },
      ['R1'],
    );
    expect(chain.created).toBe(1);
    expect(chain.deltas).toHaveLength(1);
    const deltaFile = chain.deltas[0];
    // Populate delta with content so merge has something to copy
    const original = await readFile(deltaFile, 'utf8');
    await writeFile(
      deltaFile,
      original.replace(
        '## MODIFIED\n- (작성 필요)',
        '## MODIFIED\n- ENT-Pay: now cites R1.v2',
      ),
    );

    // Stage 3 — mergeChange (passes schema + INV-2 hook gate)
    const merge = await mergeChange(dir, changeDir);
    expect(merge.merged).toBe(true);
    expect(merge.phases).toEqual(['05']);
    const merged = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    expect(merged).toContain('## DELTA — ');
    expect(merged).toContain('ENT-Pay: now cites R1.v2');
    expect(merged).toContain('## ENT-Pay: flow'); // original preserved

    // proposal.md status flipped to applied
    const proposalAfter = await readFile(proposal.proposalPath, 'utf8');
    expect(proposalAfter).toMatch(/status: applied/);

    // Stage 4 — archiveChange
    const arch = await archiveChange(dir, changeDir);
    expect(arch.archived).toBe(true);
    expect(arch.archivePath).toMatch(/changes\/archive\//);
    // Source gone
    await expect(stat(changeDir)).rejects.toThrow();
    // Destination has files
    const archived = await readdir(arch.archivePath);
    expect(archived).toContain('proposal.md');
    expect(archived).toContain('deltas');
    // proposal frontmatter now archived
    const archProposal = await readFile(join(arch.archivePath, 'proposal.md'), 'utf8');
    expect(archProposal).toMatch(/status: archived/);
  });

  it('full chain is idempotent end-to-end (replay each stage = no-op)', async () => {
    const proposal = await draftChange(dir, 'idempotent test', ['R1']);
    const changeDir = join(dir, 'docs/spec/changes', `${proposal.date}-idempotent-test`);
    await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: proposal.affectedPhases, affectedIds: proposal.affectedIds },
      ['R1'],
    );
    const deltaFile = (await readdir(join(changeDir, 'deltas')))[0];
    const deltaPath = join(changeDir, 'deltas', deltaFile);
    const original = await readFile(deltaPath, 'utf8');
    await writeFile(
      deltaPath,
      original.replace('## ADDED\n- (작성 필요)', '## ADDED\n- ENT-New: novel'),
    );

    // Replay chain — created should be 0 (delta file exists)
    const chain2 = await invokeDeltaChain(
      dir,
      changeDir,
      { affectedPhases: proposal.affectedPhases, affectedIds: proposal.affectedIds },
      ['R1'],
    );
    expect(chain2.created).toBe(0);

    await mergeChange(dir, changeDir);
    // Replay merge — no-op
    const merge2 = await mergeChange(dir, changeDir);
    expect(merge2.merged).toBe(false);
    expect(merge2.message).toMatch(/Already applied/);
    // DELTA section appears exactly once
    const cur = await readFile(join(dir, 'docs/spec/05-user-flow.md'), 'utf8');
    const deltaHeaders = cur.match(/## DELTA — /g) ?? [];
    expect(deltaHeaders).toHaveLength(1);

    await archiveChange(dir, changeDir);
    // Replay archive — destination exists, source absent: idempotent
    const ghostChangeDir = join(dir, 'docs/spec/changes', `${proposal.date}-idempotent-test`);
    const arch2 = await archiveChange(dir, ghostChangeDir);
    expect(arch2.archived).toBe(false);
  });
});
