// Spec ID extraction + classification. Pure regex; mirrors packages/plugin/src/spec/patterns.ts.
const ID_PATTERN = new RegExp(
  [
    '\\b(',
    '[RFS]\\d+(?:\\.\\d+){0,2}', // R1, F1.2, S1.2.3
    '|T\\d+(?:\\.\\d+)?',
    '|NFR-[A-Z][A-Z0-9]*-\\d+',
    '|TC-\\d+',
    '|EDGE-\\d+',
    '|AC-R\\d+-\\d+',
    '|INV-\\d+',
    '|ADR-\\d+',
    '|RISK-\\d+',
    '|OPS-\\d+',
    '|OQ-\\d+-\\d+',
    '|ARCH-\\d+',
    '|EXT-\\d+',
    '|KPI-\\d+',
    '|PAIN-[A-Z0-9_-]*\\d?',
    '|PERSONA-(?:EDGE-)?\\d+',
    '|PERSONA-[A-Z]+(?:-\\d+)?',
    '|SCEN-\\d+',
    '|JNY-\\d+\\.\\d+',
    '|ZN-[A-Z][A-Z0-9-]*-\\d+',
    '|P-CC-\\d+',
    '|E-CC-\\d+',
    '|W-CC-[A-Z][A-Z0-9_-]*',
    '|FLN-\\d+',
    '|FLE-\\d+',
    ')\\b',
  ].join(''),
  'g',
);

/** Extract all unique spec IDs from text (preserves first-occurrence order). */
export function extractIds(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of text.matchAll(ID_PATTERN)) {
    const id = m[1];
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

const HEADING_LINE_RE = /^(#{1,6})\s+(.+)$/gm;
const ATTRS_ID_RE = /<!--\s*specrail:attrs\s+id=([^\s>]+)\s*-->/g;
const ID_AT_START = new RegExp(
  '^\\*{0,2}(' +
    '[RFS]\\d+(?:\\.\\d+){0,2}|T\\d+(?:\\.\\d+)?|NFR-[A-Z][A-Z0-9]*-\\d+|TC-\\d+|EDGE-\\d+|AC-R\\d+-\\d+|INV-\\d+|ADR-\\d+|RISK-\\d+|OPS-\\d+|OQ-\\d+-\\d+|ARCH-\\d+|EXT-\\d+|KPI-\\d+|PAIN-[A-Z0-9_-]*\\d?|PERSONA-(?:EDGE-)?\\d+|PERSONA-[A-Z]+(?:-\\d+)?|SCEN-\\d+|JNY-\\d+\\.\\d+|ZN-[A-Z][A-Z0-9-]*-\\d+|P-CC-\\d+|E-CC-\\d+|W-CC-[A-Z][A-Z0-9_-]*|FLN-\\d+|FLE-\\d+' +
    ')\\b',
);

/**
 * Extract IDs that are DEFINED in this text. Definitions come from:
 *   - Heading lines starting with the ID (e.g. "## R1: Spec view")
 *   - <!-- specrail:attrs id=X --> markers
 *
 * Stricter than extractIds — used for graph build where "defined" matters.
 */
export function extractDefinedIds(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of text.matchAll(HEADING_LINE_RE)) {
    const heading = m[2] ?? '';
    const idMatch = heading.match(ID_AT_START);
    if (!idMatch || !idMatch[1]) continue;
    const id = idMatch[1];
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const m of text.matchAll(ATTRS_ID_RE)) {
    const id = m[1];
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** Extract refs with line numbers from text. line is 1-based. */
export function extractRefs(
  text: string,
  options: { definedIds: Set<string>; from: string },
): Array<{ from: string; to: string; line: number }> {
  const out: Array<{ from: string; to: string; line: number }> = [];
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    for (const m of line.matchAll(ID_PATTERN)) {
      const id = m[1];
      if (!id) continue;
      // Skip self
      if (id === options.from) continue;
      out.push({ from: options.from, to: id, line: idx + 1 });
    }
  });
  return out;
}

const KIND_PATTERN: ReadonlyArray<readonly [RegExp, string]> = [
  [/^AC-/, 'AC'],
  [/^NFR-/, 'NFR'],
  [/^TC-/, 'TC'],
  [/^EDGE-/, 'EDGE'],
  [/^INV-/, 'INV'],
  [/^ADR-/, 'ADR'],
  [/^RISK-/, 'RISK'],
  [/^OPS-/, 'OPS'],
  [/^OQ-/, 'OQ'],
  [/^ARCH-/, 'ARCH'],
  [/^EXT-/, 'EXT'],
  [/^KPI-/, 'KPI'],
  [/^PAIN-/, 'PAIN'],
  [/^PERSONA-/, 'PERSONA'],
  [/^SCEN-/, 'SCEN'],
  [/^JNY-/, 'JNY'],
  [/^ZN-/, 'ZN'],
  [/^P-CC-/, 'P-CC'],
  [/^E-CC-/, 'E-CC'],
  [/^W-CC-/, 'W-CC'],
  [/^FLN-/, 'FLN'],
  [/^FLE-/, 'FLE'],
  [/^T\d/, 'T'],
  [/^R\d/, 'R'],
  [/^F\d/, 'F'],
  [/^S\d/, 'S'],
];

/** Classify an ID into its entity kind. Returns null when unknown. */
export function classifyKind(id: string): string | null {
  for (const [re, kind] of KIND_PATTERN) {
    if (re.test(id)) return kind;
  }
  return null;
}
