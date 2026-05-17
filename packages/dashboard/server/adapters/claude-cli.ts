// Claude CLI subprocess adapter. INV-AI-1: spawn always uses cwd=project.rootPath.
// Streams stream-json lines from claude binary, classifies errors.
import { execa, type ResultPromise } from 'execa';

export type ClaudeChunk =
  | { type: 'text'; delta: string }
  | { type: 'tool_use'; tool: string; input: unknown }
  | { type: 'done'; stopReason: string };

export interface ClaudeCliOptions {
  cwd: string;
  prompt: string;
  abortSignal?: AbortSignal;
  /** Override binary (tests use a canned stub). */
  binary?: string;
  /** Override args (rarely needed). */
  args?: string[];
  /** Timeout in ms (default 30 min per NFR-AVAIL-2). */
  timeoutMs?: number;
}

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly kind: 'not-installed' | 'exit-nonzero' | 'timeout' | 'aborted' | 'parse',
    public readonly stderr?: string,
  ) {
    super(message);
    this.name = 'ClaudeError';
  }
}

export interface ClaudeCli {
  stream(opts: ClaudeCliOptions): AsyncIterable<ClaudeChunk>;
}

class DefaultClaudeCli implements ClaudeCli {
  async *stream(opts: ClaudeCliOptions): AsyncIterable<ClaudeChunk> {
    const binary = opts.binary ?? 'claude';
    // Real claude CLI args:
    //   -p / --print          → non-interactive (positional prompt follows)
    //   --output-format stream-json → JSON-line stream
    //   --verbose             → required with stream-json
    //   --include-partial-messages → emit content_block_delta events for real-time tokens
    const args = opts.args ?? [
      '-p',
      opts.prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--include-partial-messages',
    ];
    let child: ResultPromise<{ shell: false; cwd: string; reject: false }>;
    try {
      child = execa(binary, args, {
        shell: false,
        cwd: opts.cwd,
        reject: false,
        timeout: opts.timeoutMs ?? 30 * 60_000,
      });
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        throw new ClaudeError(`claude CLI not found at ${binary}`, 'not-installed');
      }
      throw e;
    }

    if (opts.abortSignal) {
      opts.abortSignal.addEventListener('abort', () => {
        if (!child.killed) {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) child.kill('SIGKILL');
          }, 5_000);
        }
      });
    }

    let buf = '';
    // When --include-partial-messages is on we receive `stream_event` deltas
    // AND a final `assistant` event that contains the same full text. Track which
    // path emitted text so we skip the duplicate from the assistant event.
    let deltaSeen = false;
    const stdout = child.stdout;
    if (!stdout) throw new ClaudeError('claude CLI produced no stdout', 'exit-nonzero');
    const consume = function* (line: string): Iterable<ClaudeChunk> {
      try {
        const ev = parseEvent(line);
        if (!ev) return;
        if (ev.type === 'text' && (ev as { fromAssistant?: boolean }).fromAssistant && deltaSeen) {
          return; // suppress duplicate
        }
        if (ev.type === 'text' && !(ev as { fromAssistant?: boolean }).fromAssistant) {
          deltaSeen = true;
        }
        // Strip private marker before yielding.
        const cleaned: ClaudeChunk = ev.type === 'text' ? { type: 'text', delta: ev.delta } : ev;
        yield cleaned;
      } catch {
        yield { type: 'text', delta: line };
      }
    };
    for await (const chunk of stdout) {
      buf += String(chunk);
      let idx: number;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        for (const ev of consume(line)) yield ev;
      }
    }
    if (buf.trim().length > 0) {
      for (const ev of consume(buf.trim())) yield ev;
    }
    const result = await child;
    if (opts.abortSignal?.aborted) {
      throw new ClaudeError('aborted', 'aborted');
    }
    if (result.timedOut) throw new ClaudeError('claude CLI timed out', 'timeout');
    if (result.exitCode !== 0) {
      const stderr = typeof result.stderr === 'string' ? result.stderr.slice(-2000) : '';
      throw new ClaudeError(`claude exited ${result.exitCode}`, 'exit-nonzero', stderr);
    }
    yield { type: 'done', stopReason: 'end' };
  }
}

interface ClaudeStreamEvent {
  type?: string;
  subtype?: string;
  /** "assistant" wrapper: { message: { content: [ {type:'text', text:'...'}, {type:'tool_use', ...} ] } } */
  message?: {
    content?: Array<{ type?: string; text?: string; name?: string; input?: unknown }>;
  };
  /** "stream_event" wrapper from --include-partial-messages: contains a raw Anthropic SDK event */
  event?: {
    type?: string;
    delta?: { type?: string; text?: string };
    index?: number;
    content_block?: { type?: string; text?: string };
  };
  /** "result" wrapper: { result: 'final text', subtype: 'success'|'error_max_turns'|... } */
  result?: string;
  is_error?: boolean;
  stop_reason?: string;
}

function parseEvent(line: string): ClaudeChunk | null {
  const obj = JSON.parse(line) as ClaudeStreamEvent;
  if (!obj.type) return null;

  // Real Claude CLI shapes (CLI v0.114+):
  if (obj.type === 'system') return null; // hook lifecycle noise

  if (obj.type === 'stream_event' && obj.event) {
    // From --include-partial-messages
    if (obj.event.type === 'content_block_delta' && obj.event.delta?.text) {
      return { type: 'text', delta: obj.event.delta.text };
    }
    if (obj.event.type === 'content_block_start' && obj.event.content_block?.type === 'text' && obj.event.content_block.text) {
      return { type: 'text', delta: obj.event.content_block.text };
    }
    return null;
  }

  if (obj.type === 'assistant' && obj.message?.content) {
    // Full assistant turn. With --include-partial-messages this duplicates deltas;
    // the stream wrapper suppresses it via the `fromAssistant` flag.
    const parts: string[] = [];
    let tool: ClaudeChunk | null = null;
    for (const block of obj.message.content) {
      if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
      else if (block.type === 'tool_use') {
        tool = { type: 'tool_use', tool: block.name ?? '?', input: block.input };
      }
    }
    if (parts.length > 0) {
      const ev: ClaudeChunk & { fromAssistant?: boolean } = {
        type: 'text',
        delta: parts.join(''),
      };
      ev.fromAssistant = true;
      return ev;
    }
    if (tool) return tool;
    return null;
  }

  if (obj.type === 'result') {
    return { type: 'done', stopReason: obj.is_error ? 'error' : obj.subtype ?? 'end' };
  }

  // Legacy/compat: Anthropic SDK event names directly.
  if (obj.type === 'content_block_delta' && obj.event?.delta?.text) {
    return { type: 'text', delta: obj.event.delta.text };
  }
  if (obj.type === 'message_stop' || obj.type === 'done') {
    return { type: 'done', stopReason: obj.stop_reason ?? 'end' };
  }
  return null;
}

/** Production singleton. */
export const claudeCli: ClaudeCli = new DefaultClaudeCli();

/** Allow tests to inject a fake stream. */
export class StubClaudeCli implements ClaudeCli {
  constructor(private readonly chunks: ClaudeChunk[]) {}
  async *stream(_opts: ClaudeCliOptions): AsyncIterable<ClaudeChunk> {
    for (const c of this.chunks) {
      yield c;
      await new Promise((res) => setTimeout(res, 1));
    }
  }
}
