import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { optOut } from '../src/cli/opt-out.js';
import { loadConsent, recordConsent, ConsentStatus } from '../src/telemetry/consent.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'optout-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('T3.9 opt-out (F13.3, AC-R13-3, TC-23)', () => {
  it('revokes from OptedIn — status becomes OptedOut with revokedAt', async () => {
    await recordConsent(dir, 'yes');
    const before = new Date();
    const r = await optOut(dir);
    const after = new Date();

    expect(r.status).toBe(ConsentStatus.OptedOut);
    expect(r.revokedAt).toBeDefined();

    const ts = new Date(r.revokedAt);
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('no-op when already OptedOut — does not overwrite revokedAt', async () => {
    await recordConsent(dir, 'no');
    // Manually set an earlier revokedAt via direct call
    const firstResult = await optOut(dir);
    const firstRevokedAt = firstResult.revokedAt;

    // Second call should be no-op — revokedAt must not change
    const secondResult = await optOut(dir);
    expect(secondResult.status).toBe(ConsentStatus.OptedOut);
    expect(secondResult.revokedAt).toBe(firstRevokedAt);
  });

  it('revokes from NotAsked — defense in depth → OptedOut', async () => {
    // No prior consent recorded — starts as NotAsked
    const r = await optOut(dir);
    expect(r.status).toBe(ConsentStatus.OptedOut);
    expect(r.revokedAt).toBeDefined();
  });

  it('result message contains mailto privacy address', async () => {
    await recordConsent(dir, 'yes');
    const r = await optOut(dir);
    expect(r.message).toContain('privacy@plan-pipeline.dev');
  });

  it('result message contains revokedAt timestamp', async () => {
    await recordConsent(dir, 'yes');
    const r = await optOut(dir);
    expect(r.message).toContain(r.revokedAt);
  });

  it('persists OptedOut to disk — reload confirms state', async () => {
    await recordConsent(dir, 'yes');
    await optOut(dir);
    const reloaded = await loadConsent(dir);
    expect(reloaded.status).toBe(ConsentStatus.OptedOut);
    expect(reloaded.revokedAt).toBeDefined();
  });
});
