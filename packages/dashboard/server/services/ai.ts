// AI session orchestrator. Spawns claude CLI subprocess (INV-AI-1), streams via SSE,
// extracts patches, hands off to PatchesService.
import { randomUUID } from 'node:crypto';
import { extractPatches, type Hunk, type PhaseNumber } from '@specrail/core';
import { bus } from '../adapters/event-bus.js';
import { claudeCli, ClaudeError, type ClaudeCli } from '../adapters/claude-cli.js';
import { reviewScanPrompt, chatPrompt, inlinePrompt } from '../prompts/templates.js';
import type { PhasesService } from './phases.js';
import type { ProjectsService } from './projects.js';
import type { PatchesService } from './patches.js';

export interface SessionMeta {
  id: string;
  projectId: string;
  origin: 'review-scan' | 'chat' | 'inline';
  status: 'idle' | 'streaming' | 'done' | 'error';
  phase?: PhaseNumber;
  startedAt: string;
  abort: AbortController;
  proposedPatchIds: string[];
}

const sessions = new Map<string, SessionMeta>();
const buffers = new Map<string, string>();

export class AiService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly phases: PhasesService,
    private readonly patches: PatchesService,
    private readonly cli: ClaudeCli = claudeCli,
  ) {}

  list(projectId: string): SessionMeta[] {
    return [...sessions.values()].filter((s) => s.projectId === projectId);
  }

  get(id: string): SessionMeta | undefined {
    return sessions.get(id);
  }

  async create(projectId: string, origin: SessionMeta['origin']): Promise<SessionMeta> {
    const id = randomUUID();
    const session: SessionMeta = {
      id,
      projectId,
      origin,
      status: 'idle',
      startedAt: new Date().toISOString(),
      abort: new AbortController(),
      proposedPatchIds: [],
    };
    sessions.set(id, session);
    return session;
  }

  abort(id: string): void {
    const s = sessions.get(id);
    if (!s) return;
    s.abort.abort();
  }

  /** Trigger a review-scan run (origin must match). */
  async runReviewScan(id: string): Promise<void> {
    const session = sessions.get(id);
    if (!session) throw new Error(`session not found: ${id}`);
    const project = await this.projects.byId(session.projectId);
    if (!project) throw new Error(`project not found`);
    const phaseSummaries = (await this.phases.list(session.projectId)).map((p) => ({
      number: p.number,
      status: typeof p.frontmatter['status'] === 'string' ? (p.frontmatter['status'] as string) : null,
      ids: p.parsedIds.length,
    }));
    const prompt = reviewScanPrompt(phaseSummaries);
    await this.runStream(session, project.rootPath, prompt);
  }

  async runChat(id: string, phase: PhaseNumber, userMessage: string): Promise<void> {
    const session = sessions.get(id);
    if (!session) throw new Error(`session not found: ${id}`);
    session.phase = phase;
    const project = await this.projects.byId(session.projectId);
    if (!project) throw new Error('project not found');
    const phaseObj = await this.phases.get(session.projectId, phase);
    const prompt = chatPrompt(phase, phaseObj.body, userMessage);
    await this.runStream(session, project.rootPath, prompt);
  }

  async runInline(
    id: string,
    phase: PhaseNumber,
    selection: string,
    surrounding: string,
    instruction: string,
  ): Promise<void> {
    const session = sessions.get(id);
    if (!session) throw new Error(`session not found: ${id}`);
    session.phase = phase;
    const project = await this.projects.byId(session.projectId);
    if (!project) throw new Error('project not found');
    const prompt = inlinePrompt(phase, selection, surrounding, instruction);
    await this.runStream(session, project.rootPath, prompt);
  }

  private async runStream(session: SessionMeta, cwd: string, prompt: string): Promise<void> {
    session.status = 'streaming';
    buffers.set(session.id, '');
    try {
      for await (const chunk of this.cli.stream({
        cwd,
        prompt,
        abortSignal: session.abort.signal,
      })) {
        if (chunk.type === 'text') {
          const prev = buffers.get(session.id) ?? '';
          buffers.set(session.id, prev + chunk.delta);
          bus.publish(session.projectId, { type: 'ai.token', sessionId: session.id, delta: chunk.delta });
        } else if (chunk.type === 'tool_use') {
          bus.publish(session.projectId, { type: 'ai.tool', sessionId: session.id, tool: chunk.tool, args: chunk.input });
        } else if (chunk.type === 'done') {
          break;
        }
      }
      // Patch extraction
      const text = buffers.get(session.id) ?? '';
      const { envelopes } = extractPatches(text);
      for (const env of envelopes) {
        for (const patch of env.patches) {
          const phaseObj = await this.phases.get(session.projectId, patch.phase as PhaseNumber);
          const hunks: Hunk[] = patch.hunks.map((h) => ({ before: h.before, after: h.after }));
          const rationale = patch.hunks
            .map((h) => h.rationale)
            .filter(Boolean)
            .join('; ');
          const proposal = await this.patches.create({
            projectId: session.projectId,
            origin: session.origin === 'review-scan' ? 'issue-fix' : session.origin === 'chat' ? 'chat' : 'inline-rewrite',
            phase: patch.phase as PhaseNumber,
            hunks,
            rationale,
            basedOnMtimeMs: phaseObj.mtimeMs,
          });
          session.proposedPatchIds.push(proposal.id);
        }
      }
      session.status = 'done';
      bus.publish(session.projectId, { type: 'ai.done', sessionId: session.id, patchIds: session.proposedPatchIds });
    } catch (e: unknown) {
      session.status = 'error';
      const msg = e instanceof ClaudeError ? `${e.kind}: ${e.message}` : String(e);
      bus.publish(session.projectId, { type: 'ai.error', sessionId: session.id, message: msg });
    }
  }

  static __reset(): void {
    sessions.clear();
    buffers.clear();
  }
}
