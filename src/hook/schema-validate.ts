// F2.4 schema validation hook (AC-R2-3, TC-6·34)
// 모든 docs/spec/{NN-name}.md frontmatter를 schemas/phase-{NN}.json으로 validate

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../markdown/frontmatter.js';
import { validateFrontmatter } from '../schema/validator.js';

const here = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(here, '..', '..', 'schemas');

export interface SchemaCheckResult {
  ok: boolean;
  errors: { file: string; messages: string[] }[];
  warnings: { file: string; messages: string[] }[]; // US-T6.2
}

export interface SchemaCheckOptions {
  strict?: boolean; // strict mode: warnings also make ok: false
}

export async function checkSchemas(projectRoot: string, options?: SchemaCheckOptions): Promise<SchemaCheckResult> {
  const specDir = join(projectRoot, 'docs', 'spec');
  let files: string[];
  try {
    files = (await readdir(specDir))
      .filter((f) => /^\d{2}-.*\.md$/.test(f))
      .sort();
  } catch {
    return { ok: true, errors: [], warnings: [] };
  }

  const errors: { file: string; messages: string[] }[] = [];
  const warnings: { file: string; messages: string[] }[] = [];

  for (const file of files) {
    const phase = file.slice(0, 2);
    const schemaPath = join(schemasDir, `phase-${phase}.json`);

    let raw: string;
    try {
      raw = await readFile(join(specDir, file), 'utf8');
    } catch {
      continue;
    }

    const { frontmatter, hasFrontmatter } = parseFrontmatter(raw);
    if (!hasFrontmatter) {
      errors.push({ file, messages: ['missing frontmatter'] });
      continue;
    }

    // Skip template guide files — they lack the 'phase' field which is only
    // present in filled user spec outputs. Template files define 'name' instead.
    if (!Object.prototype.hasOwnProperty.call(frontmatter, 'phase')) {
      // Heuristic: template files have no phase prefix in name. User spec files do.
      if (/^\d{2}-/.test(basename(file))) {
        process.stderr.write(`[schema-validate] WARN: ${file} matches phase pattern but lacks 'phase' field — skipped silently\n`);
      }
      continue;
    }

    try {
      const result = await validateFrontmatter(frontmatter, schemaPath);
      if (!result.valid) {
        errors.push({
          file,
          messages: result.errors.map((e) => `${e.instancePath || '/'}: ${e.message ?? 'invalid'}`),
        });
      }
    } catch {
      // US-T6.2: silent skip → warning push
      warnings.push({
        file,
        messages: [`schema file not found at ${schemaPath} — validation skipped`],
      });
    }
  }

  const ok = errors.length === 0 && (!options?.strict || warnings.length === 0);
  return { ok, errors, warnings };
}

export async function runHook(projectRoot: string, options?: SchemaCheckOptions): Promise<{
  ok: boolean;
  message: string;
}> {
  const r = await checkSchemas(projectRoot, options);
  if (r.ok && r.warnings.length === 0) {
    return { ok: true, message: 'F2.4 schema validation OK' };
  }
  const lines: string[] = [];
  if (!r.ok) {
    lines.push('F2.4 schema validation FAILED:');
    for (const e of r.errors) {
      lines.push(`  ${e.file}:`);
      for (const m of e.messages) {
        lines.push(`    - ${m}`);
      }
    }
  }
  if (r.warnings.length > 0) {
    lines.push('F2.4 schema validation warnings:');
    for (const w of r.warnings) {
      lines.push(`  ${w.file}:`);
      for (const m of w.messages) {
        lines.push(`    - ${m}`);
      }
    }
  }
  return { ok: r.ok, message: lines.join('\n') };
}
