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
    const args = opts.args ?? ['-p', opts.prompt, '--output-format', 'stream-json'];
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
    const stdout = child.stdout;
    if (!stdout) throw new ClaudeError('claude CLI produced no stdout', 'exit-nonzero');
    for await (const chunk of stdout) {
      buf += String(chunk);
      let idx: number;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const ev = parseEvent(line);
          if (ev) yield ev;
        } catch {
          // Not a JSON line — fall back to raw text delta.
          yield { type: 'text', delta: line };
        }
      }
    }
    // Process final buffered line, if any.
    if (buf.trim().length > 0) {
      try {
        const ev = parseEvent(buf.trim());
        if (ev) yield ev;
      } catch {
        yield { type: 'text', delta: buf };
      }
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

function parseEvent(line: string): ClaudeChunk | null {
  const obj = JSON.parse(line) as { type?: string; delta?: { text?: string }; name?: string; input?: unknown; stop_reason?: string };
  if (!obj.type) return null;
  if (obj.type === 'content_block_delta' && obj.delta?.text) {
    return { type: 'text', delta: obj.delta.text };
  }
  if (obj.type === 'tool_use') {
    return { type: 'tool_use', tool: obj.name ?? '?', input: obj.input };
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
