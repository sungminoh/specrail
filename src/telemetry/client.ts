import { createHash } from 'node:crypto';
import { readFile, appendFile, writeFile, rename } from 'node:fs/promises';
import { ConsentStatus } from './consent.js';

export type TelemetryEventType =
  | 'PhaseStarted'
  | 'PhaseApproved'
  | 'HookBlock'
  | 'ChangeProposed'
  | 'ImplementationStarted'
  | 'Other';

export interface TelemetryEvent {
  eventType: TelemetryEventType;
  phaseId?: number;
  hookReason?: string;
  changeId?: string;
}

export interface ClientConfig {
  consent: ConsentStatus;
  send: (payload: object) => Promise<{ ok: boolean }>;
  anonProjectHash?: string;
  pluginVersion?: string;
  queuePath?: string;
}

export interface TelemetryClient {
  emit(event: TelemetryEvent): Promise<void>;
  flushQueue(): Promise<void>;
}

// INV-8: only these caller-supplied fields are forwarded
const ALLOWED_FIELDS: ReadonlySet<string> = new Set([
  'eventType',
  'phaseId',
  'hookReason',
  'changeId',
]);

/**
 * Returns a deterministic, irreversible SHA-256 hex digest of rootPath.
 * Used to anonymously identify a project without exposing file-system paths.
 */
export function hashProjectRoot(rootPath: string): string {
  return createHash('sha256').update(rootPath, 'utf8').digest('hex');
}

export function createTelemetryClient(cfg: ClientConfig): TelemetryClient {
  const { consent, send, anonProjectHash, pluginVersion, queuePath } = cfg;

  async function appendToQueue(payload: object): Promise<void> {
    if (!queuePath) return;
    await appendFile(queuePath, JSON.stringify(payload) + '\n', 'utf8');
  }

  async function trySend(payload: object): Promise<void> {
    try {
      await send(payload);
    } catch {
      await appendToQueue(payload);
    }
  }

  async function emit(event: TelemetryEvent): Promise<void> {
    // INV-9: only send when explicitly opted in
    if (consent !== ConsentStatus.OptedIn) return;

    // INV-8: strip any fields not in ALLOWED_FIELDS
    const stripped: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      const value = (event as unknown as Record<string, unknown>)[key];
      if (value !== undefined) {
        stripped[key] = value;
      }
    }

    const payload: Record<string, unknown> = {
      ...stripped,
      timestamp: new Date().toISOString(),
    };
    if (anonProjectHash !== undefined) payload.anonProjectHash = anonProjectHash;
    if (pluginVersion !== undefined) payload.pluginVersion = pluginVersion;

    await trySend(payload);
  }

  async function flushQueue(): Promise<void> {
    if (!queuePath) return;

    let raw: string;
    try {
      raw = await readFile(queuePath, 'utf8');
    } catch {
      return; // no queue file → nothing to flush
    }

    const lines = raw.split('\n').filter((l) => l.trim() !== '');
    if (lines.length === 0) return;

    const remaining: string[] = [];
    for (const line of lines) {
      try {
        // D6 fix (4차 reviewer security): re-filter on replay
        // INV-8 enforcement: queue file 변조 시에도 ALLOWED_FIELDS 외 field strip
        const rawPayload = JSON.parse(line) as Record<string, unknown>;
        const filtered: Record<string, unknown> = {};
        for (const key of ALLOWED_FIELDS) {
          if (rawPayload[key] !== undefined) filtered[key] = rawPayload[key];
        }
        // Preserve standard metadata only
        if (typeof rawPayload.timestamp === 'string') filtered.timestamp = rawPayload.timestamp;
        if (typeof rawPayload.anonProjectHash === 'string') filtered.anonProjectHash = rawPayload.anonProjectHash;
        if (typeof rawPayload.pluginVersion === 'string') filtered.pluginVersion = rawPayload.pluginVersion;
        await send(filtered);
      } catch {
        remaining.push(line);
      }
    }

    // H8 fix (3차 reviewer code-reviewer): atomic rename pattern
    // 두 concurrent flushQueue가 중간에 같이 read해도 마지막 rename만 winner
    const tmpPath = queuePath + '.tmp';
    await writeFile(tmpPath, remaining.join('\n') + (remaining.length > 0 ? '\n' : ''), 'utf8');
    await rename(tmpPath, queuePath);
  }

  return { emit, flushQueue };
}
