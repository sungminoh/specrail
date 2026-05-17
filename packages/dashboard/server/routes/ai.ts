import { Hono } from 'hono';
import { z } from 'zod';
import type { AiService } from '../services/ai.js';
import type { PhaseNumber } from '@specrail/core';

export function aiRoutes(svc: AiService): Hono {
  const r = new Hono();

  r.get('/:id/ai/sessions', (c) => c.json(svc.list(c.req.param('id'))));

  r.post('/:id/ai/sessions', async (c) => {
    const projectId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const parsed = z.object({ origin: z.enum(['review-scan', 'chat', 'inline']) }).safeParse(body);
    if (!parsed.success) return c.json({ error: 'origin required' }, 400);
    const session = await svc.create(projectId, parsed.data.origin);
    if (parsed.data.origin === 'review-scan') {
      // fire-and-forget; SSE delivers progress
      void svc.runReviewScan(session.id);
    }
    return c.json({ id: session.id, status: session.status, origin: session.origin }, 201);
  });

  r.post('/:id/ai/sessions/:sid/messages', async (c) => {
    const sid = c.req.param('sid');
    const body = await c.req.json().catch(() => ({}));
    const parsed = z
      .object({
        phase: z.number().int().min(1).max(13),
        content: z.string(),
        // For inline rewrites:
        selection: z.string().optional(),
        surrounding: z.string().optional(),
      })
      .safeParse(body);
    if (!parsed.success) return c.json({ error: 'phase + content required' }, 400);
    const session = svc.get(sid);
    if (!session) return c.json({ error: 'session not found' }, 404);
    if (session.origin === 'inline' && parsed.data.selection && parsed.data.surrounding) {
      void svc.runInline(
        sid,
        parsed.data.phase as PhaseNumber,
        parsed.data.selection,
        parsed.data.surrounding,
        parsed.data.content,
      );
    } else {
      void svc.runChat(sid, parsed.data.phase as PhaseNumber, parsed.data.content);
    }
    return c.json({ ok: true }, 202);
  });

  r.delete('/:id/ai/sessions/:sid', (c) => {
    const sid = c.req.param('sid');
    svc.abort(sid);
    return c.body(null, 204);
  });

  return r;
}
