import { performance } from 'node:perf_hooks';
import { mkdtemp, writeFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import Ajv2020 from 'ajv/dist/2020.js';

const PHASES = 13;
const IDS_PER_PHASE = 80;
const ID_RE = /\b([RFS]\d+(?:\.\d+){0,2}|ENT-[A-Za-z0-9]+|INV-\d+)\b/g;

const ajv = new Ajv2020({ strict: false });
const schema = ajv.compile({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['phase', 'status'],
  properties: {
    phase: { type: 'integer', minimum: 1, maximum: 13 },
    status: { enum: ['Empty', 'Draft', 'Approved'] },
  },
});

async function generateSpec(dir: string) {
  await mkdir(dir, { recursive: true });
  for (let i = 1; i <= PHASES; i++) {
    const ids: string[] = [];
    for (let k = 1; k <= IDS_PER_PHASE; k++) {
      ids.push(`## R${i}.${k}: spec`);
      ids.push(`Body refs F${i}.${k}, INV-${k}`);
    }
    await writeFile(
      join(dir, String(i).padStart(2, '0') + '.md'),
      `---\nphase: ${i}\nstatus: Approved\n---\n# Phase ${i}\n${ids.join('\n')}\n`,
    );
  }
}

async function simulateHook(dir: string): Promise<number> {
  const t0 = performance.now();
  const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();

  const defined = new Set<string>();
  const cited = new Set<string>();

  for (const file of files) {
    const raw = await readFile(join(dir, file), 'utf8');
    const tree = processor.parse(raw);
    const yamlNode = (tree as any).children.find((c: any) => c.type === 'yaml');
    if (yamlNode) {
      const yaml = yamlNode.value;
      const phase = parseInt(yaml.match(/phase:\s*(\d+)/)?.[1] ?? '0', 10);
      const status = yaml.match(/status:\s*(\w+)/)?.[1] ?? '';
      schema({ phase, status });
    }
    let m: RegExpExecArray | null;
    const re = new RegExp(ID_RE);
    while ((m = re.exec(raw)) !== null) {
      const id = m[1];
      const start = m.index;
      const lineStart = raw.lastIndexOf('\n', start) + 1;
      const lineHead = raw.slice(lineStart, start);
      if (lineHead.match(/^#+\s/)) defined.add(id);
      else cited.add(id);
    }
  }
  const dangling = [...cited].filter((c) => !defined.has(c));
  void dangling.length;
  return performance.now() - t0;
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), 'hook-bench-'));
  await generateSpec(dir);
  console.log(`Generated ${PHASES} files with ${IDS_PER_PHASE} IDs each\n`);

  const runs = 5;
  const durations: number[] = [];
  for (let i = 0; i < runs; i++) {
    const ms = await simulateHook(dir);
    durations.push(ms);
    console.log('  run ' + (i + 1) + ': ' + ms.toFixed(0) + 'ms');
  }
  durations.sort((a, b) => a - b);
  const avg = durations.reduce((s, x) => s + x, 0) / runs;
  const p95 = durations[Math.floor(runs * 0.95)] ?? durations[runs - 1];
  console.log('\n=== NFR-PERF-3 (<3000ms) ===');
  console.log('  avg: ' + avg.toFixed(0) + 'ms');
  console.log('  p95: ' + p95.toFixed(0) + 'ms');
  console.log(avg < 3000 && p95 < 3000 ? '✓ 적정. 3s 한계 유지 권장.' : '✗ 위반.');
  await rm(dir, { recursive: true, force: true });
}

await main();
