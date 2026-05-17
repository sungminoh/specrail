// SSE single channel per project. Format: event: <type>\ndata: <json>\nid: <int>\n\n
import { Hono } from 'hono';
import { bus, type PublishedEvent } from '../adapters/event-bus.js';
import { streamSSE } from 'hono/streaming';

export function eventsRoutes(): Hono {
  const r = new Hono();

  r.get('/:id/events', async (c) => {
    const id = c.req.param('id');
    const lastEventIdHeader = c.req.header('Last-Event-ID');
    const lastEventId = lastEventIdHeader ? Number(lastEventIdHeader) : 0;
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ event: 'open', data: JSON.stringify({ projectId: id, ts: Date.now() }) });
      for (const replay of bus.catchUp(id, lastEventId)) {
        await writeOne(stream, replay);
      }
      const queue: PublishedEvent[] = [];
      let resolver: (() => void) | null = null;
      const unsub = bus.subscribe(id, (ev) => {
        queue.push(ev);
        resolver?.();
      });
      stream.onAbort(() => unsub());
      try {
        while (!stream.aborted) {
          if (queue.length === 0) {
            await new Promise<void>((res) => {
              resolver = res;
              setTimeout(res, 15000); // heartbeat
            });
            resolver = null;
          }
          while (queue.length > 0) {
            const ev = queue.shift();
            if (ev) await writeOne(stream, ev);
          }
          if (!stream.aborted) await stream.writeSSE({ event: 'heartbeat', data: String(Date.now()) });
        }
      } finally {
        unsub();
      }
    });
  });

  return r;
}

async function writeOne(stream: { writeSSE: (m: { event: string; data: string; id?: string }) => Promise<void> }, pub: PublishedEvent) {
  await stream.writeSSE({
    event: pub.event.type,
    data: JSON.stringify(pub.event),
    id: String(pub.id),
  });
}
