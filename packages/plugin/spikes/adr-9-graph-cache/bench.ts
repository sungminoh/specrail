// T0.4 ADR-9 Spike — incremental vs full-rebuild 측정 (reviewer H2 확장)
// 결과로 ADR-9 옵션 A (incremental) vs 옵션 D (full rebuild every commit) 결정
// 판정: full rebuild가 NFR-PERF-3 (<3s) 충족 시 옵션 D 채택 + token 회수

import { performance } from 'node:perf_hooks';
import { mkdtemp, writeFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';

const PHASES = 13;
const TOTAL_IDS = 1000;
const IDS_PER_PHASE = Math.ceil(TOTAL_IDS / PHASES);

const ID_RE =
  /\b([RFS]\d+(?:\.\d+){0,2}|ENT-[A-Za-z0-9]+|INV-\d+|NFR-[A-Z]+-\d+|ARCH-\d+|EXT-\d+|OPS-\d+|ADR-\d+|RISK-\d+|TC-\d+|EDGE-\d+|AC-R\d+-\d+|OQ-\d+-\d+|T\d+\.\d+)\b/g;

async function generateSpec(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  for (let i = 1; i <= PHASES; i++) {
    const name = String(i).padStart(2, '0');
    const ids: string[] = [];
    for (let k = 1; k <= IDS_PER_PHASE; k++) {
      ids.push(`## R${i}.${k}: spec ${i}-${k}`);
      ids.push(`Body referencing F1.${k}, S${i}.${k}.1, ENT-Foo${k}`);
    }
    const content = `---
phase: ${i}
status: Approved
---

# Phase ${i}

${ids.join('\n')}
`;
    await writeFile(join(dir, `${name}-phase.md`), content);
  }
}

async function fullRebuild(dir: string): Promise<{ nodes: number; edges: number; durationMs: number }> {
  const t0 = performance.now();
  const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();

  let nodes = 0;
  let edges = 0;
  for (const file of files) {
    const raw = await readFile(join(dir, file), 'utf8');
    // Force parse (we discard tree but pay AST cost)
    processor.parse(raw);
    // Headings as definitions
    nodes += (raw.match(/^##+\s+/gm) ?? []).length;
    // Citations
    edges += (raw.match(ID_RE) ?? []).length;
  }

  return { nodes, edges, durationMs: performance.now() - t0 };
}

async function incrementalRebuild(
  dir: string,
  changedFile: string,
): Promise<{ durationMs: number }> {
  const t0 = performance.now();
  const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);
  const raw = await readFile(join(dir, changedFile), 'utf8');
  processor.parse(raw);
  raw.match(ID_RE);
  return { durationMs: performance.now() - t0 };
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), 'graph-bench-'));
  console.log(`Spec dir: ${dir}`);

  await generateSpec(dir);
  const filesGenerated = (await readdir(dir)).length;
  console.log(`Generated ${filesGenerated} files with ~${TOTAL_IDS} IDs total\n`);

  console.log('=== Full rebuild (cold) — NFR-PERF-4 target <2000ms ===');
  const fullRuns = 5;
  let fullTotal = 0;
  let lastFull: Awaited<ReturnType<typeof fullRebuild>> | null = null;
  for (let i = 0; i < fullRuns; i++) {
    const r = await fullRebuild(dir);
    lastFull = r;
    fullTotal += r.durationMs;
    console.log(`  run ${i + 1}: ${r.durationMs.toFixed(0)}ms (nodes=${r.nodes}, edges=${r.edges})`);
  }
  const fullAvg = fullTotal / fullRuns;
  console.log(`  AVG: ${fullAvg.toFixed(0)}ms (target NFR-PERF-4 <2000, NFR-PERF-3 <3000)\n`);

  console.log('=== Incremental (1 file changed) — NFR-PERF-5 target <300ms ===');
  const incRuns = 5;
  let incTotal = 0;
  for (let i = 0; i < incRuns; i++) {
    const r = await incrementalRebuild(dir, '05-phase.md');
    incTotal += r.durationMs;
    console.log(`  run ${i + 1}: ${r.durationMs.toFixed(0)}ms`);
  }
  const incAvg = incTotal / incRuns;
  console.log(`  AVG: ${incAvg.toFixed(0)}ms\n`);

  console.log('=== Decision logic ===');
  const NFR_PERF_3 = 3000;
  if (fullAvg < NFR_PERF_3) {
    console.log(`  Full rebuild avg ${fullAvg.toFixed(0)}ms < ${NFR_PERF_3}ms threshold`);
    console.log('  → ADR-9 옵션 D 채택 권장: incremental 회수, T2.2 SKIP, TC-74 deferred, token 회수');
  } else {
    console.log(`  Full rebuild avg ${fullAvg.toFixed(0)}ms ≥ ${NFR_PERF_3}ms threshold`);
    console.log('  → ADR-9 옵션 A 유지: incremental 필요');
  }

  await rm(dir, { recursive: true, force: true });
}

await main();
