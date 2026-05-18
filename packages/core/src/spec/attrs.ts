// Attrs-block parsing — surfaces TYPED relationships from <!-- specrail:attrs --> blocks.
//
// schemas/attrs.schema.json defines 8 closed-enum edge kinds:
//   solves, linked-features, parent, tested-by, covers-ac,
//   mitigates, linked-arch, depends-on
//
// Plus a small set of well-known scalar fields we surface for the dashboard:
//   status (Draft|Approved|Rejected|…), importance, owner.
//
// Pure regex / line scan — no yaml runtime dependency.

const ATTRS_OPEN = /<!--\s*specrail:attrs\s+id=([^\s>]+)\s*-->/;
const ATTRS_CLOSE = /<!--\s*\/specrail:attrs\s*-->/;

// Schema-defined closed enum (schemas/attrs.schema.json) + the qualified variants
// the dashboard spec actually uses in practice (`parent-f` / `parent-r`, `linked-r` etc.).
// Kept as a single flat list so the kind is preserved end-to-end (UI groups by prefix).
export const EDGE_KINDS = [
  // Schema-defined closed enum:
  'solves',
  'linked-features',
  'parent',
  'tested-by',
  'covers-ac',
  'mitigates',
  'linked-arch',
  'depends-on',
  // Common qualified variants (kept distinct so UI can render meaningfully):
  'parent-f',
  'parent-r',
  'parent-zone',
  'linked-ac',
  'linked-r',
  'solves-pains',
] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number];
const EDGE_KIND_SET = new Set<string>(EDGE_KINDS);

/** A relationship surfaced from an attrs block. `kind` is one of EDGE_KINDS. */
export interface TypedRef {
  from: string;
  to: string;
  kind: EdgeKind;
  line: number;
}

export interface AttrsScalars {
  status?: string;
  importance?: string;
  owner?: string;
}

export interface AttrsBlock {
  id: string;
  /** 1-based line of the opening `<!-- specrail:attrs id=… -->` marker. */
  startLine: number;
  scalars: AttrsScalars;
}

const SCALAR_KEYS = new Set(['status', 'importance', 'owner']);
const ID_TOKEN_RE = /[A-Z][A-Za-z0-9\-.]*\d/g;

/**
 * Parse all attrs blocks in body. Returns one entry per defined-by-attrs id.
 * The order matches first-occurrence in the document.
 */
export function parseAttrsBlocks(body: string): AttrsBlock[] {
  const out: AttrsBlock[] = [];
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const m = line.match(ATTRS_OPEN);
    if (!m) { i += 1; continue; }
    const id = m[1];
    if (!id) { i += 1; continue; }
    const startLine = i + 1;
    const scalars: AttrsScalars = {};
    let j = i + 1;
    while (j < lines.length) {
      const inner = lines[j] ?? '';
      if (ATTRS_CLOSE.test(inner)) break;
      const stripped = inner.trim();
      if (stripped && !stripped.startsWith('```')) {
        const kv = stripped.match(/^([a-z][a-z0-9_-]*)\s*:\s*(.+)$/i);
        if (kv) {
          const key = kv[1]?.toLowerCase() ?? '';
          if (SCALAR_KEYS.has(key)) {
            const raw = (kv[2] ?? '').trim();
            const value = stripQuotes(raw);
            if (value) (scalars as Record<string, string>)[key] = value;
          }
        }
      }
      j += 1;
    }
    out.push({ id, startLine, scalars });
    i = j + 1;
  }
  return out;
}

/**
 * Extract typed refs from attrs blocks. Each entry corresponds to a single
 * edge: one source id (the attrs-block id) → one target id, with a kind tag.
 *
 * Lists are parsed liberally: `linked-arch: [ARCH-4, ARCH-7]` and
 *   `tested-by:\n  - TC-12\n  - TC-13`
 * both produce one ref per id.
 */
export function extractTypedRefs(body: string): TypedRef[] {
  const out: TypedRef[] = [];
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const m = line.match(ATTRS_OPEN);
    if (!m) { i += 1; continue; }
    const from = m[1];
    if (!from) { i += 1; continue; }
    let j = i + 1;
    let activeKey: EdgeKind | null = null;
    while (j < lines.length) {
      const inner = lines[j] ?? '';
      if (ATTRS_CLOSE.test(inner)) break;
      const stripped = inner.trim();
      if (stripped.startsWith('```') || !stripped) { j += 1; continue; }

      // Detect key:value start.
      const kv = stripped.match(/^([a-z][a-z0-9_-]*)\s*:\s*(.*)$/i);
      if (kv) {
        const key = (kv[1] ?? '').toLowerCase();
        const rest = (kv[2] ?? '').trim();
        activeKey = EDGE_KIND_SET.has(key) ? (key as EdgeKind) : null;
        if (activeKey && rest) {
          collectIds(rest, (id) => out.push({ from, to: id, kind: activeKey!, line: j + 1 }));
        }
        j += 1;
        continue;
      }

      // Continuation: bullet list of ids under previously seen key.
      if (activeKey && /^[-*]\s+/.test(stripped)) {
        const after = stripped.replace(/^[-*]\s+/, '');
        collectIds(after, (id) => out.push({ from, to: id, kind: activeKey!, line: j + 1 }));
      }
      j += 1;
    }
    i = j + 1;
  }
  return out;
}

function collectIds(text: string, push: (id: string) => void): void {
  // Trim surrounding [ ] brackets, quotes, and split on commas (yaml inline list).
  const cleaned = text.replace(/^\[|\]$/g, '');
  for (const piece of cleaned.split(',')) {
    const tok = piece.trim().replace(/^['"]|['"]$/g, '');
    if (!tok) continue;
    // A piece may be a bare id or contain other text; scan for ID tokens.
    for (const m of tok.matchAll(ID_TOKEN_RE)) {
      const id = m[0];
      if (id) push(id);
    }
  }
}

function stripQuotes(s: string): string {
  return s.replace(/^['"]|['"]$/g, '').trim();
}
