import { Hono } from 'hono';
import { z } from 'zod';
import type { PhasesService } from '../services/phases.js';
import { ProjectNotFoundError, MtimeConflictError } from '../services/phases.js';
import type { PhaseNumber } from '@specrail/core';

export function phasesRoutes(svc: PhasesService): Hono {
  const r = new Hono();

  r.get('/:id/phases', async (c) => {
    const id = c.req.param('id');
    try {
      const phases = await svc.list(id);
      const summaries = phases.map((p) => ({
        number: p.number,
        slug: p.slug,
        filePath: p.filePath,
        status: typeof p.frontmatter['status'] === 'string' ? p.frontmatter['status'] : null,
        mtimeMs: p.mtimeMs,
        idCount: p.parsedIds.length,
        refCount: p.parsedRefs.length,
      }));
      return c.json(summaries);
    } catch (e: unknown) {
      if (e instanceof ProjectNotFoundError) return c.json({ error: e.message }, 404);
      throw e;
    }
  });

  r.get('/:id/phases/:n', async (c) => {
    const id = c.req.param('id');
    const num = Number(c.req.param('n')) as PhaseNumber;
    if (!Number.isInteger(num) || num < 1 || num > 13) return c.json({ error: 'invalid phase' }, 400);
    try {
      const phase = await svc.get(id, num);
      return c.json(phase);
    } catch (e: unknown) {
      if (e instanceof ProjectNotFoundError) return c.json({ error: e.message }, 404);
      throw e;
    }
  });

  r.put('/:id/phases/:n', async (c) => {
    const id = c.req.param('id');
    const num = Number(c.req.param('n')) as PhaseNumber;
    if (!Number.isInteger(num) || num < 1 || num > 13) return c.json({ error: 'invalid phase' }, 400);
    const body = await c.req.json().catch(() => ({}));
    const parsed = z
      .object({
        content: z.string(),
        basedOnMtimeMs: z.number().min(0),
      })
      .safeParse(body);
    if (!parsed.success) return c.json({ error: 'content + basedOnMtimeMs required' }, 400);
    try {
      const result = await svc.write(id, num, parsed.data.content, parsed.data.basedOnMtimeMs);
      return c.json(result);
    } catch (e: unknown) {
      if (e instanceof ProjectNotFoundError) return c.json({ error: e.message }, 404);
      if (e instanceof MtimeConflictError) {
        return c.json(
          { error: 'mtime conflict', expected: e.expected, actual: e.actual },
          409,
        );
      }
      throw e;
    }
  });

  return r;
}
