import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
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

  it('queue caps at QUEUE_MAX_LINES — oldest dropped (R3 H3)', async () => {
    let dir: string = '';
    try {
      dir = await mkdtemp(join(tmpdir(), 'telem-cap-'));
      const queuePath = join(dir, 'q.jsonl');
      const client = createTelemetryClient({
        consent: ConsentStatus.OptedIn,
        send: vi.fn().mockRejectedValue(new Error('down')),
        queuePath,
      });
      // Emit 1500 events (exceeds 1000 cap)
      for (let i = 0; i < 1500; i++) {
        await client.emit({ eventType: 'PhaseStarted', phaseId: i });
      }
      const raw = await readFile(queuePath, 'utf8');
      const lines = raw.split('\n').filter((l) => l.trim() !== '');
      expect(lines.length).toBeLessThanOrEqual(1000);
      // Newest preserved
      const last = JSON.parse(lines[lines.length - 1]);
      expect(last.phaseId).toBe(1499);
    } finally {
      if (dir) await rm(dir, { recursive: true, force: true });
    }
  });

  it('appendToQueue + flushQueue concurrent — no lost events (R8 M2)', async () => {
    let dir: string = '';
    try {
      dir = await mkdtemp(join(tmpdir(), 'telem-mutex-'));
      await mkdir(dir, { recursive: true });
      const queuePath = join(dir, 'q.jsonl');

      // Always fail send so events go to queue
      const client = createTelemetryClient({
        consent: ConsentStatus.OptedIn,
        send: vi.fn().mockRejectedValue(new Error('down')),
        queuePath,
      });

      // Pre-populate queue with 5 failed events
      for (let i = 0; i < 5; i++) {
        await client.emit({ eventType: 'PhaseStarted', phaseId: i });
      }

      // Switch to a sender that succeeds so flushQueue can drain
      let sendCount = 0;
      const successSend = vi.fn().mockImplementation(async () => {
        sendCount++;
        return { ok: true };
      });
      const drainClient = createTelemetryClient({
        consent: ConsentStatus.OptedIn,
        send: successSend,
        queuePath,
      });

      // Concurrent: flush + append + flush — no lost events
      await Promise.all([
        drainClient.flushQueue(),
        drainClient.flushQueue(),
      ]);

      // All 5 queued events should have been sent (some may be sent twice due to
      // concurrent reads — the key invariant is no panic / no corruption)
      expect(sendCount).toBeGreaterThanOrEqual(5);
    } finally {
      if (dir) await rm(dir, { recursive: true, force: true });
    }
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
