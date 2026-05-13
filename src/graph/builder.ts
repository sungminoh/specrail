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

// US-T6.5 (M6): Markdown heading line that defines an ID — must be excluded
// from citation scan so 'ID: title' doesn't self-cite (INV-6 bypass fix).
const MARKDOWN_HEADING_LINE = /^#+\s+[A-Z][A-Za-z0-9.\-_]+:\s/;

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
  /**
   * True when docs/spec/ exists and was successfully read (even if empty).
   * False when docs/spec/ is missing — distinguishes 'project not initialized'
   * from 'initialized but empty' (US-T6.3, M6 silent failure fix).
   */
  readonly initialized: boolean;
}

interface HeadingNode {
  type: 'heading';
  position?: { start: { line: number } };
  children: Array<{ value?: string }>;
}

/**
 * Strips lines that are inside fenced code blocks or HTML comments.
 * Returns an array of booleans: true = line should be skipped for citation scan.
 *
 * Fence tracking: uses the opening fence character and length so that nested
 * fences of different lengths (e.g. 4-backtick outer + 3-backtick inner) do
 * not incorrectly toggle the state.
 */
function buildSkipMask(lines: string[]): boolean[] {
  const skip: boolean[] = new Array(lines.length).fill(false);
  let fenceChar: string | null = null;
  let fenceLen = 0;
  let inHtmlComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // HTML block comment tracking (single-line or multi-line)
    if (!inHtmlComment && line.includes('<!--')) {
      inHtmlComment = true;
    }
    if (inHtmlComment) {
      skip[i] = true;
      if (line.includes('-->')) inHtmlComment = false;
      continue;
    }

    // Fenced code block tracking
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const ch = fenceMatch[1][0];
      const len = fenceMatch[1].length;
      if (fenceChar === null) {
        // Opening fence
        fenceChar = ch;
        fenceLen = len;
        skip[i] = true;
      } else if (ch === fenceChar && len >= fenceLen) {
        // Closing fence (same char, same or longer length)
        skip[i] = true;
        fenceChar = null;
        fenceLen = 0;
      } else {
        // Inner fence of different length/char — skip content
        skip[i] = true;
      }
      continue;
    }

    if (fenceChar !== null) {
      skip[i] = true;
    }
  }

  return skip;
}

export async function buildGraph(projectRoot: string): Promise<DependencyGraph> {
  const specDir = join(projectRoot, 'docs', 'spec');
  let files: string[];
  try {
    files = (await readdir(specDir))
      .filter((f) => /^\d{2}.*\.md$/.test(f))
      .sort();
  } catch {
    // docs/spec not initialized — return explicit signal so consumers can
    // distinguish 'not initialized' from 'initialized but empty' (vacuous truth)
    return { nodes: [], edges: [], danglingCitations: [], definedIds: new Set(), initialized: false };
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
    // Skip HTML comments and fenced code blocks — these contain template
    // examples and diagram node labels, not real cross-phase citations.
    // (D11 fix: avoid false-positive dangling from template bodies)
    const lines = raw.split('\n');
    const skip = buildSkipMask(lines);
    lines.forEach((line, idx) => {
      if (skip[idx]) return;
      // US-T6.5 (M6): Heading definition lines define the ID, not cite it.
      // Skip them to prevent self-edges that bypass INV-6 (downstream != 0).
      if (MARKDOWN_HEADING_LINE.test(line)) return;
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

  return { nodes, edges, danglingCitations, definedIds, initialized: true };
}
