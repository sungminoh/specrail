// TC-55: EDGE-16 5000-ID graph timeout
// T4.4 Performance benchmarks — NFR-PERF-1~7, TC-70~77
// Thresholds are 10x the NFR target to tolerate CI environment variance.
// console.log prints actual measurements for user visibility.

import { describe, it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';
import { validateFrontmatter, getSchemaPath } from '../src/schema/validator.js';
import { parseFrontmatter } from '../src/markdown/frontmatter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateSpec(dir: string, totalIds: number, phases = 13): Promise<void> {
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
  const per = Math.ceil(totalIds / phases);
  for (let i = 1; i <= phases; i++) {
    const lines: string[] = [];
    for (let k = 1; k <= per; k++) {
      lines.push(`## R${i}.${k}: spec item ${i}-${k}`);
      lines.push(`Body referencing F${i}.${k}, S${i}.${k}.1, ENT-Item${k}, INV-${k}`);
    }
    await writeFile(
      join(dir, 'docs', 'spec', String(i).padStart(2, '0') + '-phase.md'),
      `---\nphase: ${i}\nstatus: Approved\n---\n# Phase ${i}\n\n${lines.join('\n')}\n`,
    );
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T4.4 Performance benchmarks (NFR-PERF, TC-70~77)', { timeout: 120_000 }, () => {
  // -------------------------------------------------------------------------
  // NFR-PERF-4: graph cold build <2s → threshold 20s (10x)
  // TC-70
  // -------------------------------------------------------------------------
  it('NFR-PERF-4 TC-70: graph cold build 1000 IDs < 20s', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'perf4-'));
    try {
      await generateSpec(dir, 1000);
      const t0 = performance.now();
      const g = await buildGraph(dir);
      const ms = performance.now() - t0;
      console.log(
        `  [NFR-PERF-4] cold build 1000 IDs: ${ms.toFixed(0)}ms` +
          ` (nodes=${g.nodes.length}, edges=${g.edges.length})` +
          ` — target <2000ms, threshold <20000ms`,
      );
      expect(ms).toBeLessThan(20_000);
      expect(g.nodes.length).toBeGreaterThan(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // NFR-PERF-6: schema validate single frontmatter <100ms → threshold 1000ms
  // TC-71
  // -------------------------------------------------------------------------
  it('NFR-PERF-6 TC-71: schema validate single frontmatter < 1s', async () => {
    const schemaPath = getSchemaPath('common-frontmatter.json');
    const frontmatter = { phase: 5, status: 'Approved' as const };

    const t0 = performance.now();
    const result = await validateFrontmatter(frontmatter, schemaPath);
    const ms = performance.now() - t0;
    console.log(
      `  [NFR-PERF-6] schema validate (cold): ${ms.toFixed(2)}ms` +
        ` — target <100ms, threshold <1000ms`,
    );
    expect(result.valid).toBe(true);
    expect(ms).toBeLessThan(1_000);
  });

  // -------------------------------------------------------------------------
  // NFR-PERF-6 warm: schema validate 100 times with cached validator <1s total
  // TC-72
  // -------------------------------------------------------------------------
  it('NFR-PERF-6 TC-72: schema validate 100x (warm cache) < 1s total', async () => {
    const schemaPath = getSchemaPath('common-frontmatter.json');
    // warm up (first call loads + caches)
    await validateFrontmatter({ phase: 1, status: 'Draft' }, schemaPath);

    const t0 = performance.now();
    for (let i = 1; i <= 100; i++) {
      await validateFrontmatter({ phase: (i % 13) + 1, status: 'Approved' }, schemaPath);
    }
    const ms = performance.now() - t0;
    console.log(
      `  [NFR-PERF-6 warm] 100x validate: ${ms.toFixed(0)}ms` +
        ` (${(ms / 100).toFixed(2)}ms/call) — threshold <1000ms total`,
    );
    expect(ms).toBeLessThan(1_000);
  });

  // -------------------------------------------------------------------------
  // NFR-SCAL-2: 5000 ID graph completes without error (TC-77)
  // No strict time threshold — just must complete and return sensible data.
  // -------------------------------------------------------------------------
  it('NFR-SCAL-2 TC-77: 5000 ID graph build completes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'scal2-'));
    try {
      await generateSpec(dir, 5000);
      const t0 = performance.now();
      const g = await buildGraph(dir);
      const ms = performance.now() - t0;
      console.log(
        `  [NFR-SCAL-2] 5000 IDs build: ${ms.toFixed(0)}ms` +
          ` (nodes=${g.nodes.length}, edges=${g.edges.length})`,
      );
      // Must complete and expose meaningful data
      expect(g.nodes.length).toBeGreaterThan(100);
      expect(g.definedIds.size).toBeGreaterThan(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  // -------------------------------------------------------------------------
  // Frontmatter parse single file <1s (NFR-PERF-1 proxy — invocation overhead)
  // TC-73
  // -------------------------------------------------------------------------
  it('NFR-PERF-1 TC-73: frontmatter parse single file < 1s', () => {
    const raw = [
      '---',
      'phase: 7',
      'status: Approved',
      'refs: [R1, F1.2, ADR-9]',
      '---',
      '# Phase 7',
      '## R7.1: some requirement',
      'References F1.2 and ADR-9.',
    ].join('\n');

    const t0 = performance.now();
    const result = parseFrontmatter(raw);
    const ms = performance.now() - t0;
    console.log(
      `  [NFR-PERF-1] frontmatter parse: ${ms.toFixed(3)}ms` +
        ` — target <500ms, threshold <1000ms`,
    );
    expect(result.hasFrontmatter).toBe(true);
    expect(result.frontmatter['phase']).toBe(7);
    expect(ms).toBeLessThan(1_000);
  });

  // -------------------------------------------------------------------------
  // NFR-PERF-3: hook simulation (parse + validate + ID check) 1000 IDs <30s
  // (10x buffer of <3s target). TC-74
  // -------------------------------------------------------------------------
  it('NFR-PERF-3 TC-74: hook simulation 1000 IDs < 30s', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'perf3-'));
    try {
      await generateSpec(dir, 1000);
      const schemaPath = getSchemaPath('common-frontmatter.json');

      const t0 = performance.now();
      // Simulate hook: buildGraph (parse + ID extraction) + validate each phase
      const g = await buildGraph(dir);

      // Validate each unique phase frontmatter (13 phases)
      for (let phase = 1; phase <= 13; phase++) {
        await validateFrontmatter({ phase, status: 'Approved' }, schemaPath);
      }

      const ms = performance.now() - t0;
      console.log(
        `  [NFR-PERF-3] hook sim 1000 IDs: ${ms.toFixed(0)}ms` +
          ` (nodes=${g.nodes.length})` +
          ` — target <3000ms, threshold <30000ms`,
      );
      expect(ms).toBeLessThan(30_000);
      expect(g.nodes.length).toBeGreaterThan(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // NFR-PERF-5 baseline: incremental proxy — single-file parse <300ms
  // (ADR-9 옵션 D adopted; full rebuild used, but baseline measured). TC-75
  // -------------------------------------------------------------------------
  it('NFR-PERF-5 TC-75: single-file parse baseline < 300ms', () => {
    // Simulate one phase file with ~80 IDs (incremental baseline per ADR-9 option D)
    const lines: string[] = ['---', 'phase: 5', 'status: Approved', '---', '# Phase 5'];
    for (let k = 1; k <= 80; k++) {
      lines.push(`## R5.${k}: spec item`);
      lines.push(`Body refs F5.${k}, INV-${k}`);
    }
    const raw = lines.join('\n');

    const t0 = performance.now();
    const result = parseFrontmatter(raw);
    const ms = performance.now() - t0;
    console.log(
      `  [NFR-PERF-5] single-file parse (80 IDs): ${ms.toFixed(3)}ms` +
        ` — ADR-9 baseline, threshold <300ms`,
    );
    expect(result.hasFrontmatter).toBe(true);
    expect(ms).toBeLessThan(300);
  });

  // -------------------------------------------------------------------------
  // NFR-PERF-4 repeated: graph cold build stability (3 runs, all < 20s). TC-76
  // -------------------------------------------------------------------------
  it('NFR-PERF-4 TC-76: graph cold build 3-run stability, each < 20s', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'perf4b-'));
    try {
      await generateSpec(dir, 1000);
      const durations: number[] = [];

      for (let run = 1; run <= 3; run++) {
        const t0 = performance.now();
        await buildGraph(dir);
        const ms = performance.now() - t0;
        durations.push(ms);
        console.log(`  [NFR-PERF-4 run ${run}/3] ${ms.toFixed(0)}ms — threshold <20000ms`);
      }

      const avg = durations.reduce((s, x) => s + x, 0) / durations.length;
      const max = Math.max(...durations);
      console.log(
        `  [NFR-PERF-4 stability] avg=${avg.toFixed(0)}ms max=${max.toFixed(0)}ms`,
      );

      for (const ms of durations) {
        expect(ms).toBeLessThan(20_000);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
