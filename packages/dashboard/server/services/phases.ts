import { readAllPhases, readPhaseFile, writePhaseFile, MtimeConflictError } from '../adapters/fs.js';
import { safeJoin } from '../lib/path-allowlist.js';
import { bus } from '../adapters/event-bus.js';
import { ProjectsService } from './projects.js';
import type { Phase, PhaseNumber } from '@specrail/core';

const PHASE_FILES: Record<PhaseNumber, string> = {
  1: '01-prd.md',
  2: '02-personas-journey.md',
  3: '03-features.md',
  4: '04-domain-model.md',
  5: '05-user-flow.md',
  6: '06-information-architecture.md',
  7: '07-wireframe.md',
  8: '08-system-architecture.md',
  9: '09-non-functional-requirements.md',
  10: '10-test-strategy.md',
  11: '11-operations.md',
  12: '12-adr-risks.md',
  13: '13-implementation-plan.md',
};

export class PhasesService {
  constructor(private readonly projects: ProjectsService) {}

  async list(projectId: string): Promise<Phase[]> {
    const project = await this.projects.byId(projectId);
    if (!project) throw new ProjectNotFoundError(projectId);
    return readAllPhases(project.rootPath, projectId);
  }

  async get(projectId: string, num: PhaseNumber): Promise<Phase> {
    const project = await this.projects.byId(projectId);
    if (!project) throw new ProjectNotFoundError(projectId);
    const filename = PHASE_FILES[num];
    if (!filename) throw new Error(`invalid phase number: ${num}`);
    const slug = filename.replace(/^\d{2}-/, '').replace(/\.md$/, '');
    const filePath = safeJoin(project.rootPath, `docs/spec/${filename}`);
    return readPhaseFile(project.rootPath, projectId, num, slug, filePath);
  }

  async write(
    projectId: string,
    num: PhaseNumber,
    content: string,
    basedOnMtimeMs: number,
  ): Promise<{ mtimeMs: number }> {
    const project = await this.projects.byId(projectId);
    if (!project) throw new ProjectNotFoundError(projectId);
    const filename = PHASE_FILES[num];
    if (!filename) throw new Error(`invalid phase number: ${num}`);
    const absPath = safeJoin(project.rootPath, `docs/spec/${filename}`);
    const result = await writePhaseFile(absPath, content, basedOnMtimeMs);
    bus.publish(projectId, { type: 'file.changed', phase: num, reason: 'self-write' });
    return result;
  }
}

export class ProjectNotFoundError extends Error {
  constructor(public readonly projectId: string) {
    super(`project not found: ${projectId}`);
    this.name = 'ProjectNotFoundError';
  }
}

export { MtimeConflictError };
