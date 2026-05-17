import { describe, it, expect } from 'vitest';
import { parseEvent, type ClaudeChunk } from '../adapters/claude-cli.js';

type WithFromAssistant = ClaudeChunk & { fromAssistant?: boolean };

describe('parseEvent (real Claude CLI v0.114+ schema)', () => {
  it('returns null for system hook noise', () => {
    const line = JSON.stringify({ type: 'system', subtype: 'hook' });
    expect(parseEvent(line)).toBeNull();
  });

  it('returns null for missing type', () => {
    expect(parseEvent('{}')).toBeNull();
  });

  it('extracts text from stream_event content_block_delta (--include-partial-messages)', () => {
    const line = JSON.stringify({
      type: 'stream_event',
      event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'hi' } },
    });
    expect(parseEvent(line)).toEqual({ type: 'text', delta: 'hi' });
  });

  it('extracts text from stream_event content_block_start when text is preloaded', () => {
    const line = JSON.stringify({
      type: 'stream_event',
      event: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: 'seed' } },
    });
    expect(parseEvent(line)).toEqual({ type: 'text', delta: 'seed' });
  });

  it('returns null for stream_event with non-text deltas', () => {
    const line = JSON.stringify({
      type: 'stream_event',
      event: { type: 'message_start' },
    });
    expect(parseEvent(line)).toBeNull();
  });

  it('extracts assistant text and marks fromAssistant=true for dedup', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'final answer' }] },
    });
    const ev = parseEvent(line) as WithFromAssistant | null;
    expect(ev).toMatchObject({ type: 'text', delta: 'final answer' });
    expect(ev?.fromAssistant).toBe(true);
  });

  it('extracts tool_use when assistant has only tool block', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Read', input: { path: '/x' } }] },
    });
    expect(parseEvent(line)).toEqual({
      type: 'tool_use',
      tool: 'Read',
      input: { path: '/x' },
    });
  });

  it('joins multiple assistant text blocks into one delta', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'part-a ' },
          { type: 'text', text: 'part-b' },
        ],
      },
    });
    const ev = parseEvent(line) as WithFromAssistant | null;
    expect(ev?.type).toBe('text');
    if (ev?.type === 'text') expect(ev.delta).toBe('part-a part-b');
  });

  it('mixed-content assistant (text + tool_use): returns text (current behavior)', () => {
    // Documents the NC4 limitation: parseEvent emits ONE chunk per line and prefers text.
    // The tool_use is silently dropped. UI consumes only text+done, so this is functional but
    // recorded here so the limitation is locked in and surfaces if behavior is changed.
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'invoking tool' },
          { type: 'tool_use', name: 'Bash', input: { command: 'ls' } },
        ],
      },
    });
    const ev = parseEvent(line) as WithFromAssistant | null;
    expect(ev?.type).toBe('text');
    if (ev?.type === 'text') expect(ev.delta).toBe('invoking tool');
  });

  it('returns null for empty assistant message', () => {
    const line = JSON.stringify({ type: 'assistant', message: { content: [] } });
    expect(parseEvent(line)).toBeNull();
  });

  it('result event maps subtype to stopReason on success', () => {
    const line = JSON.stringify({ type: 'result', subtype: 'success', is_error: false });
    expect(parseEvent(line)).toEqual({ type: 'done', stopReason: 'success' });
  });

  it('result event maps to error stopReason when is_error', () => {
    const line = JSON.stringify({ type: 'result', subtype: 'error_max_turns', is_error: true });
    expect(parseEvent(line)).toEqual({ type: 'done', stopReason: 'error' });
  });

  it('legacy: bare message_stop maps to done', () => {
    const line = JSON.stringify({ type: 'message_stop', stop_reason: 'end_turn' });
    expect(parseEvent(line)).toEqual({ type: 'done', stopReason: 'end_turn' });
  });

  it('does NOT flag stream_event deltas as fromAssistant', () => {
    const line = JSON.stringify({
      type: 'stream_event',
      event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'streamed' } },
    });
    const ev = parseEvent(line) as WithFromAssistant | null;
    expect(ev?.type).toBe('text');
    expect(ev?.fromAssistant).toBeUndefined();
  });
});
