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
