import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTelemetryClient, hashProjectRoot } from '../src/telemetry/client.js';
import { ConsentStatus } from '../src/telemetry/consent.js';

describe('T3.8 Telemetry client (F13.2, AC-R13-2, INV-8·9, ADR-7, TC-22·37·45·59)', () => {
  it('TC-22: sends event when OptedIn', async () => {
    const mockSend = vi.fn().mockResolvedValue({ ok: true });
    const c = createTelemetryClient({
      consent: ConsentStatus.OptedIn,
      send: mockSend,
      anonProjectHash: 'abc',
      pluginVersion: '0.0.1',
    });
    await c.emit({ eventType: 'PhaseApproved', phaseId: 1 });
    expect(mockSend).toHaveBeenCalledOnce();
    const payload = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.eventType).toBe('PhaseApproved');
    expect(typeof payload.timestamp).toBe('string');
    expect(payload.anonProjectHash).toBe('abc');
  });

  it('TC-37: INV-9 — OptedOut → send not called', async () => {
    const mockSend = vi.fn().mockResolvedValue({ ok: true });
    const c = createTelemetryClient({
      consent: ConsentStatus.OptedOut,
      send: mockSend,
    });
    await c.emit({ eventType: 'PhaseStarted' });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('TC-37b: INV-9 — NotAsked → send not called', async () => {
    const mockSend = vi.fn().mockResolvedValue({ ok: true });
    const c = createTelemetryClient({
      consent: ConsentStatus.NotAsked,
      send: mockSend,
    });
    await c.emit({ eventType: 'HookBlock', hookReason: 'reason' });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('TC-45: INV-8 — extra fields stripped from payload', async () => {
    const mockSend = vi.fn().mockResolvedValue({ ok: true });
    const c = createTelemetryClient({
      consent: ConsentStatus.OptedIn,
      send: mockSend,
      anonProjectHash: 'abc',
      pluginVersion: '0.0.1',
    });
    // Pass extra non-allowed field
    await c.emit({ eventType: 'ChangeProposed', changeId: 'ch-1', ...(({ _specContent: 'sensitive' }) as unknown as object) } as Parameters<typeof c.emit>[0]);
    expect(mockSend).toHaveBeenCalledOnce();
    const payload = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(payload._specContent).toBeUndefined();
    expect(payload.changeId).toBe('ch-1');
    expect(payload.eventType).toBe('ChangeProposed');
  });

  it('TC-45b: hashProjectRoot produces SHA256 hex (irreversible anonymous)', () => {
    const hash = hashProjectRoot('/home/user/myproject');
    // SHA256 hex = 64 chars
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // Must not contain the original path
    expect(hash).not.toContain('myproject');
    expect(hash).not.toContain('/home');
  });

  it('TC-45c: hashProjectRoot is deterministic', () => {
    const path = '/some/project/path';
    expect(hashProjectRoot(path)).toBe(hashProjectRoot(path));
  });

  it('TC-59: send failure → event preserved in local queue, flushQueue retries', async () => {
    let dir: string = '';
    try {
      dir = await mkdtemp(join(tmpdir(), 'telem-queue-'));
      const queuePath = join(dir, 'queue.jsonl');

      let callCount = 0;
      const mockSend = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) throw new Error('network down');
        return { ok: true };
      });

      const c = createTelemetryClient({
        consent: ConsentStatus.OptedIn,
        send: mockSend,
        anonProjectHash: 'hash123',
        pluginVersion: '0.0.1',
        queuePath,
      });

      // First emit fails → goes to queue
      await c.emit({ eventType: 'ImplementationStarted' });
      expect(mockSend).toHaveBeenCalledOnce();

      // flushQueue retries → second call succeeds
      await c.flushQueue();
      expect(mockSend).toHaveBeenCalledTimes(2);
    } finally {
      if (dir) await rm(dir, { recursive: true, force: true });
    }
  });

  it('TC-59b: payload includes pluginVersion when provided', async () => {
    const mockSend = vi.fn().mockResolvedValue({ ok: true });
    const c = createTelemetryClient({
      consent: ConsentStatus.OptedIn,
      send: mockSend,
      anonProjectHash: 'xyz',
      pluginVersion: '1.2.3',
    });
    await c.emit({ eventType: 'Other' });
    const payload = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.pluginVersion).toBe('1.2.3');
  });

  it('INV-8: flushQueue strips non-primitive ALLOWED_FIELDS values (object-typed hookReason)', async () => {
    let dir: string = '';
    try {
      dir = await mkdtemp(join(tmpdir(), 'telem-inv8-'));
      const queuePath = join(dir, 'queue.jsonl');

      // Write a tampered queue line with hookReason as an object
      const tampered = JSON.stringify({
        eventType: 'HookBlock',
        hookReason: { malicious: 'value' }, // object — must be stripped
        timestamp: '2026-05-13T00:00:00Z',
      });
      await writeFile(queuePath, tampered + '\n', 'utf8');

      const sendSpy = vi.fn().mockResolvedValue({ ok: true });
      const client = createTelemetryClient({
        consent: ConsentStatus.OptedIn,
        send: sendSpy,
        queuePath,
      });

      await client.flushQueue();
      expect(sendSpy).toHaveBeenCalled();
      const sent = sendSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(sent.hookReason).toBeUndefined(); // object stripped
      expect(sent.eventType).toBe('HookBlock'); // string preserved
    } finally {
      if (dir) await rm(dir, { recursive: true, force: true });
    }
  });
});
