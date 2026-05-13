// T4.5 E2E S1 + S2 시나리오 + INV-4 검증
// TC-12·13·33, reviewer H6
// PRD §3.3 전체 시나리오 커버

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrap } from '../src/cli/install.js';
import { draftChange } from '../src/cli/change.js';
import { canInvokePhase } from '../src/skill/gate.js';
import { buildGraph } from '../src/graph/builder.js';
import { runHook as runIdHook } from '../src/hook/id-consistency.js';
import { PhaseStatus } from '../src/state/machine.js';

// 13 phase 파일명 순서 (01 ~ 13)
const PHASE_NAMES = [
  '01-prd',
  '02-personas-journey',
  '03-features',
  '04-domain-model',
  '05-user-flow',
  '06-information-architecture',
  '07-wireframe',
  '08-system-architecture',
  '09-non-functional-requirements',
  '10-test-strategy',
  '11-operations',
  '12-adr-risks',
  '13-implementation-plan',
];

/**
 * phase N의 spec 파일을 지정된 status로 작성 (또는 덮어쓰기).
 * body 생략 시 최소 placeholder.
 */
async function simulatePhase(
  dir: string,
  phaseNum: number,
  status: PhaseStatus,
  body = '',
): Promise<void> {
  const name = PHASE_NAMES[phaseNum - 1];
  const path = join(dir, 'docs', 'spec', `${name}.md`);
  await writeFile(
    path,
    `---\nphase: ${phaseNum}\nstatus: ${status}\n---\n# Phase ${phaseNum}\n${body}\n`,
  );
}

/**
 * INV-4 P0 coverage용: 모든 P0 requirement ID를 정의하고 교차 인용하는
 * 최소 spec 세트를 docs/spec/ 에 작성한다.
 * P0 IDs: R1, R2, R4, R5, R6, R7, R8, R13
 */
async function writeInv4Specs(dir: string): Promise<void> {
  const specDir = join(dir, 'docs', 'spec');

  // Phase 3 (features): R1·R2·R4·R5·R6·R7·R8·R13 정의 + 상호 인용
  await writeFile(
    join(specDir, '03-features.md'),
    [
      '---',
      'phase: 3',
      'status: Approved',
      '---',
      '',
      '## R1: 사용자 인증',
      'R2, R4를 만족해야 한다.',
      '',
      '## R2: 권한 관리',
      'R1과 연동. R5, R6 참조.',
      '',
      '## R4: 결제 기능',
      'R1 인증 후 결제. R7, R8 참조.',
      '',
      '## R5: 알림',
      'R2 권한 기반. R13 참조.',
      '',
      '## R6: 검색',
      'R2 권한 기반.',
      '',
      '## R7: 통계',
      'R4 결제 데이터 기반.',
      '',
      '## R8: 관리자',
      'R1, R2, R4 관리.',
      '',
      '## R13: 감사 로그',
      'R1, R5 이벤트 기록.',
    ].join('\n'),
  );

  // Phase 8 (system-architecture): 위 IDs 교차 인용
  await writeFile(
    join(specDir, '08-system-architecture.md'),
    [
      '---',
      'phase: 8',
      'status: Approved',
      '---',
      '',
      '# System Architecture',
      '',
      'R1, R2, R4, R5, R6, R7, R8, R13 모두 반영한 아키텍처.',
    ].join('\n'),
  );
}

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'e2e-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('T4.5 E2E S1+S2 + INV-4 (TC-12·13·33, reviewer H6)', () => {
  it(
    'S1 Greenfield: bootstrap → 13 phase Approved',
    async () => {
      // 1. bootstrap: docs/spec + phase 1 placeholder 생성
      const result = await bootstrap(dir);
      expect(result.created).toBe(true);
      expect(result.specDir).toContain('docs');

      // 2. Phase 1~13 모두 Approved로 시뮬 (bootstrap이 01-prd.md 생성하므로 덮어씀)
      for (let i = 1; i <= 13; i++) {
        await simulatePhase(dir, i, PhaseStatus.Approved);
      }

      // 3. 모든 phase 파일이 status: Approved 포함 검증
      for (let i = 1; i <= 13; i++) {
        const name = PHASE_NAMES[i - 1];
        const content = await readFile(join(dir, 'docs', 'spec', `${name}.md`), 'utf8');
        expect(content).toContain('status: Approved');
      }

      // 4. Phase 14는 gate에서 block (range 초과)
      const gate14 = await canInvokePhase(dir, 14);
      expect(gate14.allowed).toBe(false);
    },
    30_000,
  );

  it(
    'S1 transition gate: Phase 6 blocked when Phase 5 Draft',
    async () => {
      await bootstrap(dir);

      // Phase 1~4 Approved, Phase 5 Draft
      for (let i = 1; i <= 4; i++) {
        await simulatePhase(dir, i, PhaseStatus.Approved);
      }
      await simulatePhase(dir, 5, PhaseStatus.Draft);

      // Phase 6 invoke → blocked (Phase 5 not Approved)
      const r = await canInvokePhase(dir, 6);
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain('Draft');

      // Phase 5 → Approved 후에는 Phase 6 allowed
      await simulatePhase(dir, 5, PhaseStatus.Approved);
      const r2 = await canInvokePhase(dir, 6);
      expect(r2.allowed).toBe(true);
    },
    30_000,
  );

  it(
    'S2 DELTA: S1 완료 후 change → 영향 phase 추출 + proposal.md 생성',
    async () => {
      // S1: 모든 phase Approved
      await bootstrap(dir);
      for (let i = 1; i <= 13; i++) {
        await simulatePhase(dir, i, PhaseStatus.Approved);
      }

      // Phase 3에 R1 정의, Phase 8에 R1 인용 → downstream = phase 08
      const specDir = join(dir, 'docs', 'spec');
      await writeFile(
        join(specDir, '03-features.md'),
        '---\nphase: 3\nstatus: Approved\n---\n\n## R1: 결제 기능\nCore payment requirement.\n',
      );
      await writeFile(
        join(specDir, '08-system-architecture.md'),
        '---\nphase: 8\nstatus: Approved\n---\n\n# Architecture\nSee R1 for core requirement.\n',
      );

      // S2 DELTA: add payment 변경 제안, R1 변경
      const proposal = await draftChange(dir, 'add payment', ['R1']);

      // proposal.md 파일 생성 확인
      const proposalContent = await readFile(proposal.proposalPath, 'utf8');
      expect(proposalContent).toContain('add payment');
      expect(proposalContent).toContain('R1');
      expect(proposalContent).toContain('proposed');

      // 영향 phase 추출: R1을 인용한 phase 08이 포함되어야 함
      expect(proposal.affectedPhases).toContain('08');

      // proposal 경로가 changes/ 하위에 생성됨
      expect(proposal.proposalPath).toContain('changes');
      expect(proposal.proposalPath).toContain('proposal.md');
    },
    30_000,
  );

  it(
    'S2 INV-2 enforce: dangling citation 있는 delta → id-consistency hook block',
    async () => {
      // S1: 모든 phase Approved
      await bootstrap(dir);
      for (let i = 1; i <= 13; i++) {
        await simulatePhase(dir, i, PhaseStatus.Approved);
      }

      // Delta 파일: 존재하지 않는 ID S99 인용 (dangling)
      const specDir = join(dir, 'docs', 'spec');
      await writeFile(
        join(specDir, '05-user-flow.md'),
        '---\nphase: 5\nstatus: Draft\n---\n\n# User Flow\nSee S99 for flow details.\n',
      );

      // id-consistency hook → dangling S99 감지 → block
      const hookResult = await runIdHook(dir);
      expect(hookResult.ok).toBe(false);
      expect(hookResult.message).toContain('INV-2 violation');
      expect(hookResult.message).toContain('S99');
    },
    30_000,
  );

  it(
    'INV-4 P0 coverage: R1·R2·R4·R5·R6·R7·R8·R13 모두 spec에 정의·인용됨',
    async () => {
      // S1 완료
      await bootstrap(dir);
      for (let i = 1; i <= 13; i++) {
        await simulatePhase(dir, i, PhaseStatus.Approved);
      }

      // P0 ID들이 정의+인용된 spec 파일 작성
      await writeInv4Specs(dir);

      // graph build
      const graph = await buildGraph(dir);

      const P0_IDS = ['R1', 'R2', 'R4', 'R5', 'R6', 'R7', 'R8', 'R13'];

      // INV-4: 모든 P0 ID가 definedIds에 존재
      for (const id of P0_IDS) {
        expect(graph.definedIds.has(id)).toBe(true);
      }

      // INV-4: 모든 P0 ID가 edges(인용)에 존재
      const citedIds = new Set(graph.edges.map((e) => e.to));
      for (const id of P0_IDS) {
        expect(citedIds.has(id)).toBe(true);
      }

      // dangling 없음 (모든 인용 ID가 정의됨)
      const danglingP0 = graph.danglingCitations.filter((d) => P0_IDS.includes(d.to));
      expect(danglingP0).toHaveLength(0);
    },
    30_000,
  );
});
