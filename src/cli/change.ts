// T2.4 Change skill — DELTA proposal auto-draft (F4.3, AC-R4-1, TC-7)
// US-T7.3/T7.4/T7.5 (M7): S2 DELTA full chain — invokeDeltaChain → mergeChange → archiveChange
// `/specrail change "<topic>"` 명령 simulator

import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { extractDownstream, type DownstreamResult } from '../graph/downstream.js';
import { parseFrontmatter } from '../markdown/frontmatter.js';
import { formatInputBlock } from '../skill/inject.js';
import { runHook as runSchemaHook } from '../hook/schema-validate.js';
import { runHook as runIdHook } from '../hook/id-consistency.js';

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function findPhaseFile(projectRoot: string, phaseN: number): Promise<string | null> {
  const specDir = join(projectRoot, 'docs', 'spec');
  const prefix = String(phaseN).padStart(2, '0') + '-';
  let files: string[];
  try {
    files = await readdir(specDir);
  } catch {
    return null;
  }
  const f = files.find((x) => x.startsWith(prefix) && x.endsWith('.md'));
  return f ?? null;
}

export interface ChangeProposal {
  topic: string;
  date: string;
  affectedPhases: string[];
  affectedIds: string[];
  proposalPath: string;
  content: string;
}

function kebabize(s: string): string {
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
  // R3 M-Round3-6: empty slug fallback for non-Korean/ASCII multilingual input
  return cleaned.length > 0 ? cleaned : 'untitled';
}

export async function draftChange(
  projectRoot: string,
  topic: string,
  changedIds: string[],
): Promise<ChangeProposal> {
  const date = new Date().toISOString().slice(0, 10);
  const slug = kebabize(topic);
  // R3 M-Round3-6: path containment defense
  if (slug.includes('..') || slug.includes('/')) {
    throw new Error(`Invalid topic slug after kebabize: "${slug}"`);
  }
  const changeDir = join(projectRoot, 'docs', 'spec', 'changes', `${date}-${slug}`);
  await mkdir(changeDir, { recursive: true });

  const downstream = await extractDownstream(projectRoot, changedIds);

  // INV-6 enforce (3차 verifier 발견): Change.affectedPhases ≥ 1
  // 변경이 spec에 영향 0이면 명시적 reject — silent proposal 차단
  if (downstream.affectedPhases.length === 0 && changedIds.length > 0) {
    throw new Error(
      `INV-6 violation: changed IDs (${changedIds.join(', ')}) have no downstream phase impact. ` +
        `Either spec graph 누락 or changedIds invalid. Verify graph build + ID validity first.`,
    );
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// US-T7.3 — S2 DELTA delta skill invoke chain
// ─────────────────────────────────────────────────────────────────────────────

export interface InvokeDeltaPhaseResult {
  deltaPath: string;
  created: boolean;
}

export async function invokeDeltaPhase(
  projectRoot: string,
  changeDir: string,
  phaseN: number,
  changedIds: string[],
  affectedIds: string[],
): Promise<InvokeDeltaPhaseResult> {
  const phaseFile = await findPhaseFile(projectRoot, phaseN);
  if (!phaseFile) {
    throw new Error(
      `Phase ${phaseN} spec file not found in docs/spec/ (expected ${String(phaseN).padStart(2, '0')}-*.md)`,
    );
  }
  const phaseName = phaseFile.slice(3).replace(/\.md$/, '');
  const deltaDir = join(changeDir, 'deltas');
  await mkdir(deltaDir, { recursive: true });
  const deltaFileName = `${String(phaseN).padStart(2, '0')}-${phaseName}-delta.md`;
  const deltaPath = join(deltaDir, deltaFileName);

  // Idempotent — already exists, skip
  if (await exists(deltaPath)) {
    return { deltaPath, created: false };
  }

  // Read current phase frontmatter for read-only context block
  const currentPath = join(projectRoot, 'docs', 'spec', phaseFile);
  const raw = await readFile(currentPath, 'utf8');
  const { frontmatter } = parseFrontmatter(raw);

  const skeleton = renderDeltaSkeleton({
    phaseN,
    changeName: basename(changeDir),
    frontmatter,
    changedIds,
    affectedIds,
  });

  await writeFile(deltaPath, skeleton);
  return { deltaPath, created: true };
}

function renderDeltaSkeleton(args: {
  phaseN: number;
  changeName: string;
  frontmatter: Record<string, unknown>;
  changedIds: string[];
  affectedIds: string[];
}): string {
  const changedBlock =
    args.changedIds.length === 0
      ? '- (변경 trigger ID 없음)'
      : args.changedIds.map((id) => `- ${id}`).join('\n');
  const head = args.affectedIds.slice(0, 30);
  const affectedBlock =
    head.length === 0
      ? '- (transitive affected IDs 없음)'
      : head.map((id) => `- ${id}`).join('\n');
  const overflow =
    args.affectedIds.length > 30 ? `\n... and ${args.affectedIds.length - 30} more` : '';

  return `---
phase: ${args.phaseN}
deltaOf: ${args.phaseN}
changeId: ${args.changeName}
status: Draft
---

# Phase ${args.phaseN} delta — ${args.changeName}

## Current frontmatter (read-only context)
${formatInputBlock(args.frontmatter, args.phaseN)}

## Changed IDs (trigger)
${changedBlock}

## Affected IDs (transitive — auto-extracted)
${affectedBlock}${overflow}

## ADDED
- (작성 필요)

## MODIFIED
- (작성 필요)

## REMOVED
- (작성 필요)
`;
}

export interface InvokeDeltaChainResult {
  deltas: string[];
  created: number;
}

export async function invokeDeltaChain(
  projectRoot: string,
  changeDir: string,
  downstream: Pick<DownstreamResult, 'affectedPhases' | 'affectedIds'>,
  changedIds: string[],
): Promise<InvokeDeltaChainResult> {
  const deltas: string[] = [];
  let created = 0;
  for (const phaseStr of downstream.affectedPhases) {
    const phaseN = parseInt(phaseStr, 10);
    if (Number.isNaN(phaseN)) {
      // R2 M2: defensive log — graph builder always emits 2-digit strings
      process.stderr.write(`[change] skipping invalid phaseStr "${phaseStr}" in invokeDeltaChain\n`);
      continue;
    }
    const r = await invokeDeltaPhase(
      projectRoot,
      changeDir,
      phaseN,
      changedIds,
      downstream.affectedIds,
    );
    deltas.push(r.deltaPath);
    if (r.created) created++;
  }
  return { deltas, created };
}

// ─────────────────────────────────────────────────────────────────────────────
// US-T7.4 — S2 DELTA current/ merge
// ─────────────────────────────────────────────────────────────────────────────

export interface MergeChangeResult {
  merged: boolean;
  phases: string[];
  message: string;
}

export async function mergeChange(
  projectRoot: string,
  changeDir: string,
): Promise<MergeChangeResult> {
  // 1. Read proposal.md status — idempotent guard
  const proposalPath = join(changeDir, 'proposal.md');
  if (!(await exists(proposalPath))) {
    throw new Error(`proposal.md not found in ${changeDir}`);
  }
  const proposalRaw = await readFile(proposalPath, 'utf8');
  const { frontmatter: pf } = parseFrontmatter(proposalRaw);
  if (pf.status === 'applied' || pf.status === 'archived') {
    return {
      merged: false,
      phases: [],
      message: `Already ${String(pf.status)} (idempotent)`,
    };
  }

  // 2. Run hook chain (schema + INV-2)
  const sc = await runSchemaHook(projectRoot);
  if (!sc.ok) throw new Error('Schema fail before merge: ' + sc.message);
  const ic = await runIdHook(projectRoot);
  if (!ic.ok) throw new Error('INV-2 fail before merge: ' + ic.message);

  // 3. For each delta, append delta body to current phase
  const deltaDir = join(changeDir, 'deltas');
  let files: string[];
  try {
    files = await readdir(deltaDir);
  } catch {
    return { merged: false, phases: [], message: 'No deltas to merge' };
  }

  const deltaFiles = files.filter((f) => f.endsWith('-delta.md')).sort();
  if (deltaFiles.length === 0) {
    return { merged: false, phases: [], message: 'No deltas to merge' };
  }

  // Transaction: backup before write, restore on failure (architect M7 risk #4 close)
  const backups = new Map<string, string>(); // currentPath → ORIGINAL content (for restore on fail)
  const currentState = new Map<string, string>(); // currentPath → CURRENT content (accumulates merges)
  const phases: string[] = [];
  try {
    // Phase A: backup all current files that will be touched
    for (const deltaFile of deltaFiles) {
      const phaseStr = deltaFile.slice(0, 2);
      const phaseN = parseInt(phaseStr, 10);
      if (Number.isNaN(phaseN)) continue;
      const phaseFile = await findPhaseFile(projectRoot, phaseN);
      if (!phaseFile) {
        throw new Error(
          `Cannot merge delta ${deltaFile}: Phase ${phaseN} spec not found in docs/spec/`,
        );
      }
      const currentPath = join(projectRoot, 'docs', 'spec', phaseFile);
      if (!backups.has(currentPath)) {
        const original = await readFile(currentPath, 'utf8');
        backups.set(currentPath, original);
        currentState.set(currentPath, original);
      }
    }

    // Phase B: actual merge writes — read from currentState (accumulating), write back
    for (const deltaFile of deltaFiles) {
      const phaseStr = deltaFile.slice(0, 2);
      const phaseN = parseInt(phaseStr, 10);
      if (Number.isNaN(phaseN)) continue;

      const phaseFile = await findPhaseFile(projectRoot, phaseN);
      if (!phaseFile) {
        throw new Error(
          `Cannot merge delta ${deltaFile}: Phase ${phaseN} spec not found in docs/spec/`,
        );
      }
      const currentPath = join(projectRoot, 'docs', 'spec', phaseFile);

      const deltaRaw = await readFile(join(deltaDir, deltaFile), 'utf8');
      const { body: deltaBody } = parseFrontmatter(deltaRaw);

      const accumulatedRaw = currentState.get(currentPath)!;
      const merged =
        accumulatedRaw.replace(/\s+$/, '') +
        '\n\n## DELTA — ' +
        basename(changeDir) +
        '\n' +
        deltaBody.replace(/^\s+/, '');
      const tmpPath = currentPath + '.tmp';
      await writeFile(tmpPath, merged);
      await rename(tmpPath, currentPath);
      currentState.set(currentPath, merged); // accumulate for next iteration
      phases.push(phaseStr);
    }

    // Phase C: success → update proposal.md status: applied
    const newProposal = /^status:.*$/m.test(proposalRaw)
      ? proposalRaw.replace(/^status:.*$/m, 'status: applied')
      : proposalRaw;
    const proposalTmpPath = proposalPath + '.tmp';
    await writeFile(proposalTmpPath, newProposal);
    await rename(proposalTmpPath, proposalPath);
  } catch (err) {
    // Restore all backed-up files to original content
    for (const [path, content] of backups) {
      await writeFile(path, content);
    }
    throw err;
  }

  return {
    merged: true,
    phases,
    message: `Merged ${phases.length} delta(s) into current/. Run archiveChange next.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// US-T7.5 — S2 DELTA archive 이동
// ─────────────────────────────────────────────────────────────────────────────

export interface ArchiveChangeResult {
  archived: boolean;
  archivePath: string;
  message: string;
}

export async function archiveChange(
  projectRoot: string,
  changeDir: string,
): Promise<ArchiveChangeResult> {
  const changeName = basename(changeDir);
  const archiveDir = join(projectRoot, 'docs', 'spec', 'changes', 'archive');
  const archivePath = join(archiveDir, changeName);

  // Idempotent — already archived
  if (await exists(archivePath)) {
    return {
      archived: false,
      archivePath,
      message: `Already archived at ${archivePath}`,
    };
  }
  if (!(await exists(changeDir))) {
    throw new Error(`Change directory not found: ${changeDir}`);
  }

  await mkdir(archiveDir, { recursive: true });

  // Update proposal status: archived BEFORE rename (proposal still in changeDir)
  const proposalPath = join(changeDir, 'proposal.md');
  if (await exists(proposalPath)) {
    const raw = await readFile(proposalPath, 'utf8');
    const updated = /^status:.*$/m.test(raw)
      ? raw.replace(/^status:.*$/m, 'status: archived')
      : raw;
    await writeFile(proposalPath, updated);
  }

  await rename(changeDir, archivePath);

  return {
    archived: true,
    archivePath,
    message: `Archived to ${archivePath}`,
  };
}
