// architect M11 P1 must-fix: tryEmit production wire-up
// Verify boot helper is invoked from approve.ts and never throws.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tryEmit } from '../src/telemetry/client.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tryemit-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('tryEmit (architect M11 P1 wire-up)', () => {
  it('no-op when consent absent', async () => {
    await expect(
      tryEmit(dir, { eventType: 'PhaseApproved', phaseId: 1 }),
    ).resolves.toBeUndefined();
  });

  it('no-op when consent OptedOut even with env vars set', async () => {
    vi.stubEnv('PLAUSIBLE_DOMAIN', 'x.example');
    vi.stubEnv('PLAUSIBLE_ENDPOINT', 'https://x.example/api/event');
    vi.stubEnv('PLAUSIBLE_API_TOKEN', 'tok');
    const cacheDir = join(dir, '.plan-pipeline-cache');
    await mkdir(cacheDir, { recursive: true });
    await writeFile(
      join(cacheDir, 'consent.json'),
      JSON.stringify({ status: 'OptedOut', revokedAt: '2026-05-13T00:00:00Z' }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await tryEmit(dir, { eventType: 'PhaseApproved', phaseId: 2 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('emits via fetch when consent OptedIn AND env vars present', async () => {
    vi.stubEnv('PLAUSIBLE_DOMAIN', 'x.example');
    vi.stubEnv('PLAUSIBLE_ENDPOINT', 'https://x.example/api/event');
    vi.stubEnv('PLAUSIBLE_API_TOKEN', 'tok');
    const cacheDir = join(dir, '.plan-pipeline-cache');
    await mkdir(cacheDir, { recursive: true });
    await writeFile(
      join(cacheDir, 'consent.json'),
      JSON.stringify({ status: 'OptedIn', consentedAt: '2026-05-13T00:00:00Z' }),
    );
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response('ok', { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchSpy);
    await tryEmit(dir, { eventType: 'PhaseApproved', phaseId: 3 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('swallows fetch failure (telemetry must not block)', async () => {
    vi.stubEnv('PLAUSIBLE_DOMAIN', 'x.example');
    vi.stubEnv('PLAUSIBLE_ENDPOINT', 'https://x.example/api/event');
    vi.stubEnv('PLAUSIBLE_API_TOKEN', 'tok');
    const cacheDir = join(dir, '.plan-pipeline-cache');
    await mkdir(cacheDir, { recursive: true });
    await writeFile(
      join(cacheDir, 'consent.json'),
      JSON.stringify({ status: 'OptedIn' }),
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(
      tryEmit(dir, { eventType: 'PhaseApproved', phaseId: 4 }),
    ).resolves.toBeUndefined();
  });
});
