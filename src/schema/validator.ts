// ADR-2 JSON Schema (Draft 2020-12) + ajv
// F1.1 frontmatter schema per phase
// F2.4 schema validation hook 차용

import Ajv2020 from 'ajv/dist/2020.js';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ajv = new Ajv2020({ allErrors: true, strict: false });

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

const cache = new Map<string, ValidateFunction>();

export async function loadSchema(schemaPath: string): Promise<ValidateFunction> {
  if (cache.has(schemaPath)) return cache.get(schemaPath)!;
  const raw = await readFile(schemaPath, 'utf8');
  const schema = JSON.parse(raw);
  const validate = ajv.compile(schema);
  cache.set(schemaPath, validate);
  return validate;
}

export async function validateFrontmatter(
  frontmatter: object,
  schemaPath: string,
): Promise<ValidationResult> {
  const validate = await loadSchema(schemaPath);
  const valid = validate(frontmatter);
  return { valid: !!valid, errors: validate.errors ?? [] };
}

export function getSchemaPath(filename: string): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'schemas', filename);
}
