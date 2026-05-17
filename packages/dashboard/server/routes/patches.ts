import { Hono } from 'hono';
import { z } from 'zod';
import type { PatchesService } from '../services/patches.js';
import { PatchConflictError } from '@specrail/core';
import type { PhaseNumber } from '@specrail/core';

export function patchesRoutes(svc: PatchesService): Hono {
  const r = new Hono();

  r.get('/:id/patches/:pid', async (c) => {
    const pid = c.req.param('pid');
    const proposal = await svc.get(pid);
    if (!proposal) return c.json({ error: 'patch not found' }, 404);
    return c.json(proposal);
  });

  r.post('/:id/patches', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const parsed = z
      .object({
        origin: z.enum(['issue-fix', 'chat', 'inline-rewrite']),
        phase: z.number().int().min(1).max(13),
        hunks: z.array(z.object({ before: z.string(), after: z.string() })).min(1),
        rationale: z.string().default(''),
        basedOnMtimeMs: z.number().min(0),
      })
      .safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
    const proposal = await svc.create({
      projectId: id,
      origin: parsed.data.origin,
      phase: parsed.data.phase as PhaseNumber,
      hunks: parsed.data.hunks,
      rationale: parsed.data.rationale,
      basedOnMtimeMs: parsed.data.basedOnMtimeMs,
    });
    return c.json(proposal, 201);
  });

  r.post('/:id/patches/:pid/accept', async (c) => {
    const pid = c.req.param('pid');
    try {
      const updated = await svc.accept(pid);
      return c.json(updated);
    } catch (e: unknown) {
      if (e instanceof PatchConflictError) return c.json({ error: e.message }, 409);
      throw e;
    }
  });

  r.post('/:id/patches/:pid/reject', async (c) => {
    const pid = c.req.param('pid');
    const updated = await svc.reject(pid);
    return c.json(updated);
  });

  return r;
}
