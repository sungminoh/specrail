// In-memory pub-sub for SSE events. One bus per process. Project-scoped channels.
import { EventEmitter } from 'node:events';

export type ServerEvent =
  | { type: 'file.changed' | 'file.added' | 'file.deleted'; phase: number; reason: 'external' | 'self-write' }
  | { type: 'issues.updated'; count: number }
  | { type: 'patch.proposed' | 'patch.accepted' | 'patch.rejected'; patchId: string }
  | { type: 'ai.token'; sessionId: string; delta: string }
  | { type: 'ai.tool'; sessionId: string; tool: string; args: unknown }
  | { type: 'ai.done'; sessionId: string; patchIds: string[] }
  | { type: 'ai.error'; sessionId: string; message: string };

export interface PublishedEvent {
  id: number;
  projectId: string;
  event: ServerEvent;
  ts: number;
}

class EventBus {
  private emitter = new EventEmitter();
  private nextId = 1;
  private buffer: PublishedEvent[] = [];
  private readonly maxBuffer = 200;

  publish(projectId: string, event: ServerEvent): PublishedEvent {
    const pub: PublishedEvent = { id: this.nextId++, projectId, event, ts: Date.now() };
    this.buffer.push(pub);
    if (this.buffer.length > this.maxBuffer) this.buffer.shift();
    this.emitter.emit(`p:${projectId}`, pub);
    this.emitter.emit('*', pub);
    return pub;
  }

  subscribe(projectId: string, handler: (e: PublishedEvent) => void): () => void {
    const channel = `p:${projectId}`;
    this.emitter.on(channel, handler);
    return () => this.emitter.off(channel, handler);
  }

  /** Replay buffered events after `afterId` for the given project. */
  catchUp(projectId: string, afterId: number): PublishedEvent[] {
    return this.buffer.filter((e) => e.projectId === projectId && e.id > afterId);
  }
}

export const bus = new EventBus();
