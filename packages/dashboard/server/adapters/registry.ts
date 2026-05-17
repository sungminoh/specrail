// Persistent project registry (JSON, env-paths/registry.json).
// INV-PROJECT-1: validate docs/spec/01-prd.md exists before accepting a registration.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import writeFileAtomic from 'write-file-atomic';
import { type Project, type Registry, RegistrySchema } from '@specrail/core';
import { projectIdOf } from '../lib/project-id.js';
import { dataDir, ensureDataDir } from '../lib/data-dir.js';

const REGISTRY_VERSION = '0.1.0';

export class RegistryAdapter {
  constructor(private readonly registryPath: string) {}

  static async open(): Promise<RegistryAdapter> {
    await ensureDataDir();
    return new RegistryAdapter(join(dataDir(), 'registry.json'));
  }

  async read(): Promise<Registry> {
    try {
      const raw = await readFile(this.registryPath, 'utf8');
      const parsed = RegistrySchema.parse(JSON.parse(raw));
      return parsed;
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return { version: REGISTRY_VERSION, projects: [] };
      }
      throw e;
    }
  }

  async write(reg: Registry): Promise<void> {
    await mkdir(dirname(this.registryPath), { recursive: true });
    await writeFileAtomic(this.registryPath, JSON.stringify(reg, null, 2));
  }

  async list(): Promise<Project[]> {
    return (await this.read()).projects;
  }

  /** Validate INV-PROJECT-1 and upsert a project. Returns the new/updated record. */
  async register(rootPath: string): Promise<Project> {
    const root = resolve(rootPath);
    const prdPath = join(root, 'docs/spec/01-prd.md');
    try {
      await stat(prdPath);
    } catch {
      throw new ProjectValidationError(
        `Not a specrail project: docs/spec/01-prd.md missing at ${root}`,
      );
    }
    const id = projectIdOf(root);
    const name = root.split(/[/\\]/).pop() || id;
    const now = new Date().toISOString();
    const reg = await this.read();
    const existingIdx = reg.projects.findIndex((p) => p.id === id);
    const project: Project = {
      id,
      name,
      rootPath: root,
      hasSpecrail: true,
      lastOpenedAt: now,
    };
    if (existingIdx >= 0) reg.projects[existingIdx] = project;
    else reg.projects.push(project);
    await this.write(reg);
    return project;
  }

  async touch(id: string): Promise<void> {
    const reg = await this.read();
    const p = reg.projects.find((x) => x.id === id);
    if (!p) return;
    p.lastOpenedAt = new Date().toISOString();
    reg.lastActiveProjectId = id;
    await this.write(reg);
  }

  async remove(id: string): Promise<void> {
    const reg = await this.read();
    reg.projects = reg.projects.filter((p) => p.id !== id);
    if (reg.lastActiveProjectId === id) delete reg.lastActiveProjectId;
    await this.write(reg);
  }

  async byId(id: string): Promise<Project | undefined> {
    const reg = await this.read();
    return reg.projects.find((p) => p.id === id);
  }
}

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectValidationError';
  }
}
