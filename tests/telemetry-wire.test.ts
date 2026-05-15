// NFR-SEC-9: INV-8 telemetry payload no spec content / NFR-PRIV-3 anonProjectHash
// TC-37: INV-8 TelemetryEvent payload privacy
// telemetry-wire: createSenderFromEnv production boot helper (US-11.7, M11)
//
// M8 architect C3: loadConfigFromEnv exists but was never invoked from the
// production boot path. createSenderFromEnv closes that gap.

import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('createSenderFromEnv — env-based sender boot (US-11.7)', () => {
  it('all 3 env vars set → returns non-null PlausibleSender with emit + flush', async () => {
    vi.stubGlobal('process', {
      ...process,
      env: {
        PLAUSIBLE_DOMAIN: 'specrail.example',
        PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event',
        PLAUSIBLE_API_TOKEN: 'tok-abc123',
      },
    });

    const { createSenderFromEnv } = await import('../src/telemetry/client.js');
    const sender = createSenderFromEnv();

    expect(sender).not.toBeNull();
    expect(typeof sender!.emit).toBe('function');
    expect(typeof sender!.flush).toBe('function');
  });

  it('missing PLAUSIBLE_API_TOKEN but domain+endpoint present → returns non-null sender (token is optional)', async () => {
    vi.stubGlobal('process', {
      ...process,
      env: {
        PLAUSIBLE_DOMAIN: 'specrail.example',
        PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event',
        // PLAUSIBLE_API_TOKEN intentionally absent — token is optional per C1 fix
      },
    });

    const { createSenderFromEnv } = await import('../src/telemetry/client.js');
    const sender = createSenderFromEnv();

    expect(sender).not.toBeNull();
    expect(typeof sender!.emit).toBe('function');
    expect(typeof sender!.flush).toBe('function');
  });

  it('null result: warns exactly once across multiple calls (warn-once dedup)', async () => {
    vi.stubGlobal('process', {
      ...process,
      env: {}, // no PLAUSIBLE_* vars
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // Fresh module import → _warnedOnce starts as false
    const { createSenderFromEnv } = await import('../src/telemetry/client.js');

    // Call 3 times — should only warn once total
    createSenderFromEnv();
    createSenderFromEnv();
    createSenderFromEnv();

    const telemetryWarns = warnSpy.mock.calls.filter((args) =>
      String(args[0]).includes('[telemetry]'),
    );
    expect(telemetryWarns.length).toBe(1);
  });
});
