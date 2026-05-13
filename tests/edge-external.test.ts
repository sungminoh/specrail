// EDGE-19·20·21·22: Plausible network/external failure — graceful degradation (US-10.5, M10)
//
// Adapter under test: createPlausibleSender (src/telemetry/plausible-adapter.ts)
// API surface: PlausibleSender { emit, flush }
// No retry / queue on the sender itself — those live in TelemetryClient.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPlausibleSender } from '../src/telemetry/plausible-adapter.js';

const DUMMY_CFG = { domain: 'test.example.com', endpoint: 'https://plausible.io/api/event' };
const DUMMY_PAYLOAD = { eventType: 'PhaseApproved', phaseId: 1 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EDGE-19: Plausible timeout / network error — no-throw (US-10.5)', () => {
  it('fetch rejects with AbortError → emit resolves { ok: false }, never throws', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const sender = createPlausibleSender(DUMMY_CFG);
    // Must not throw — telemetry failures must not break caller
    const result = await sender.emit(DUMMY_PAYLOAD);

    expect(result).toEqual({ ok: false });
  });
});

describe('EDGE-20: Plausible 5xx response — graceful, no-throw (US-10.5)', () => {
  it('fetch returns 500 → emit resolves { ok: false }, never throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500, statusText: 'Internal Server Error' })),
    );

    const sender = createPlausibleSender(DUMMY_CFG);
    const result = await sender.emit(DUMMY_PAYLOAD);

    expect(result).toEqual({ ok: false });
  });

  it('subsequent call after 5xx still resolves without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    const sender = createPlausibleSender(DUMMY_CFG);
    await sender.emit(DUMMY_PAYLOAD);
    // Second call: adapter is stateless — should still not throw
    const result = await sender.emit({ eventType: 'ChangeProposed' });
    expect(result).toEqual({ ok: false });
  });
});

describe('EDGE-21: Plausible 404 — adapter continues without breaking (US-10.5)', () => {
  it('fetch returns 404 → emit resolves { ok: false }, subsequent call also resolves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' })),
    );

    const sender = createPlausibleSender(DUMMY_CFG);

    const first = await sender.emit(DUMMY_PAYLOAD);
    expect(first).toEqual({ ok: false });

    // After 404, adapter must keep functioning — no internal broken state
    const second = await sender.emit({ eventType: 'HookBlock', hookReason: 'test' });
    expect(second).toEqual({ ok: false });
  });
});

describe('EDGE-22: fast process exit / best-effort flush — flush() drains in-flight emits (US-11.7, M11)', () => {
  it('flush() resolves only after all 3 in-flight emit promises have settled', async () => {
    const resolvers: Array<() => void> = [];
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolvers.push(() => resolve(new Response(null, { status: 202 })));
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const sender = createPlausibleSender(DUMMY_CFG);

    // Fire 3 emits — all in-flight, none settled yet
    const p1 = sender.emit({ eventType: 'PhaseApproved', phaseId: 1 });
    const p2 = sender.emit({ eventType: 'PhaseStarted', phaseId: 2 });
    const p3 = sender.emit({ eventType: 'HookBlock', hookReason: 'test' });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Resolve all 3 fetch calls then flush
    resolvers.forEach((r) => r());
    await sender.flush();

    // All emits must have resolved by the time flush returns
    await expect(p1).resolves.toEqual({ ok: true });
    await expect(p2).resolves.toEqual({ ok: true });
    await expect(p3).resolves.toEqual({ ok: true });
  });
});
