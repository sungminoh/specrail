import { Hono } from 'hono';
import { buildGraph, classifyKind } from '@specrail/core';
import { readAllPhases } from '../adapters/fs.js';
import type { ProjectsService } from '../services/projects.js';
import { ProjectNotFoundError } from '../services/phases.js';

export function graphRoutes(projects: ProjectsService): Hono {
  const r = new Hono();

  r.get('/:id/graph', async (c) => {
    const id = c.req.param('id');
    const project = await projects.byId(id);
    if (!project) {
      return c.json({ error: 'project not found' }, 404);
    }
    try {
      const phases = await readAllPhases(project.rootPath, id);
      const g = buildGraph(phases, classifyKind);
      return c.json({
        nodes: g.nodes,
        edges: g.edges,
      });
    } catch (e: unknown) {
      if (e instanceof ProjectNotFoundError) return c.json({ error: e.message }, 404);
      throw e;
    }
  });

  return r;
}
