import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startWatcher } from '../adapters/watcher.js';
import { bus } from '../adapters/event-bus.js';

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'specrail-watch-'));
  await mkdir(join(projectRoot, 'docs/spec'), { recursive: true });
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe('chokidar watcher (INV-WATCH-1)', () => {
  it('emits file.changed for docs/spec/*.md writes', async () => {
    const events: string[] = [];
    const unsub = bus.subscribe('proj-1', (e) => events.push(e.event.type));
    const w = startWatcher('proj-1', projectRoot);

    // Allow watcher to settle.
    await new Promise((res) => setTimeout(res, 200));
    await writeFile(join(projectRoot, 'docs/spec/03-features.md'), '---\nphase: 3\n---\nbody');
    await waitFor(() => events.length > 0, 2500);
    expect(events).toContain('file.added');

    await w.close();
    unsub();
  });

  it('ignores non-allowlisted paths (node_modules, .git)', async () => {
    const events: string[] = [];
    const unsub = bus.subscribe('proj-2', (e) => events.push(e.event.type));
    const w = startWatcher('proj-2', projectRoot);
    await new Promise((res) => setTimeout(res, 200));
    await mkdir(join(projectRoot, 'node_modules/x'), { recursive: true });
    await writeFile(join(projectRoot, 'node_modules/x/y.md'), 'oops');
    await new Promise((res) => setTimeout(res, 600));
    expect(events).toEqual([]);
    await w.close();
    unsub();
  });
});

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timeout');
    await new Promise((res) => setTimeout(res, 50));
  }
}
