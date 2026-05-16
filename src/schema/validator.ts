// ADR-2 JSON Schema (Draft 2020-12) + ajv
// F1.1 frontmatter schema per phase
// F2.4 schema validation hook 차용

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ajv = new Ajv2020({ allErrors: true, strict: false });
// D3 fix (4차 reviewer document-specialist): register format validators
// `format: "date-time"`·"uri"·"email" 등이 silent bypass 안 되게 함
addFormats(ajv);

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

const VALIDATOR_CACHE_MAX = 50; // 13 phase + change-proposal + headroom

interface CacheEntry {
  fn: ValidateFunction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any>;
}

const cache = new Map<string, CacheEntry>();

async function getValidator(schemaPath: string): Promise<ValidateFunction> {
  const cached = cache.get(schemaPath);
  if (cached) return cached.fn;

  if (cache.size >= VALIDATOR_CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      const oldest = cache.get(oldestKey)!;
      try { ajv.removeSchema(oldest.schema); } catch { /* ignore */ }
      cache.delete(oldestKey);
    }
  }

  const raw = await readFile(schemaPath, 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const schema = JSON.parse(raw);
  const fn = ajv.compile(schema);
  cache.set(schemaPath, { fn, schema });
  return fn;
}

/** @deprecated Use getValidator internally; kept for backward compat */
export async function loadSchema(schemaPath: string): Promise<ValidateFunction> {
  return getValidator(schemaPath);
}

/** Reset validator cache and ajv schema registry (test helper) */
export function _resetValidatorCache(): void {
  for (const entry of cache.values()) {
    try { ajv.removeSchema(entry.schema); } catch { /* ignore */ }
  }
  cache.clear();
  _resetAttrsCacheInner();
}

function _resetAttrsCacheInner(): void {
  if (attrsCache) {
    for (const fn of attrsCache.byKind.values()) {
      try { ajv.removeSchema(fn.schema as object); } catch { /* ignore */ }
    }
    attrsCache = null;
  }
}

export async function validateFrontmatter(
  frontmatter: object,
  schemaPath: string,
): Promise<ValidationResult> {
  const validate = await getValidator(schemaPath);
  const valid = validate(frontmatter);
  return { valid: !!valid, errors: validate.errors ?? [] };
}

export function getSchemaPath(filename: string): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'schemas', filename);
}

// -----------------------------------------------------------------------------
// T-CSA.2 — attrs block schema validation
// Per docs/spec/changes/2026-05-15-core-schema-attrs/proposal.md §3.4 + §5.
// Linked AC: AC-R-CSA-2 (id mismatch lint), AC-R-CSA-4 (unknown kind ERROR).
// -----------------------------------------------------------------------------

export type AttrsEntityKind =
  | 'R' | 'F' | 'S'
  | 'ENT' | 'INV' | 'NFR' | 'ARCH' | 'EXT' | 'OPS'
  | 'ADR' | 'RISK' | 'TC' | 'EDGE' | 'OQ'
  | 'PERSONA' | 'SCEN' | 'JNY' | 'ZN' | 'KPI' | 'P-CC' | 'T';

export const ATTRS_ENTITY_KINDS: readonly AttrsEntityKind[] = [
  'R', 'F', 'S', 'ENT', 'INV', 'NFR', 'ARCH', 'EXT', 'OPS',
  'ADR', 'RISK', 'TC', 'EDGE', 'OQ',
  'PERSONA', 'SCEN', 'JNY', 'ZN', 'KPI', 'P-CC', 'T',
];

/**
 * Resolve entity kind from canonical ID string.
 *
 * Order matters: longer/more-specific prefixes checked before shorter ones
 * (e.g. `F-R{n}.{m}` must match `F` before `R{n}` regex catches `R{n}.{m}`).
 */
export function classifyEntityKind(id: string): AttrsEntityKind | null {
  if (/^F-R(?:-[A-Z]+[A-Z0-9]*|\d+)\.\d+$/.test(id)) return 'F';
  if (/^P-CC-\d+$/.test(id)) return 'P-CC';
  if (/^ENT-[A-Za-z][A-Za-z0-9_-]*$/.test(id)) return 'ENT';
  if (/^INV-\d+$/.test(id)) return 'INV';
  if (/^NFR-[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-\d+$/.test(id)) return 'NFR';
  if (/^ARCH-\d+$/.test(id)) return 'ARCH';
  if (/^EXT-\d+$/.test(id)) return 'EXT';
  if (/^OPS-(?:CSA-)?\d+$/.test(id) || /^OPS-[A-Z]+-\d+$/.test(id)) return 'OPS';
  if (/^ADR-\d+$/.test(id)) return 'ADR';
  if (/^RISK-(?:CSA-)?\d+$/.test(id) || /^RISK-[A-Z]+-\d+$/.test(id)) return 'RISK';
  if (/^TC-\d+$/.test(id)) return 'TC';
  if (/^EDGE-\d+$/.test(id)) return 'EDGE';
  if (/^OQ-[A-Za-z0-9]+-\d+$/.test(id)) return 'OQ';
  if (/^PERSONA(?:-EDGE)?-\d+$/.test(id)) return 'PERSONA';
  if (/^SCEN-\d+$/.test(id)) return 'SCEN';
  if (/^JNY-\d+\.\d+$/.test(id)) return 'JNY';
  if (/^ZN-[A-Z0-9-]+-\d+$/.test(id)) return 'ZN';
  if (/^KPI(?:-VIZ)?-\d+$/.test(id)) return 'KPI';
  if (/^R(?:-[A-Z]+[A-Z0-9]*|\d+)$/.test(id)) return 'R';
  if (/^S\d+\.\d+\.\d+$/.test(id)) return 'S';
  if (/^T(?:-CSA)?\.\d+$/.test(id) || /^T-CSA\.\d+$/.test(id) || /^T\d+\.\d+$/.test(id)) return 'T';
  return null;
}

interface AttrsCacheEntry {
  schema: Record<string, unknown>;
  byKind: Map<AttrsEntityKind, ValidateFunction>;
}
let attrsCache: AttrsCacheEntry | null = null;

async function getAttrsSchemaValidator(kind: AttrsEntityKind): Promise<ValidateFunction | null> {
  if (!attrsCache) {
    const path = getSchemaPath('attrs.schema.json');
    const raw = await readFile(path, 'utf8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = JSON.parse(raw) as Record<string, unknown>;
    attrsCache = { schema, byKind: new Map() };
  }
  const cached = attrsCache.byKind.get(kind);
  if (cached) return cached;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const defs = (attrsCache.schema as { $defs?: Record<string, unknown> }).$defs ?? {};
  if (!(kind in defs)) return null;

  // Build a per-kind sub-schema embedded in the root (preserves $defs refs).
  // No $id: ajv compiles anonymously, avoiding duplicate-$id errors when the
  // attrs cache is reset between tests and a same-kind sub-schema is rebuilt.
  const subSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $defs: defs,
    $ref: `#/$defs/${kind}`,
  };
  const fn = ajv.compile(subSchema);
  attrsCache.byKind.set(kind, fn);
  return fn;
}

export async function validateAttrs(
  payload: unknown,
  kind: AttrsEntityKind,
): Promise<ValidationResult> {
  const validator = await getAttrsSchemaValidator(kind);
  if (!validator) {
    return {
      valid: false,
      errors: [
        {
          instancePath: '',
          schemaPath: '',
          keyword: 'unknown-kind',
          params: { kind },
          message: `unknown attrs entity kind: ${kind} (no schema in attrs.schema.json $defs)`,
        } as ErrorObject,
      ],
    };
  }
  const ok = validator(payload);
  return { valid: !!ok, errors: validator.errors ?? [] };
}

const EDGE_KINDS_SET = new Set([
  'solves', 'linked-features', 'parent', 'tested-by',
  'covers-ac', 'mitigates', 'linked-arch', 'depends-on',
]);

export function validateEdgeKind(kind: string): ValidationResult {
  if (EDGE_KINDS_SET.has(kind)) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: [
      {
        instancePath: '',
        schemaPath: 'edge-kinds.schema.json',
        keyword: 'enum',
        params: { allowedValues: [...EDGE_KINDS_SET] },
        message: `unknown edge kind: "${kind}" (closed enum of 8 — see schemas/edge-kinds.schema.json)`,
      } as ErrorObject,
    ],
  };
}

/** Test helper: reset attrs validator cache (also reachable via _resetValidatorCache). */
export function _resetAttrsCache(): void {
  _resetAttrsCacheInner();
}
