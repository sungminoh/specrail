// Per-project watcher lifecycle. Started on first SSE subscribe, stopped on registry remove.
import { startWatcher, type ProjectWatcher } from '../adapters/watcher.js';
import type { ProjectsService } from './projects.js';

export class WatcherManager {
  private active = new Map<string, ProjectWatcher>();

  constructor(private readonly projects: ProjectsService) {}

  async ensure(projectId: string): Promise<void> {
    if (this.active.has(projectId)) return;
    const p = await this.projects.byId(projectId);
    if (!p) return;
    this.active.set(projectId, startWatcher(projectId, p.rootPath));
  }

  async stop(projectId: string): Promise<void> {
    const w = this.active.get(projectId);
    if (!w) return;
    await w.close();
    this.active.delete(projectId);
  }

  async stopAll(): Promise<void> {
    for (const [id] of this.active) await this.stop(id);
  }
}
