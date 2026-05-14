// US-10.2 — EDGE-4·5·6 concurrency surface tests (M10)
//
// Purpose: verify that ID counter + telemetry behave correctly (or document known
// limitations) under concurrent access patterns.
//
// Architecture notes (from source):
//   - counterCache: Map<string, Promise<IdCounter>> — synchronously set before
//     any await, so concurrent getCounter() calls for the same root always resolve
//     to the SAME IdCounter instance. No race on cache insertion.
//   - IdCounter.next(): serialized via an instance-level mutex chain (H9 fix).
//     Concurrent calls within one instance are safe (fully serialized).
//   - TelemetryClient.emit(): fires trySend() which calls the `send` fn directly.
//     There is no observable in-memory queue field — the queue is file-based
//     (appendFile on failure). Concurrent emit() calls are independent fetch calls.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { issueId, _resetCounterCache } from '../src/skill/orchestrator.js';
import { IdCounter } from '../src/spec/counter.js';
import { SpecTier } from '../src/spec/id.js';
import { createTelemetryClient } from '../src/telemetry/client.js';
import { ConsentStatus } from '../src/telemetry/consent.js';

// ---------------------------------------------------------------------------
// Shared tmp-dir lifecycle
// ---------------------------------------------------------------------------

let tmpDirs: string[] = [];

async function makeTmpDir(): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), 'edge-conc-'));
  tmpDirs.push(d);
  return d;
}

beforeEach(() => {
  tmpDirs = [];
  // Reset the module-level counterCache so each test starts isolated.
  _resetCounterCache();
});

afterEach(async () => {
  _resetCounterCache();
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

// ---------------------------------------------------------------------------
// EDGE-4: multi-project independence
// ---------------------------------------------------------------------------

describe('EDGE-4: multi-project independence — concurrent issueId across two roots', () => {
  it('each project starts its own counter from R1; concurrent calls do not cross-pollute', async () => {
    const r1 = await makeTmpDir();
    const r2 = await makeTmpDir();

    // Fire both concurrently — no explicit ordering guarantee between projects.
    const [id1, id2] = await Promise.all([
      issueId(r1, SpecTier.Requirement, 1),
      issueId(r2, SpecTier.Requirement, 1),
    ]);

    // Each root must start at its own R1, not see the other root's counter.
    expect(id1).toBe('R1');
    expect(id2).toBe('R1');
  });

  it('second call on each root increments independently', async () => {
    const r1 = await makeTmpDir();
    const r2 = await makeTmpDir();

    // Sequential per-root second call must not see the other root's count.
    await issueId(r1, SpecTier.Requirement, 1); // R1
    await issueId(r2, SpecTier.Requirement, 1); // R1

    const [id1b, id2b] = await Promise.all([
      issueId(r1, SpecTier.Requirement, 1),
      issueId(r2, SpecTier.Requirement, 1),
    ]);

    // Each root's second call must be R2, not R3 (i.e. no shared counter state).
    expect(id1b).toBe('R2');
    expect(id2b).toBe('R2');
  });
});

// ---------------------------------------------------------------------------
// EDGE-5: same-project burst — 100 concurrent issueId calls
// ---------------------------------------------------------------------------

describe('EDGE-5: same-project burst — 100 concurrent issueId calls must all be unique', () => {
  it('Promise.all of 100 issueId(root, R, 1) produces 100 unique IDs (mutex serializes)', async () => {
    const root = await makeTmpDir();
    const COUNT = 100;

    // The counterCache ensures all 100 calls share the SAME IdCounter instance.
    // IdCounter.next() serializes via mutex chain (H9 fix), so no two calls
    // can issue the same ID even when fired concurrently.
    const results = await Promise.all(
      Array.from({ length: COUNT }, () => issueId(root, SpecTier.Requirement, 1)),
    );

    const unique = new Set(results);

    // Primary assertion: all IDs must be unique.
    expect(unique.size).toBe(COUNT);

    // Secondary: every result must be a valid R-tier ID (R1 … R100).
    for (const id of results) {
      expect(id).toMatch(/^R\d+$/);
    }

    // The set of IDs must be exactly {R1, R2, …, R100}.
    const expected = new Set(Array.from({ length: COUNT }, (_, i) => `R${i + 1}`));
    expect(unique).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// EDGE-6: telemetry concurrent emit
// ---------------------------------------------------------------------------

describe('EDGE-6: telemetry — concurrent emit() calls', () => {
  it(
    'adapter is synchronous per-call (fire-and-forget fetch) — ' +
      'no observable in-memory queue field; 10 concurrent emits call send 10 times',
    async () => {
      // Design note: TelemetryClient has no in-memory queue to inspect directly.
      // The "queue" is file-based (appendFile) and only used on send failure.
      // We verify concurrent emits each invoke `send` exactly once (10 total).
      const calls: object[] = [];
      const mockSend = async (payload: object): Promise<{ ok: boolean }> => {
        calls.push(payload);
        return { ok: true };
      };

      const client = createTelemetryClient({
        consent: ConsentStatus.OptedIn,
        send: mockSend,
        anonProjectHash: 'edge6hash',
        pluginVersion: '0.0.1',
      });

      const CONCURRENT = 10;
      await Promise.all(
        Array.from({ length: CONCURRENT }, (_, i) =>
          client.emit({ eventType: 'PhaseStarted', phaseId: i }),
        ),
      );

      // All 10 concurrent emits must have called send exactly once each.
      expect(calls.length).toBe(CONCURRENT);

      // Each call must carry the correct eventType (no cross-contamination).
      const eventTypes = calls.map((c) => (c as Record<string, unknown>).eventType);
      expect(eventTypes.every((t) => t === 'PhaseStarted')).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// EDGE: rapid sequential issueId — monotonic ascending suffix
// ---------------------------------------------------------------------------

describe('EDGE: rapid sequential issueId — monotonic ascending suffix', () => {
  it('50 sequential await issueId calls produce strictly ascending numeric suffixes', async () => {
    const root = await makeTmpDir();
    const COUNT = 50;
    const results: string[] = [];

    for (let i = 0; i < COUNT; i++) {
      results.push(await issueId(root, SpecTier.Requirement, 1));
    }

    // Extract numeric suffix from each ID (e.g. "R7" → 7).
    const nums = results.map((id) => {
      const m = id.match(/^R(\d+)$/);
      if (!m) throw new Error(`Unexpected ID format: ${id}`);
      return Number(m[1]);
    });

    // Verify strictly monotonically increasing.
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBe(nums[i - 1]! + 1);
    }

    // First must be R1, last must be R50.
    expect(nums[0]).toBe(1);
    expect(nums[COUNT - 1]).toBe(COUNT);
  });
});

// ---------------------------------------------------------------------------
// EDGE: concurrent counter persistence — in-memory must match disk
// ---------------------------------------------------------------------------

describe('EDGE: concurrent counter persistence — in-memory matches persisted value', () => {
  it('after 20 parallel issueId calls, counter file on disk reflects the final count', async () => {
    const root = await makeTmpDir();
    const COUNT = 20;

    await Promise.all(
      Array.from({ length: COUNT }, () => issueId(root, SpecTier.Requirement, 1)),
    );

    // Read the persisted counter file directly.
    const counterFilePath = join(root, '.specrail-cache', 'id-counter.json');
    const raw = await readFile(counterFilePath, 'utf8');
    const persisted = JSON.parse(raw) as { R: Record<string, number> };

    // The counter key for phaseId=1 R-tier is "1".
    // The persisted value must equal the number of IDs issued (COUNT).
    const persistedValue = persisted.R['1'];
    expect(persistedValue).toBe(COUNT);

    // Cross-check: loading a fresh IdCounter from disk and issuing one more
    // must produce R(COUNT+1), not a reset or a duplicate.
    _resetCounterCache();
    const nextId = await issueId(root, SpecTier.Requirement, 1);
    expect(nextId).toBe(`R${COUNT + 1}`);
  });
});
