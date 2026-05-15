// TC-41: EDGE-2 ISO 8601 lexicographic sort = chronological
// NFR-I18N-4 UTC timestamp; NFR-I18N-5 ISO 8601 format
// TC-40 EDGE-1 TZ; TC-42 EDGE-3 midnight rollover
// US-10.1 — EDGE-1·2·3 timestamp/TZ boundary tests (M10)
// Verifies frontmatter ISO 8601 UTC behavior: approve() writes Z-suffix,
// lexicographic sort = chronological, date roll-over, midnight, same-second tiebreak.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approve } from '../src/cli/approve.js';
import { parseFrontmatter } from '../src/markdown/frontmatter.js';

// Mock hooks so approve() proceeds without a real spec project
vi.mock('../src/hook/schema-validate.js', () => ({
  runHook: vi.fn(),
}));
vi.mock('../src/hook/id-consistency.js', () => ({
  runHook: vi.fn(),
}));

import { runHook as runSchemaHook } from '../src/hook/schema-validate.js';
import { runHook as runIdHook } from '../src/hook/id-consistency.js';

const mockSchema = vi.mocked(runSchemaHook);
const mockId = vi.mocked(runIdHook);

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'edge-ts-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  mockSchema.mockResolvedValue({ ok: true, message: 'schema OK' });
  mockId.mockResolvedValue({ ok: true, message: 'INV-2 OK' });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-1: approve() emits approvedAt in ISO 8601 UTC (Z suffix)
// ─────────────────────────────────────────────────────────────────────────────
describe('EDGE-1: UTC normalization', () => {
  it('approve() writes approvedAt ending in Z (UTC ISO 8601)', async () => {
    await writeFile(
      join(dir, 'docs/spec/01-prd.md'),
      '---\nphase: 1\nstatus: Draft\n---\n# PRD\n',
    );

    const result = await approve(dir, 1);

    // Return value must match UTC pattern
    expect(result.approvedAt).toMatch(/T\d{2}:\d{2}:\d{2}.*Z$/);

    // File on disk must also contain the Z-suffix timestamp
    const raw = await readFile(join(dir, 'docs/spec/01-prd.md'), 'utf8');
    const { frontmatter } = parseFrontmatter(raw);
    const approvedAt = frontmatter.approvedAt as string;
    expect(approvedAt).toMatch(/T\d{2}:\d{2}:\d{2}.*Z$/);

    // Roundtrip: value is a valid Date and re-serialises identically
    const parsed = new Date(approvedAt);
    expect(parsed.toISOString()).toBe(approvedAt);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-2: lexicographic sort === chronological order for ISO 8601 UTC strings
// ─────────────────────────────────────────────────────────────────────────────
describe('EDGE-2: lexicographic = chronological', () => {
  it('three timestamps 1 sec apart sort correctly as strings', () => {
    const base = new Date('2026-05-13T12:00:00.000Z');
    const t1 = base.toISOString();
    const t2 = new Date(base.getTime() + 1000).toISOString();
    const t3 = new Date(base.getTime() + 2000).toISOString();

    // Shuffle and sort lexicographically
    const shuffled = [t3, t1, t2];
    const sorted = [...shuffled].sort();

    expect(sorted).toStrictEqual([t1, t2, t3]);

    // Also verify chronological via Date comparison
    expect(new Date(sorted[0]).getTime()).toBeLessThan(new Date(sorted[1]).getTime());
    expect(new Date(sorted[1]).getTime()).toBeLessThan(new Date(sorted[2]).getTime());
  });

  it('ten timestamps in random order sort to correct chronological sequence', () => {
    const epoch = new Date('2026-01-01T00:00:00.000Z').getTime();
    const expected = Array.from({ length: 10 }, (_, i) =>
      new Date(epoch + i * 60_000).toISOString(),
    );
    // Reverse to create worst-case input
    const input = [...expected].reverse();
    const result = [...input].sort();
    expect(result).toStrictEqual(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-3: date roll-over — crossing midnight sorts correctly
// ─────────────────────────────────────────────────────────────────────────────
describe('EDGE-3: date roll-over', () => {
  it('2026-05-13T23:59:00Z < 2026-05-14T00:01:00Z (lexicographic)', () => {
    const before = '2026-05-13T23:59:00.000Z';
    const after = '2026-05-14T00:01:00.000Z';

    // Lexicographic
    expect(before < after).toBe(true);
    expect([after, before].sort()).toStrictEqual([before, after]);

    // Date comparison
    expect(new Date(before).getTime()).toBeLessThan(new Date(after).getTime());
  });

  it('midnight edge: 2026-05-13T00:00:00Z > 2026-05-12T23:59:59Z', () => {
    const midnight = '2026-05-13T00:00:00.000Z';
    const oneSecBefore = '2026-05-12T23:59:59.000Z';

    // Lexicographic
    expect(oneSecBefore < midnight).toBe(true);
    expect([midnight, oneSecBefore].sort()).toStrictEqual([oneSecBefore, midnight]);

    // Date comparison
    expect(new Date(oneSecBefore).getTime()).toBeLessThan(new Date(midnight).getTime());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// boundary: same-second tiebreak — ms precision, no crash
// ─────────────────────────────────────────────────────────────────────────────
describe('boundary: same-second tiebreak', () => {
  it('two timestamps same second but different ms — sort does not crash and is stable', () => {
    const ts1 = '2026-05-13T10:00:00.100Z';
    const ts2 = '2026-05-13T10:00:00.900Z';

    const sorted = [ts2, ts1].sort();
    // ms tiebreak is preserved lexicographically within same second
    expect(sorted[0]).toBe(ts1);
    expect(sorted[1]).toBe(ts2);

    // No ms precision requirement beyond "no crash" — both are valid ISO 8601
    expect(new Date(ts1).toISOString()).toBe(ts1);
    expect(new Date(ts2).toISOString()).toBe(ts2);
  });

  it('same-second same-ms timestamps are equal (no ordering required)', () => {
    const ts = '2026-05-13T10:00:00.000Z';
    const sorted = [ts, ts].sort();
    // Must not crash; both elements remain
    expect(sorted).toHaveLength(2);
    expect(sorted[0]).toBe(ts);
    expect(sorted[1]).toBe(ts);
  });
});
