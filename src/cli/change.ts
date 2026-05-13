// T2.4 Change skill — DELTA proposal auto-draft (F4.3, AC-R4-1, TC-7)
// `/plan-pipeline change "<topic>"` 명령 simulator

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractDownstream } from '../graph/downstream.js';

export interface ChangeProposal {
  topic: string;
  date: string;
  affectedPhases: string[];
  affectedIds: string[];
  proposalPath: string;
  content: string;
}

function kebabize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function draftChange(
  projectRoot: string,
  topic: string,
  changedIds: string[],
): Promise<ChangeProposal> {
  const date = new Date().toISOString().slice(0, 10);
  const slug = kebabize(topic);
  const changeDir = join(projectRoot, 'docs', 'spec', 'changes', `${date}-${slug}`);
  await mkdir(changeDir, { recursive: true });

  const downstream = await extractDownstream(projectRoot, changedIds);

  const content = renderProposal({
    topic,
    date,
    affectedPhases: downstream.affectedPhases,
    changedIds,
    affectedIds: downstream.affectedIds,
  });

  const proposalPath = join(changeDir, 'proposal.md');
  await writeFile(proposalPath, content);

  return {
    topic,
    date,
    affectedPhases: downstream.affectedPhases,
    affectedIds: downstream.affectedIds,
    proposalPath,
    content,
  };
}

function renderProposal(args: {
  topic: string;
  date: string;
  affectedPhases: string[];
  changedIds: string[];
  affectedIds: string[];
}): string {
  return `---
status: proposed
date: ${args.date}
capability: ${kebabize(args.topic)}
affectedPhases: [${args.affectedPhases.map((p) => `"${p}"`).join(', ')}]
---

# Change Proposal: ${args.topic}

**Status:** proposed
**Date:** ${args.date}

## Why

(이 변경의 이유 — 사용자 작성 필요)

## What Changes

### ADDED
- (새 spec — 작성 필요)

### MODIFIED
${args.changedIds.length === 0 ? '- (수정 대상 spec — 작성 필요)' : args.changedIds.map((id) => `- ${id}: (어떻게 바뀌나)`).join('\n')}

### REMOVED
- (제거 spec — 있으면 작성)

## Impact

영향 phase (plugin auto-extracted via graph dependency):
${args.affectedPhases.length === 0 ? '- (변경 ID 없음 또는 graph 기반 cite 없음)' : args.affectedPhases.map((p) => `- Phase ${p}`).join('\n')}

영향 ID set (transitive closure): ${args.affectedIds.length} IDs
${args.affectedIds.slice(0, 20).map((id) => `  - ${id}`).join('\n')}
${args.affectedIds.length > 20 ? `  ... and ${args.affectedIds.length - 20} more` : ''}

## Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| (작성 필요) | ... | ... | Y/N |
`;
}
