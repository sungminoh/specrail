// chokidar watcher: docs/spec/ + changes/ only (INV-WATCH-1 allowlist).
import chokidar, { type FSWatcher } from 'chokidar';
import { resolve } from 'node:path';
import { bus } from './event-bus.js';
import { isSelfWrite } from './fs.js';

const PHASE_RE = /(\d{2})-[^/\\]+\.md$/;

export interface ProjectWatcher {
  close: () => Promise<void>;
}

export function startWatcher(projectId: string, rootPath: string): ProjectWatcher {
  const root = resolve(rootPath);
  const targets = [`${root}/docs/spec`, `${root}/changes`];
  const watcher: FSWatcher = chokidar.watch(targets, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  const emit = (kind: 'file.changed' | 'file.added' | 'file.deleted') => (path: string) => {
    const phase = extractPhaseNumber(path);
    if (phase === null) return;
    const reason: 'external' | 'self-write' = isSelfWrite(path) ? 'self-write' : 'external';
    bus.publish(projectId, { type: kind, phase, reason });
  };
  watcher.on('add', emit('file.added'));
  watcher.on('change', emit('file.changed'));
  watcher.on('unlink', emit('file.deleted'));

  return {
    close: () => watcher.close(),
  };
}

function extractPhaseNumber(path: string): number | null {
  const m = path.match(PHASE_RE);
  if (!m) return null;
  const num = Number(m[1]);
  if (num < 1 || num > 13) return null;
  return num;
}
