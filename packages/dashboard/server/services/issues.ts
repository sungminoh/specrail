import { runChecks, type CheckFinding, type Issue, type PhaseNumber } from '@specrail/core';
import { readAllPhases } from '../adapters/fs.js';
import { bus } from '../adapters/event-bus.js';
import { ProjectNotFoundError } from './phases.js';
import type { ProjectsService } from './projects.js';
import { runPluginSelfCheck } from '../adapters/specrail-cli.js';

interface ProjectIssueState {
  issues: Issue[];
  refreshedAt: number;
}

const cache = new Map<string, ProjectIssueState>();

export class IssuesService {
  constructor(private readonly projects: ProjectsService) {}

  async list(projectId: string): Promise<Issue[]> {
    return cache.get(projectId)?.issues ?? [];
  }

  async refresh(projectId: string): Promise<{ count: number }> {
    const project = await this.projects.byId(projectId);
    if (!project) throw new ProjectNotFoundError(projectId);

    const phases = await readAllPhases(project.rootPath, projectId);
    const findings = runChecks(phases, { ignoreOrphansInPhases: [1] });
    const crossPhase: Issue[] = findings.map((f) => findingToIssue(projectId, f, 'cross-phase'));

    let pluginIssues: Issue[] = [];
    try {
      const plugin = await runPluginSelfCheck(project.rootPath);
      pluginIssues = plugin.map((p, i) => ({
        id: `${projectId}:plugin:${i}`,
        projectId,
        severity: p.severity,
        source: 'plugin-self-check' as const,
        ruleId: p.ruleId,
        message: p.message,
        location: { phase: (p.phase ?? 1) as PhaseNumber },
      }));
    } catch {
      // plugin CLI absent or failed; non-blocking
    }

    const merged = [...crossPhase, ...pluginIssues];
    cache.set(projectId, { issues: merged, refreshedAt: Date.now() });
    bus.publish(projectId, { type: 'issues.updated', count: merged.length });
    return { count: merged.length };
  }
}

function findingToIssue(
  projectId: string,
  f: CheckFinding,
  source: Issue['source'],
): Issue {
  const idParts = ['cp', f.ruleId, f.phase, f.specId ?? '', f.line ?? ''];
  return {
    id: `${projectId}:${idParts.join(':')}`,
    projectId,
    severity: f.severity,
    source,
    ruleId: f.ruleId,
    message: f.message,
    location: {
      phase: f.phase,
      ...(f.line !== undefined ? { line: f.line } : {}),
      ...(f.specId ? { specId: f.specId } : {}),
    },
  };
}
