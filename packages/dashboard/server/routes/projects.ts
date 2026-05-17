import { Hono } from 'hono';
import { z } from 'zod';
import type { ProjectsService } from '../services/projects.js';
import { ProjectValidationError } from '../adapters/registry.js';

export function projectsRoutes(svc: ProjectsService): Hono {
  const r = new Hono();

  r.get('/', async (c) => {
    return c.json(await svc.list());
  });

  r.post('/', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = z.object({ rootPath: z.string().min(1) }).safeParse(body);
    if (!parsed.success) return c.json({ error: 'rootPath required' }, 400);
    try {
      const project = await svc.register(parsed.data.rootPath);
      return c.json(project, 201);
    } catch (e: unknown) {
      if (e instanceof ProjectValidationError) {
        return c.json({ error: e.message }, 400);
      }
      throw e;
    }
  });

  r.post('/:id/open', async (c) => {
    const id = c.req.param('id');
    const project = await svc.open(id);
    if (!project) return c.json({ error: 'project not found' }, 404);
    return c.json(project);
  });

  r.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await svc.remove(id);
    return c.body(null, 204);
  });

  return r;
}
