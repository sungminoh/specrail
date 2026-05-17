import type { Project } from '@specrail/core';
import { RegistryAdapter, ProjectValidationError } from '../adapters/registry.js';

export class ProjectsService {
  constructor(private readonly registry: RegistryAdapter) {}

  async list(): Promise<Project[]> {
    return this.registry.list();
  }

  async register(rootPath: string): Promise<Project> {
    return this.registry.register(rootPath);
  }

  async open(id: string): Promise<Project | undefined> {
    await this.registry.touch(id);
    return this.registry.byId(id);
  }

  async remove(id: string): Promise<void> {
    return this.registry.remove(id);
  }

  async byId(id: string): Promise<Project | undefined> {
    return this.registry.byId(id);
  }
}

export { ProjectValidationError };
