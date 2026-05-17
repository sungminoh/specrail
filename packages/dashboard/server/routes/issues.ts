import { Hono } from 'hono';
import type { IssuesService } from '../services/issues.js';
import { ProjectNotFoundError } from '../services/phases.js';

export function issuesRoutes(svc: IssuesService): Hono {
  const r = new Hono();

  r.get('/:id/issues', async (c) => {
    const id = c.req.param('id');
    return c.json(await svc.list(id));
  });

  r.post('/:id/issues/refresh', async (c) => {
    const id = c.req.param('id');
    try {
      const result = await svc.refresh(id);
      return c.json(result, 202);
    } catch (e: unknown) {
      if (e instanceof ProjectNotFoundError) return c.json({ error: e.message }, 404);
      throw e;
    }
  });

  return r;
}
