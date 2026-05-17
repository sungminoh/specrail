// T-CSA.16 — perf benchmarks (NFR-CSA-PERF-1·2·3)
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.16
//
// Budgets per docs/spec/changes/2026-05-15-core-schema-attrs/deltas/phase-09-non-functional-requirements.md:
//   NFR-CSA-PERF-1: attrs parser per-file p95 < 50ms (100-entity fixture)
//   NFR-CSA-PERF-2: ajv validator full-spec p95 < 500ms
//   NFR-CSA-PERF-3: codemod idempotency = 0 byte diff on re-run
//
// CI machines vary; budgets reflect a 100-entity scale, not max-fan.
// If these fail under specific load conditions, raise the budget or
// reduce fixture size — never silently lower the perf bar.

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseAttrsBlocks } from '../src/markdown/attrs.js';
import { validateAttrs, _resetAttrsCache } from '../src/schema/validator.js';
import { runMigrate } from '../src/migrate/codemod.js';

function buildSyntheticFixture(entityCount: number): string {
  const blocks: string[] = ['# Synthetic fixture'];
  for (let i = 1; i <= entityCount; i++) {
    blocks.push(`### R${i}: Synthetic R${i}`);
    blocks.push(`<!-- specrail:attrs id=R${i} -->`);
    blocks.push('```yaml');
    blocks.push('status: Approved');
    blocks.push('importance: P0');
    blocks.push('owner: PERSONA-1');
    blocks.push('```');
    blocks.push('<!-- /specrail:attrs -->');
    blocks.push('');
  }
  return blocks.join('\n');
}

function p95(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx];
}

describe('NFR-CSA-PERF-1 — attrs parser per-file p95 < 50ms (T-CSA.16)', () => {
  it('parses 100-entity fixture under budget across 30 runs', () => {
    const fixture = buildSyntheticFixture(100);
    const samples: number[] = [];
    for (let i = 0; i < 30; i++) {
      const t0 = performance.now();
      const r = parseAttrsBlocks(fixture);
      const t1 = performance.now();
      expect(r.blocks).toHaveLength(100);
      samples.push(t1 - t0);
    }
    const budget = 50; // ms
    expect(p95(samples)).toBeLessThan(budget);
  });
});

describe('NFR-CSA-PERF-2 — validator full-pass p95 < 500ms (T-CSA.16)', () => {
  it('validates 100 R-tier payloads under budget across 20 runs', async () => {
    _resetAttrsCache();
    const payload = { status: 'Approved', importance: 'P0', owner: 'PERSONA-1' };
    const samples: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t0 = performance.now();
      for (let j = 0; j < 100; j++) {
        await validateAttrs(payload, 'R');
      }
      const t1 = performance.now();
      samples.push(t1 - t0);
    }
    const budget = 500; // ms — full 100-validation pass
    expect(p95(samples)).toBeLessThan(budget);
  });
});

describe('NFR-CSA-PERF-3 — codemod idempotency 0-byte diff (T-CSA.16)', () => {
  it('runMigrate on a Phase 5 fixture produces 0 new renames on 2nd run', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'specrail-perf-codemod-'));
    try {
      mkdirSync(join(tmp, 'docs', 'spec'), { recursive: true });
      const original = [
        '| ID | Step |',
        '| N-001 | install |',
        '| N-002 | bootstrap |',
        '| E-1 | next |',
      ].join('\n');
      writeFileSync(join(tmp, 'docs', 'spec', '05-user-flow.md'), original);
      const r1 = await runMigrate({ projectRoot: tmp, apply: true });
      expect(r1.renamed.length).toBeGreaterThan(0);
      const after1 = readFileSync(join(tmp, 'docs', 'spec', '05-user-flow.md'), 'utf8');
      const r2 = await runMigrate({ projectRoot: tmp, apply: true });
      expect(r2.renamed.length).toBe(0);
      const after2 = readFileSync(join(tmp, 'docs', 'spec', '05-user-flow.md'), 'utf8');
      expect(after2).toBe(after1); // exact byte equality
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
