// D2 fix (4차 reviewer document-specialist): Plausible Events API adapter
//
// Plausible /api/event 요구 형식: { name, url, domain, props? }
// 본 plugin payload: { eventType, phaseId, hookReason, changeId, timestamp, anonProjectHash, pluginVersion }
//
// 직접 send 시 모든 event silent drop. 본 adapter가 변환 책임.
//
// Source: https://plausible.io/docs/events-api

const PLAUSIBLE_ENDPOINT_DEFAULT = 'https://plausible.io/api/event';

export interface PlausibleAdapterConfig {
  /** Plausible site domain (예: 'plan-pipeline.dev') */
  domain: string;
  /** Endpoint URL — self-hosted Plausible 사용 시 override */
  endpoint?: string;
  /** User-Agent override (optional) */
  userAgent?: string;
}

export interface PluginPayload {
  eventType: string;
  phaseId?: number;
  hookReason?: string;
  changeId?: string;
  timestamp?: string;
  anonProjectHash?: string;
  pluginVersion?: string;
}

/**
 * Convert plugin payload to Plausible /api/event format.
 * - `name` ← eventType (Plausible은 custom event name 받음)
 * - `url`  ← synthetic URL with eventType path (Plausible 요구 — 실 URL 아님)
 * - `domain` ← caller-provided
 * - `props` ← rest of payload (Plausible custom properties)
 */
export function toPlausiblePayload(
  payload: PluginPayload,
  domain: string,
): {
  name: string;
  url: string;
  domain: string;
  props: Record<string, string>;
} {
  const props: Record<string, string> = {};
  if (payload.phaseId !== undefined) props.phaseId = String(payload.phaseId);
  if (payload.hookReason !== undefined) props.hookReason = payload.hookReason;
  if (payload.changeId !== undefined) props.changeId = payload.changeId;
  if (payload.timestamp !== undefined) props.timestamp = payload.timestamp;
  if (payload.anonProjectHash !== undefined) props.anonProjectHash = payload.anonProjectHash;
  if (payload.pluginVersion !== undefined) props.pluginVersion = payload.pluginVersion;

  return {
    name: payload.eventType,
    url: `https://${domain}/plugin/${encodeURIComponent(payload.eventType)}`,
    domain,
    props,
  };
}

export interface PlausibleConfig {
  domain: string;
  endpoint: string;
  token: string;
}

/**
 * Load Plausible config from environment variables.
 * Returns null (telemetry disabled) if any of the 3 required vars is missing.
 * Accepts an explicit env map to avoid mutating process.env in tests.
 */
export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): PlausibleConfig | null {
  const domain = env.PLAUSIBLE_DOMAIN;
  const endpoint = env.PLAUSIBLE_ENDPOINT;
  const token = env.PLAUSIBLE_API_TOKEN;
  if (!domain || !endpoint || !token) return null;
  return { domain, endpoint, token };
}

/**
 * Create a `send` function compatible with `TelemetryClient` (`ClientConfig.send`).
 * Internally converts to Plausible format and POSTs to /api/event.
 */
export function createPlausibleSender(
  cfg: PlausibleAdapterConfig,
): (payload: object) => Promise<{ ok: boolean }> {
  const endpoint = cfg.endpoint ?? PLAUSIBLE_ENDPOINT_DEFAULT;

  return async (payload: object): Promise<{ ok: boolean }> => {
    const plausible = toPlausiblePayload(payload as PluginPayload, cfg.domain);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cfg.userAgent) headers['User-Agent'] = cfg.userAgent;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(plausible),
      });
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  };
}
