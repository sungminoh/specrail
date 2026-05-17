// Patch lifecycle service. M5: issue-fix origin; M6 adds chat / inline.
import { randomUUID } from 'node:crypto';
import { applyHunks, PatchConflictError, type Hunk, type PatchProposal, type PhaseNumber } from '@specrail/core';
import { bus } from '../adapters/event-bus.js';
import { ProjectNotFoundError } from './phases.js';
import type { PhasesService } from './phases.js';
import type { ProjectsService } from './projects.js';

const proposals = new Map<string, PatchProposal>();

export class PatchesService {
  constructor(private readonly projects: ProjectsService, private readonly phases: PhasesService) {}

  async create(input: {
    projectId: string;
    origin: 'issue-fix' | 'chat' | 'inline-rewrite';
    phase: PhaseNumber;
    hunks: Hunk[];
    rationale: string;
    basedOnMtimeMs: number;
  }): Promise<PatchProposal> {
    const project = await this.projects.byId(input.projectId);
    if (!project) throw new ProjectNotFoundError(input.projectId);
    const proposal: PatchProposal = {
      id: randomUUID(),
      projectId: input.projectId,
      createdAt: new Date().toISOString(),
      origin: input.origin,
      target: { phase: input.phase },
      hunks: input.hunks,
      rationale: input.rationale,
      status: 'proposed',
      basedOnMtimeMs: input.basedOnMtimeMs,
    };
    proposals.set(proposal.id, proposal);
    bus.publish(input.projectId, { type: 'patch.proposed', patchId: proposal.id });
    return proposal;
  }

  async get(id: string): Promise<PatchProposal | undefined> {
    return proposals.get(id);
  }

  async accept(id: string): Promise<PatchProposal> {
    const proposal = proposals.get(id);
    if (!proposal) throw new Error(`patch not found: ${id}`);
    if (proposal.status !== 'proposed') return proposal;
    // Re-read phase, apply hunks, write atomic with INV-PATCH-2.
    const phase = await this.phases.get(proposal.projectId, proposal.target.phase);
    if (Math.floor(phase.mtimeMs) !== Math.floor(proposal.basedOnMtimeMs)) {
      proposal.status = 'stale';
      proposals.set(id, proposal);
      throw new PatchConflictError(`mtime mismatch: expected=${proposal.basedOnMtimeMs} actual=${phase.mtimeMs}`, proposal.hunks[0]!);
    }
    const next = applyHunks(phase.body, proposal.hunks);
    await this.phases.write(proposal.projectId, proposal.target.phase, next, proposal.basedOnMtimeMs);
    proposal.status = 'accepted';
    proposals.set(id, proposal);
    bus.publish(proposal.projectId, { type: 'patch.accepted', patchId: id });
    return proposal;
  }

  async reject(id: string): Promise<PatchProposal> {
    const proposal = proposals.get(id);
    if (!proposal) throw new Error(`patch not found: ${id}`);
    if (proposal.status !== 'proposed') return proposal;
    proposal.status = 'rejected';
    proposals.set(id, proposal);
    bus.publish(proposal.projectId, { type: 'patch.rejected', patchId: id });
    return proposal;
  }

  /** For tests only — reset in-memory state. */
  static __reset(): void {
    proposals.clear();
  }
}
