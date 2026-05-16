// T-CSA.1 — attrs block parser
// Linked AC: AC-R-CSA-2 (id mismatch lint)
// Spec: docs/spec/changes/2026-05-15-core-schema-attrs/proposal.md §3.1
//
// Marker convention:
//   <!-- specrail:attrs id=ENTITY-ID -->
//   ```yaml
//   key: value
//   ```
//   <!-- /specrail:attrs -->

import { parse as parseYaml } from './yaml.js';

export interface AttrsBlock {
  entityId: string;
  payload: Record<string, unknown>;
  lineRange: { start: number; end: number };
  sourceFile?: string;
}

export type AttrsDiagnosticKind =
  | 'invalid-yaml'
  | 'unclosed-marker'
  | 'missing-yaml-fence'
  | 'duplicate-id';

export interface AttrsParseDiagnostic {
  kind: AttrsDiagnosticKind;
  entityId: string;
  line: number;
  message: string;
}

export interface AttrsParseResult {
  blocks: AttrsBlock[];
  diagnostics: AttrsParseDiagnostic[];
}

const OPEN_RE = /^<!--\s*specrail:attrs\s+id=([^\s>]+)\s*-->\s*$/;
const CLOSE_RE = /^<!--\s*\/specrail:attrs\s*-->\s*$/;
const FENCE_OPEN_RE = /^```ya?ml\s*$/;
const FENCE_CLOSE_RE = /^```\s*$/;

export function parseAttrsBlocks(raw: string, sourceFile?: string): AttrsParseResult {
  const lines = raw.split('\n');
  const blocks: AttrsBlock[] = [];
  const diagnostics: AttrsParseDiagnostic[] = [];
  const seenIds = new Set<string>();

  let i = 0;
  while (i < lines.length) {
    const openMatch = lines[i].match(OPEN_RE);
    if (!openMatch) {
      i++;
      continue;
    }

    const entityId = openMatch[1];
    const openLine = i + 1; // 1-based
    const closeIdx = findMatchingClose(lines, i + 1);

    if (closeIdx === -1) {
      diagnostics.push({
        kind: 'unclosed-marker',
        entityId,
        line: openLine,
        message: `attrs block for ${entityId} opened at line ${openLine} but no closing <!-- /specrail:attrs --> found`,
      });
      i++;
      continue;
    }

    const inner = lines.slice(i + 1, closeIdx);
    const yamlBody = extractYamlFence(inner);

    if (yamlBody === null) {
      diagnostics.push({
        kind: 'missing-yaml-fence',
        entityId,
        line: openLine,
        message: `attrs block for ${entityId} (line ${openLine}) has no fenced \`\`\`yaml … \`\`\` body`,
      });
      i = closeIdx + 1;
      continue;
    }

    let payload: Record<string, unknown>;
    try {
      const malformed = findMalformedLine(yamlBody);
      if (malformed !== null) {
        throw new Error(`malformed YAML line ${malformed.offset}: ${malformed.line}`);
      }
      const parsed = parseYaml(yamlBody);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('YAML payload must be a key-value object');
      }
      payload = parsed as Record<string, unknown>;
    } catch (err) {
      diagnostics.push({
        kind: 'invalid-yaml',
        entityId,
        line: openLine,
        message: `attrs block for ${entityId} (line ${openLine}): ${(err as Error).message}`,
      });
      i = closeIdx + 1;
      continue;
    }

    if (seenIds.has(entityId)) {
      diagnostics.push({
        kind: 'duplicate-id',
        entityId,
        line: openLine,
        message: `duplicate attrs block id=${entityId} at line ${openLine}; first definition kept`,
      });
      i = closeIdx + 1;
      continue;
    }

    seenIds.add(entityId);
    blocks.push({
      entityId,
      payload,
      lineRange: { start: openLine, end: closeIdx + 1 },
      sourceFile,
    });
    i = closeIdx + 1;
  }

  return { blocks, diagnostics };
}

function findMatchingClose(lines: string[], startIdx: number): number {
  for (let j = startIdx; j < lines.length; j++) {
    if (CLOSE_RE.test(lines[j])) return j;
    // No nested attrs blocks — encountering a new opener before close = unclosed.
    if (OPEN_RE.test(lines[j])) return -1;
  }
  return -1;
}

// Top-level kv line: starts in column 0, key matches yaml.ts kvMatch pattern.
const KV_LINE_RE = /^[A-Za-z_][\w-]*\s*:\s*.*$/;
// Array continuation: indented + dash + space + value.
const ARRAY_LINE_RE = /^\s+-\s+.*$/;

/**
 * Detect lines that look like YAML content but don't match the minimal parser's
 * grammar (top-level kv or array continuation). Compensates for yaml.ts being
 * permissive (silently skips unrecognised lines).
 */
function findMalformedLine(yamlBody: string): { offset: number; line: string } | null {
  const lines = yamlBody.split('\n');
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k];
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    if (KV_LINE_RE.test(line)) continue;
    if (ARRAY_LINE_RE.test(line)) continue;
    return { offset: k + 1, line };
  }
  return null;
}

function extractYamlFence(inner: string[]): string | null {
  let fenceStart = -1;
  for (let j = 0; j < inner.length; j++) {
    if (FENCE_OPEN_RE.test(inner[j])) {
      fenceStart = j;
      break;
    }
    // Allow blank lines between marker and fence.
    if (inner[j].trim() === '') continue;
    // Any other content before fence = no fenced yaml.
    return null;
  }
  if (fenceStart === -1) return null;

  for (let j = fenceStart + 1; j < inner.length; j++) {
    if (FENCE_CLOSE_RE.test(inner[j])) {
      return inner.slice(fenceStart + 1, j).join('\n');
    }
  }
  return null;
}
