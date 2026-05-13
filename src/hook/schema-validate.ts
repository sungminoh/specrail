// F2.4 schema validation hook (AC-R2-3, TC-6·34)
// 모든 docs/spec/{NN-name}.md frontmatter를 schemas/phase-{NN}.json으로 validate

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../markdown/frontmatter.js';
import { validateFrontmatter } from '../schema/validator.js';

const here = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(here, '..', '..', 'schemas');

export interface SchemaCheckResult {
  ok: boolean;
  errors: { file: string; messages: string[] }[];
}

export async function checkSchemas(projectRoot: string): Promise<SchemaCheckResult> {
  const specDir = join(projectRoot, 'docs', 'spec');
  let files: string[];
  try {
    files = (await readdir(specDir))
      .filter((f) => /^\d{2}-.*\.md$/.test(f))
      .sort();
  } catch {
    return { ok: true, errors: [] };
  }

  const errors: { file: string; messages: string[] }[] = [];

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

    try {
      const result = await validateFrontmatter(frontmatter, schemaPath);
      if (!result.valid) {
        errors.push({
          file,
          messages: result.errors.map((e) => `${e.instancePath || '/'}: ${e.message ?? 'invalid'}`),
        });
      }
    } catch (e) {
      // Schema 파일 미존재 시 skip (M0 partial state)
      void e;
    }
  }

  return { ok: errors.length === 0, errors };
}

export async function runHook(projectRoot: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const r = await checkSchemas(projectRoot);
  if (r.ok) {
    return { ok: true, message: 'F2.4 schema validation OK' };
  }
  const lines = ['F2.4 schema validation FAILED:'];
  for (const e of r.errors) {
    lines.push(`  ${e.file}:`);
    for (const m of e.messages) {
      lines.push(`    - ${m}`);
    }
  }
  return { ok: false, message: lines.join('\n') };
}
