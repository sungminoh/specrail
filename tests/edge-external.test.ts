// EDGE-19·20·21·22: Plausible network/external failure — graceful degradation (US-10.5, M10)
//
// Adapter under test: createPlausibleSender (src/telemetry/plausible-adapter.ts)
// API surface: (payload: object) => Promise<{ ok: boolean }>
// No retry / queue / flush on the sender itself — those live in TelemetryClient.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPlausibleSender } from '../src/telemetry/plausible-adapter.js';

const DUMMY_CFG = { domain: 'test.example.com', endpoint: 'https://plausible.io/api/event' };
const DUMMY_PAYLOAD = { eventType: 'PhaseApproved', phaseId: 1 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EDGE-19: Plausible timeout / network error — no-throw (US-10.5)', () => {
  it('fetch rejects with AbortError → sender resolves { ok: false }, never throws', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const send = createPlausibleSender(DUMMY_CFG);
    // Must not throw — telemetry failures must not break caller
    const result = await send(DUMMY_PAYLOAD);

    expect(result).toEqual({ ok: false });
  });
});

describe('EDGE-20: Plausible 5xx response — graceful, no-throw (US-10.5)', () => {
  it('fetch returns 500 → sender resolves { ok: false }, never throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500, statusText: 'Internal Server Error' })),
    );

    const send = createPlausibleSender(DUMMY_CFG);
    const result = await send(DUMMY_PAYLOAD);

    expect(result).toEqual({ ok: false });
  });

  it('subsequent call after 5xx still resolves without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    const send = createPlausibleSender(DUMMY_CFG);
    await send(DUMMY_PAYLOAD);
    // Second call: adapter is stateless — should still not throw
    const result = await send({ eventType: 'ChangeProposed' });
    expect(result).toEqual({ ok: false });
  });
});

describe('EDGE-21: Plausible 404 — adapter continues without breaking (US-10.5)', () => {
  it('fetch returns 404 → sender resolves { ok: false }, subsequent call also resolves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' })),
    );

    const send = createPlausibleSender(DUMMY_CFG);

    const first = await send(DUMMY_PAYLOAD);
    expect(first).toEqual({ ok: false });

    // After 404, adapter must keep functioning — no internal broken state
    const second = await send({ eventType: 'HookBlock', hookReason: 'test' });
    expect(second).toEqual({ ok: false });
  });
});

describe('EDGE-22: fast process exit / best-effort flush (US-10.5)', () => {
  it.skip(
    'no synchronous flush API on createPlausibleSender — best-effort via process exit only. ' +
      'Flush / drain lives in TelemetryClient (queuePath + flushQueue). ' +
      'M11 candidate: expose flush() on PlausibleAdapter if pre-exit drain is required.',
    () => {
      // Intentionally empty — documents missing API surface for M11 planning.
    },
  );
});
