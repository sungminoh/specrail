// F4.1 dep graph builder — ADR-4 unified/remark, ADR-9 옵션 D (on-demand)
// INV-1 unique ID detection, INV-2 dangling citation detection
// ADR-9 옵션 D 채택 (M0 spike T0.4 결과): full rebuild every commit
//   T2.2 incremental 제거됨. 매 호출 시 전체 parse — 28ms avg (NFR-PERF-4 충족).

import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';

const HEADING_DEF = /^([A-Z][A-Za-z0-9.\-_]+):\s/;

const ID_RE =
  /\b([RFS]\d+(?:\.\d+){0,2}|ENT-[A-Za-z0-9_]+|INV-\d+|NFR-[A-Z]+-\d+|ARCH-\d+|EXT-\d+|OPS-\d+|ADR-\d+|RISK-\d+|TC-\d+|EDGE-\d+|AC-R\d+-\d+|T\d+\.\d+)\b/g;

export interface GraphNode {
  readonly specId: string;
  readonly phaseId: string;
  readonly definedAt: { file: string; line: number };
}

export interface GraphEdge {
  readonly from: string; // phase id
  readonly to: string;   // spec id cited
  readonly citedAt: { file: string; line: number };
}

export interface DependencyGraph {
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
  readonly danglingCitations: { from: string; to: string }[];
  readonly definedIds: Set<string>;
}

interface HeadingNode {
  type: 'heading';
  position?: { start: { line: number } };
  children: Array<{ value?: string }>;
}

export async function buildGraph(projectRoot: string): Promise<DependencyGraph> {
  const specDir = join(projectRoot, 'docs', 'spec');
  let files: string[];
  try {
    files = (await readdir(specDir))
      .filter((f) => /^\d{2}.*\.md$/.test(f))
      .sort();
  } catch {
    return { nodes: [], edges: [], danglingCitations: [], definedIds: new Set() };
  }

  const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);
  const nodes: GraphNode[] = [];
  const edgesAll: GraphEdge[] = [];

  for (const file of files) {
    const phaseId = basename(file).slice(0, 2);
    const raw = await readFile(join(specDir, file), 'utf8');
    const tree = processor.parse(raw);

    // 1. Defined IDs: heading text starting with "ID:"
    visit(tree, 'heading', (n) => {
      const node = n as unknown as HeadingNode;
      const text = node.children.map((c) => c.value ?? '').join('');
      const m = text.match(HEADING_DEF);
      if (m) {
        nodes.push({
          specId: m[1],
          phaseId,
          definedAt: { file, line: node.position?.start.line ?? 0 },
        });
      }
    });

    // 2. Citations: every ID pattern in body
    const lines = raw.split('\n');
    lines.forEach((line, idx) => {
      const re = new RegExp(ID_RE);
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        edgesAll.push({
          from: phaseId,
          to: m[1],
          citedAt: { file, line: idx + 1 },
        });
      }
    });
  }

  const definedIds = new Set(nodes.map((n) => n.specId));

  // Edges: 인용 중에서 같은 file에 정의 안 됨 + 정의된 ID 있음 — 즉 cross-phase refs
  // dangling: 어디에도 정의 안 됨 (INV-2 위반)
  const edges = edgesAll.filter((e) => definedIds.has(e.to));
  const danglingCitations: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  for (const e of edgesAll) {
    if (!definedIds.has(e.to)) {
      const key = `${e.from}::${e.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        danglingCitations.push({ from: e.from, to: e.to });
      }
    }
  }

  return { nodes, edges, danglingCitations, definedIds };
}
