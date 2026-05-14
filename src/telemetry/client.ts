import { createHash } from 'node:crypto';
import { readFile, appendFile, writeFile, rename } from 'node:fs/promises';

const QUEUE_MAX_LINES = 1000;
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConsentStatus, loadConsent } from './consent.js';
import { loadConfigFromEnv, createPlausibleSender, PlausibleSender } from './plausible-adapter.js';

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

/**
 * Type guard for values that are safe to forward in telemetry payloads.
 * Rejects objects, arrays, functions — accepts string, number, or undefined only.
 */
function isPrimitiveValue(v: unknown): boolean {
  return typeof v === 'string' || typeof v === 'number' || v === undefined;
}

let _cachedVersion: string | undefined;
let _lookupAttempted = false;

/**
 * Read package.json version at runtime. Cached after first call.
 * Returns undefined when version cannot be determined (graceful degradation).
 */
async function getPluginVersion(): Promise<string | undefined> {
  if (_lookupAttempted) return _cachedVersion;
  _lookupAttempted = true;
  try {
    const pkgPath = fileURLToPath(new URL('../../package.json', import.meta.url));
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    _cachedVersion = typeof pkg.version === 'string' && pkg.version ? pkg.version : undefined;
    return _cachedVersion;
  } catch {
    _cachedVersion = undefined;
    return undefined;
  }
}

let _warnedOnce = false;

/**
 * Boot helper: reads PLAUSIBLE_* env vars and returns a ready sender.
 * Returns null (telemetry disabled) when any required var is unset.
 * Warns once to stderr so operators know telemetry is off.
 */
export function createSenderFromEnv(): PlausibleSender | null {
  const cfg = loadConfigFromEnv();
  if (!cfg) {
    if (!_warnedOnce) {
      console.warn('[telemetry] PLAUSIBLE_* env vars not set — telemetry disabled (opt-in)');
      _warnedOnce = true;
    }
    return null;
  }
  return createPlausibleSender({
    domain: cfg.domain,
    endpoint: cfg.endpoint,
    ...(cfg.token ? { token: cfg.token } : {}),
  });
}

// Production boot wire — fire-and-forget telemetry emit.
// Architect M11 verdict: createSenderFromEnv was a renamed helper, not a wire-up.
// tryEmit closes the gap: real call site that production code (approve, change, etc.) invokes.
// Never throws — telemetry failure must not block plugin operation.
export async function tryEmit(projectRoot: string, event: TelemetryEvent): Promise<void> {
  try {
    const configDir = join(projectRoot, '.specrail-cache');
    const consent = await loadConsent(configDir);
    if (consent.status !== ConsentStatus.OptedIn) return;
    const sender = createSenderFromEnv();
    if (!sender) return;
    const pluginVersion = await getPluginVersion();
    const client = createTelemetryClient({
      consent: consent.status,
      send: (payload) => sender.emit(payload),
      anonProjectHash: hashProjectRoot(projectRoot),
      ...(pluginVersion ? { pluginVersion } : {}),
    });
    await client.emit(event);
  } catch {
    // Swallow — telemetry must never block plugin operation
  }
}

export function createTelemetryClient(cfg: ClientConfig): TelemetryClient {
  const { consent, send, anonProjectHash, pluginVersion, queuePath } = cfg;

  // L-R7-7: in-process mutex prevents concurrent appendToQueue + rotation races
  let _queueMutex: Promise<unknown> = Promise.resolve();

  async function appendToQueue(payload: object): Promise<void> {
    if (!queuePath) return;
    const op = _queueMutex.then(async () => {
      await appendFile(queuePath!, JSON.stringify(payload) + '\n', 'utf8');
      // R3 H3: cap queue size — drop oldest if exceeded
      try {
        const raw = await readFile(queuePath!, 'utf8');
        const lines = raw.split('\n').filter((l) => l.trim() !== '');
        if (lines.length > QUEUE_MAX_LINES) {
          const trimmed = lines.slice(-QUEUE_MAX_LINES); // keep newest
          const tmp = queuePath! + '.tmp';
          await writeFile(tmp, trimmed.join('\n') + '\n');
          await rename(tmp, queuePath!);
        }
      } catch {
        // best-effort — don't break emit if rotation fails
      }
    });
    _queueMutex = op.catch(() => undefined);
    return op;
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
    // M-R8-2: extend _queueMutex to cover flushQueue body — closes append↔flush race
    // where concurrent emit + flush could lose events written between read and rename.
    const op = _queueMutex.then(async () => {
      let raw: string;
      try {
        raw = await readFile(queuePath!, 'utf8');
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
            if (rawPayload[key] !== undefined && isPrimitiveValue(rawPayload[key])) {
              filtered[key] = rawPayload[key];
            }
          }
          // Preserve standard metadata only
          if (typeof rawPayload.timestamp === 'string') filtered.timestamp = rawPayload.timestamp;
          if (typeof rawPayload.anonProjectHash === 'string')
            filtered.anonProjectHash = rawPayload.anonProjectHash;
          if (typeof rawPayload.pluginVersion === 'string')
            filtered.pluginVersion = rawPayload.pluginVersion;
          await send(filtered);
        } catch {
          remaining.push(line);
        }
      }

      // H8 fix (3차 reviewer code-reviewer): atomic rename pattern
      // 두 concurrent flushQueue가 중간에 같이 read해도 마지막 rename만 winner
      const tmpPath = queuePath! + '.tmp';
      await writeFile(tmpPath, remaining.join('\n') + (remaining.length > 0 ? '\n' : ''), 'utf8');
      await rename(tmpPath, queuePath!);
    });
    _queueMutex = op.catch(() => undefined);
    return op;
  }

  return { emit, flushQueue };
}
