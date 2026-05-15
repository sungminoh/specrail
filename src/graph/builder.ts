// F4.1 dep graph builder — ADR-4 unified/remark, ADR-9 옵션 D (on-demand)
// INV-1 unique ID detection, INV-2 dangling citation detection
// ADR-9 옵션 D 채택 (M0 spike T0.4 결과): full rebuild every commit
//   T2.2 incremental 제거됨. 매 호출 시 전체 parse — 28ms avg (NFR-PERF-4 충족).

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { visit, SKIP } from 'unist-util-visit';
import {
  CITATION_RE,
  isReservedId,
  ID_PATTERN_SOURCE,
  USER_NAMESPACE_PATTERN,
} from '../spec/patterns.js';

// Heading-form definition: ID at the start of a heading. Trailing form is
// `:` followed by title text, `\s+(` (e.g. `ENT-Change (DELTA mode)`), or
// end-of-heading (bare-ID headings like `### ENT-Project`).
const HEADING_DEF = /^([A-Z][A-Za-z0-9.\-_]+)(?::|\s+\(|\s*$)/;

// Validate that a captured token actually matches a known ID pattern.
// Prevents the verifier from accruing phantom "defined IDs" out of
// section headings like `## Status` or `## Decision` (architect review
// flagged 70+ such false positives in the dogfood baseline).
const VALID_ID_RE = new RegExp(
  `^(?:${ID_PATTERN_SOURCE}|${USER_NAMESPACE_PATTERN})$`,
);

function isValidSpecId(token: string): boolean {
  if (isReservedId(token)) return false;
  return VALID_ID_RE.test(token);
}

// US-002: cell-content ID pattern. The leading token must be a clean ID;
// optional `(...)` annotation immediately after is allowed so cells like
// `TC-63 (NFR-SEC-12)` extract `TC-63`. Cells with descriptive prose
// (`S1 Greenfield ...`) still do NOT match — the trailing optional group
// must be parens only.
const CELL_DEF_RE = new RegExp(
  `^(${ID_PATTERN_SOURCE}|${USER_NAMESPACE_PATTERN})(?:\\s+\\([^)]*\\))?$`,
);

// US-002: deftable marker recognised in an `html` sibling immediately
// preceding the table. Whitespace inside the comment is tolerated.
const DEFTABLE_MARKER_RE = /<!--\s*specrail:deftable\s*-->/;

// US-002: a header cell counts as an "ID column" header when its trimmed
// text starts or ends with the word `ID` (case-insensitive). Matches
// "ID", "Spec ID", "KPI ID", "지표 ID", "ID:" etc.
const HEADER_ID_TOKEN_RE = /(^|\s)ID\b|\bID(\s|$|:)/i;

// US-005: explicit annotation markers for citation suppression.
const IGNORE_START_RE = /<!--\s*specrail:ignore-start\s*-->/;
const IGNORE_END_RE = /<!--\s*specrail:ignore-end\s*-->/;
const IGNORE_SINGLE_RE = /<!--\s*specrail:ignore\s*-->/;

// `<!-- specrail:def-list -->` — when placed immediately before a bullet
// list, every list item whose paragraph text starts with a strict ID
// token is treated as a definition. Used for milestone task lists like
// `- T5.1 hook install entry point — ...` that author convention writes
// as bare-prefix bullets rather than `**T5.1:**` bold-prefix.
const DEFLIST_MARKER_RE = /<!--\s*specrail:def-list\s*-->/;

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
   * IDs declared inside `<!-- specrail:ignore-start --> ... ignore-end -->`
   * blocks. These are included in `definedIds` so INV-2 citation checks
   * don't dangle, but the verifier skips them when classifying intent vs
   * reality — they're authoring examples, not real spec definitions.
   */
  readonly illustrativeIds: ReadonlySet<string>;
  /**
   * True when docs/spec/ exists and was successfully read (even if empty).
   * False when docs/spec/ is missing — distinguishes 'project not initialized'
   * from 'initialized but empty' (US-T6.3, M6 silent failure fix).
   */
  readonly initialized: boolean;
}

// US-002/003: minimal structural type for AST nodes we inspect.
interface MdNode {
  type: string;
  value?: string;
  position?: { start: { line: number } };
  children?: MdNode[];
}

/**
 * US-002: Recursively concatenate text content of an AST node — used to
 * extract the raw textual content of a table cell or header.
 */
function getNodeText(node: MdNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  if (Array.isArray(node.children)) {
    return node.children.map((c) => getNodeText(c)).join('');
  }
  return '';
}

/**
 * US-002 (expanded): Return the column indices of a table that should be
 * parsed as ID definitions.
 *
 * - Every header cell whose text contains the word `ID` (e.g. `KPI ID`,
 *   `Spec ID`, `지표 ID`, `Q ID`, `TC ID`) marks its column as a def
 *   column. Multiple columns can be marked in a single table (e.g. the
 *   AC↔TC mapping table has both `AC ID` and `TC ID` headers).
 * - As a fallback, when an HTML comment sibling immediately preceding
 *   the table contains `specrail:deftable` and no header signal is
 *   present, column 0 is treated as a def column.
 * - Empty return = not a def table.
 *
 * The preceding-sibling scan skips earlier `html` siblings so a stack of
 * adjacent comments still triggers the marker, but stops at the first
 * non-`html` sibling so unrelated tables further up are not affected.
 */
function getDefTableColumns(parent: MdNode | undefined, index: number): number[] {
  if (!parent || !Array.isArray(parent.children)) return [];

  const table = parent.children[index];
  const headerRow = table?.children?.[0];
  const cols: number[] = [];

  if (headerRow?.type === 'tableRow' && Array.isArray(headerRow.children)) {
    headerRow.children.forEach((cell, i) => {
      if (HEADER_ID_TOKEN_RE.test(getNodeText(cell).trim())) cols.push(i);
    });
  }

  if (cols.length > 0) return cols;

  for (let j = index - 1; j >= 0; j--) {
    const sibling = parent.children[j];
    if (!sibling) break;
    if (sibling.type === 'html') {
      if (DEFTABLE_MARKER_RE.test(sibling.value ?? '')) return [0];
      continue;
    }
    break;
  }
  return [];
}

/**
 * `<!-- specrail:def-list -->` annotation lookup. Identical preceding-
 * sibling protocol to `getDefTableColumns`: stacks of html siblings are
 * tolerated; a non-html sibling terminates the lookback.
 */
function hasDefListAnnotation(
  parent: MdNode | undefined,
  index: number,
): boolean {
  if (!parent || !Array.isArray(parent.children)) return false;
  for (let j = index - 1; j >= 0; j--) {
    const sibling = parent.children[j];
    if (!sibling) break;
    if (sibling.type === 'html') {
      if (DEFLIST_MARKER_RE.test(sibling.value ?? '')) return true;
      continue;
    }
    break;
  }
  return false;
}

/**
 * US-006: Discover phase spec files. Top-level flat files (e.g.
 * `docs/spec/12-adr-risks.md`) are returned with their NN- prefix as the
 * phase id. NN-prefixed subdirectories (e.g. `docs/spec/12-adr-risks/`)
 * are descended one level deep — every `*.md` file inside inherits the
 * directory's NN as its phase id. The `file` field returned is relative
 * to the spec root so existing reporting stays human-readable.
 */
async function discoverSpecFiles(
  specDir: string,
): Promise<Array<{ file: string; phaseId: string; absPath: string }>> {
  const top = await readdir(specDir, { withFileTypes: true });
  const out: Array<{ file: string; phaseId: string; absPath: string }> = [];

  for (const ent of top) {
    if (!/^\d{2}/.test(ent.name)) continue;
    if (ent.isFile() && ent.name.endsWith('.md')) {
      out.push({
        file: ent.name,
        phaseId: ent.name.slice(0, 2),
        absPath: join(specDir, ent.name),
      });
    } else if (ent.isDirectory()) {
      const phaseId = ent.name.slice(0, 2);
      const subDir = join(specDir, ent.name);
      const subEntries = await readdir(subDir, { withFileTypes: true });
      for (const sub of subEntries) {
        if (sub.isFile() && sub.name.endsWith('.md')) {
          out.push({
            file: `${ent.name}/${sub.name}`,
            phaseId,
            absPath: join(subDir, sub.name),
          });
        }
      }
    }
  }
  out.sort((a, b) => a.file.localeCompare(b.file));
  return out;
}

export async function buildGraph(projectRoot: string): Promise<DependencyGraph> {
  const specDir = join(projectRoot, 'docs', 'spec');
  let files: Array<{ file: string; phaseId: string; absPath: string }>;
  try {
    files = await discoverSpecFiles(specDir);
  } catch {
    // docs/spec not initialized — return explicit signal so consumers can
    // distinguish 'not initialized' from 'initialized but empty' (vacuous truth)
    return {
      nodes: [],
      edges: [],
      danglingCitations: [],
      definedIds: new Set(),
      illustrativeIds: new Set(),
      initialized: false,
    };
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml']);
  const nodes: GraphNode[] = [];
  const edgesAll: GraphEdge[] = [];
  // IDs defined inside `<!-- specrail:ignore-start --> ... ignore-end -->`
  // blocks. Kept registered so INV-2 (citation must resolve) passes when
  // these IDs are referenced from other files, but excluded from the
  // verifier's intent-vs-reality matrix — they're authoring examples,
  // not real spec definitions.
  const illustrativeIds = new Set<string>();

  for (const entry of files) {
    const { file, phaseId, absPath } = entry;
    const raw = await readFile(absPath, 'utf8');
    const tree = processor.parse(raw);

    // Pre-pass: collect line ranges wrapped by `<!-- specrail:ignore-start -->`
    // ... `<!-- specrail:ignore-end -->` so def extractors can skip
    // illustrative entries (architecture-spec authors deliberately wrap
    // example IDs like ENT-Foo / R0 / KPI-5 in these blocks to keep them
    // out of the verifier's intent-vs-reality matrix). Previously only
    // the citation walker honoured these annotations — def extractors
    // captured them anyway, producing false-positive lies in the
    // honesty check.
    const ignoreRanges: Array<[number, number]> = [];
    {
      const stack: number[] = [];
      visit(tree, 'html', (n) => {
        const node = n as unknown as MdNode;
        const val = node.value ?? '';
        const line = node.position?.start.line ?? 0;
        if (IGNORE_START_RE.test(val)) stack.push(line);
        else if (IGNORE_END_RE.test(val) && stack.length > 0) {
          ignoreRanges.push([stack.pop() as number, line]);
        }
      });
    }
    const isInIgnoreRange = (line: number): boolean => {
      for (const [start, end] of ignoreRanges) {
        if (line >= start && line <= end) return true;
      }
      return false;
    };

    // 1a. Defined IDs (heading form): heading text starting with "ID:"
    visit(tree, 'heading', (n) => {
      const node = n as unknown as MdNode;
      const m = getNodeText(node).match(HEADING_DEF);
      if (!m) return;
      if (!isValidSpecId(m[1])) return; // phantom-ID guard
      const line = node.position?.start.line ?? 0;
      if (isInIgnoreRange(line)) {
        illustrativeIds.add(m[1]); // still registered so INV-2 doesn't dangle
        return;
      }
      nodes.push({
        specId: m[1],
        phaseId,
        definedAt: { file, line },
      });
    });

    // 1c. Defined IDs (bold-prefix, US-003): paragraphs OR list items
    // whose first inline child is a `strong` whose text matches the
    // bold-prefix def pattern. Used for AC-R{n}-{m}, INV-{n}, OPS-{n}
    // catalogue entries that author convention writes as bullet lists
    // (`- **AC-R1-1:** ...`) or block paragraphs (`**OPS-1 — Deploy 방식:** ...`).
    const BOLD_PREFIX_DEF = /^([A-Z][A-Za-z0-9.\-_]+)(?::|\s+[—\-]\s|\s*$)/;
    const tryBoldPrefixDef = (paragraph: MdNode | undefined, line: number) => {
      if (!paragraph || paragraph.type !== 'paragraph') return;
      const strong = paragraph.children?.[0];
      if (!strong || strong.type !== 'strong') return;
      const text = getNodeText(strong).trim();
      const m = text.match(BOLD_PREFIX_DEF);
      if (!m) return;
      if (!isValidSpecId(m[1])) return; // phantom-ID guard (rejects bold prose like **Status:** Open)
      if (isInIgnoreRange(line)) {
        illustrativeIds.add(m[1]);
        return;
      }
      nodes.push({ specId: m[1], phaseId, definedAt: { file, line } });
    };
    visit(tree, 'listItem', (item) => {
      const md = item as unknown as MdNode;
      tryBoldPrefixDef(md.children?.[0], md.position?.start.line ?? 0);
    });
    visit(tree, 'paragraph', (para, _i, parent) => {
      // Only top-level paragraphs — list-item paragraphs are handled above
      // (covered by listItem visit) and we don't want to double-count.
      if ((parent as unknown as MdNode)?.type === 'listItem') return;
      const md = para as unknown as MdNode;
      tryBoldPrefixDef(md, md.position?.start.line ?? 0);
    });

    // 1d. Defined IDs (def-list form, US-003 expansion): a list immediately
    // preceded by `<!-- specrail:def-list -->` is treated as a definition
    // list. Each list item whose first paragraph's first text begins with
    // a strict ID token (canonical taxonomy only — NOT user-namespace) is
    // recorded as a definition. Used for milestone task lists like
    // `- T5.1 hook install entry point — ...` that author convention
    // writes as bare-prefix bullets.
    const BULLET_LEADING_DEF_RE = new RegExp(`^(${ID_PATTERN_SOURCE})\\s`);
    visit(tree, 'list', (list, index, parent) => {
      if (index == null) return;
      if (!hasDefListAnnotation(parent as unknown as MdNode | undefined, index)) return;

      for (const item of (list as unknown as MdNode).children ?? []) {
        if (item.type !== 'listItem') continue;
        const para = item.children?.[0];
        if (!para || para.type !== 'paragraph') continue;
        const firstChild = para.children?.[0];
        if (!firstChild || firstChild.type !== 'text') continue;
        const text = (firstChild.value ?? '').trimStart();
        const m = text.match(BULLET_LEADING_DEF_RE);
        if (!m) continue;
        if (isReservedId(m[1])) continue;
        const line = item.position?.start.line ?? 0;
        if (isInIgnoreRange(line)) {
          illustrativeIds.add(m[1]);
          continue;
        }
        nodes.push({ specId: m[1], phaseId, definedAt: { file, line } });
      }
    });

    // 1b. Defined IDs (table form, US-002): body-row first cells of any
    // table that has been annotated as a definition table (either via
    // `<!-- specrail:deftable -->` preceding sibling or an "ID" header).
    // The cell text must equal the ID exactly — descriptive first cells
    // like "S1 Greenfield" are NOT counted as definitions.
    visit(tree, 'table', (table, index, parent) => {
      if (index == null) return;
      const mdParent = parent as unknown as MdNode | undefined;
      const defColumns = getDefTableColumns(mdParent, index);
      if (defColumns.length === 0) return;

      const rows = (table as unknown as MdNode).children ?? [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.type !== 'tableRow') continue;
        for (const colIdx of defColumns) {
          const cell = row.children?.[colIdx];
          if (!cell) continue;
          const text = getNodeText(cell).trim();
          const m = text.match(CELL_DEF_RE);
          if (!m) continue;
          if (isReservedId(m[1])) continue;
          const line = row.position?.start.line ?? 0;
          if (isInIgnoreRange(line)) {
            illustrativeIds.add(m[1]);
            continue;
          }
          nodes.push({ specId: m[1], phaseId, definedAt: { file, line } });
        }
      }
    });

    // 2. Citations (US-004/005): AST walk over text + inlineCode nodes,
    // skipping fenced code (`code` node), frontmatter (`yaml` node),
    // definition headings, and any subtree inside a specrail:ignore
    // annotation block.
    let ignoreDepth = 0;
    let ignoreSingleShotPending = false;

    visit(tree, (node) => {
      const n = node as unknown as MdNode;

      // html nodes: adjust annotation state if applicable. CommonMark folds
      // trailing same-line prose INTO an html block, so non-annotated html
      // values may still contain real citation content (e.g.
      // `<!-- TODO --> Cites R1.`). Scan the comment-stripped remainder.
      if (n.type === 'html') {
        const val = n.value ?? '';
        let isAnnotated = false;
        if (IGNORE_START_RE.test(val)) {
          ignoreDepth++;
          isAnnotated = true;
        } else if (IGNORE_END_RE.test(val)) {
          ignoreDepth = Math.max(0, ignoreDepth - 1);
          isAnnotated = true;
        } else if (IGNORE_SINGLE_RE.test(val)) {
          ignoreSingleShotPending = true;
          isAnnotated = true;
        }

        if (!isAnnotated && ignoreDepth === 0 && !ignoreSingleShotPending) {
          const stripped = val.replace(/<!--[\s\S]*?-->/g, ' ');
          const re = new RegExp(CITATION_RE.source, CITATION_RE.flags);
          for (const m of stripped.matchAll(re)) {
            if (isReservedId(m[1])) continue;
            edgesAll.push({
              from: phaseId,
              to: m[1],
              citedAt: { file, line: n.position?.start.line ?? 0 },
            });
          }
        }
        return SKIP;
      }

      // Single-shot ignore consumes the very next non-html node and
      // suppresses its entire subtree.
      if (ignoreSingleShotPending) {
        ignoreSingleShotPending = false;
        return SKIP;
      }

      if (ignoreDepth > 0) return SKIP;

      // Fenced code blocks and YAML frontmatter are template / metadata
      // content — never citations.
      if (n.type === 'code' || n.type === 'yaml') return SKIP;

      // Definition headings are not citations of themselves (INV-6).
      // Non-definition headings still allow citation extraction inside.
      // Only treat as a real def-heading when the leading token validates
      // as a spec ID — phantom matches like `## Status:` must NOT skip
      // the heading's citations.
      if (n.type === 'heading') {
        const headingText = getNodeText(n);
        const m = headingText.match(HEADING_DEF);
        if (m && isValidSpecId(m[1])) return SKIP;
      }

      // ID extraction happens at leaf text / inlineCode nodes only.
      if (n.type === 'text' || n.type === 'inlineCode') {
        const value = n.value ?? '';
        const re = new RegExp(CITATION_RE.source, CITATION_RE.flags);
        for (const m of value.matchAll(re)) {
          if (isReservedId(m[1])) continue;
          edgesAll.push({
            from: phaseId,
            to: m[1],
            citedAt: { file, line: n.position?.start.line ?? 0 },
          });
        }
      }
    });

    if (ignoreDepth > 0) {
      process.stderr.write(
        `[graph] warning: unclosed <!-- specrail:ignore-start --> in ${file} ` +
          `— citations suppressed through end of file.\n`,
      );
    }
  }

  // Union of real defs and illustrative defs — INV-2 must see both
  // (a citation `R0` in another file should resolve even though R0 lives
  // inside an ignore-block and is excluded from the verifier).
  const definedIds = new Set<string>([
    ...nodes.map((n) => n.specId),
    ...illustrativeIds,
  ]);

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

  return { nodes, edges, danglingCitations, definedIds, illustrativeIds, initialized: true };
}
