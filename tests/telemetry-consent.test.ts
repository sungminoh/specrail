import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConsent, recordConsent, revokeConsent, ConsentStatus } from '../src/telemetry/consent.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'consent-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('T3.7 Consent (F13.1, INV-9, AC-R13-1, TC-21·38)', () => {
  it('initial load → NotAsked', async () => {
    const c = await loadConsent(dir);
    expect(c.status).toBe(ConsentStatus.NotAsked);
  });

  it('recordConsent("yes") → OptedIn with consentedAt timestamp', async () => {
    const before = new Date();
    const c = await recordConsent(dir, 'yes');
    const after = new Date();

    expect(c.status).toBe(ConsentStatus.OptedIn);
    expect(c.consentedAt).toBeDefined();

    const ts = new Date(c.consentedAt!);
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('recordConsent("no") → OptedOut (default off, INV-9)', async () => {
    const c = await recordConsent(dir, 'no');
    expect(c.status).toBe(ConsentStatus.OptedOut);
    expect(c.consentedAt).toBeUndefined();
  });

  it('recordConsent("yes") then revokeConsent() → OptedOut with revokedAt', async () => {
    await recordConsent(dir, 'yes');

    const before = new Date();
    const c = await revokeConsent(dir);
    const after = new Date();

    expect(c.status).toBe(ConsentStatus.OptedOut);
    expect(c.revokedAt).toBeDefined();

    const ts = new Date(c.revokedAt!);
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('INV-9: no OptedIn transition without explicit "yes" input', async () => {
    // revokeConsent on a NotAsked state should not produce OptedIn
    const c = await revokeConsent(dir);
    expect(c.status).toBe(ConsentStatus.OptedOut);
    expect(c.status).not.toBe(ConsentStatus.OptedIn);
  });

  it('consent persisted to disk — reload reflects recorded state', async () => {
    await recordConsent(dir, 'yes');
    const reloaded = await loadConsent(dir);
    expect(reloaded.status).toBe(ConsentStatus.OptedIn);
    expect(reloaded.consentedAt).toBeDefined();
  });

  it('revoke persisted to disk — reload reflects OptedOut', async () => {
    await recordConsent(dir, 'yes');
    await revokeConsent(dir);
    const reloaded = await loadConsent(dir);
    expect(reloaded.status).toBe(ConsentStatus.OptedOut);
    expect(reloaded.revokedAt).toBeDefined();
  });
});
