import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = resolve(__dirname, '../schemas');

describe('Phase schema refs pattern consistency (R3 M-Round3-8)', () => {
  it('all phase schemas allow T-tier refs (T\\d+\\.\\d+)', async () => {
    const commonRaw = await readFile(join(SCHEMA_DIR, 'common-frontmatter.json'), 'utf8');
    const common = JSON.parse(commonRaw);
    const commonPattern: string = common.properties?.refs?.items?.pattern ?? '';
    expect(commonPattern).toContain('T'); // sanity: common schema has T-tier

    const files = await readdir(SCHEMA_DIR);
    const phaseFiles = files.filter((f) => /^phase-\d+\.json$/.test(f));
    expect(phaseFiles.length).toBeGreaterThan(0); // sanity: found phase schemas

    for (const f of phaseFiles) {
      const raw = await readFile(join(SCHEMA_DIR, f), 'utf8');
      const schema = JSON.parse(raw);
      const refsPattern: string | undefined = schema.properties?.refs?.items?.pattern;
      if (refsPattern !== undefined) {
        // If phase schema overrides refs, it must accept T-tier (T\d+\.\d+)
        expect(refsPattern, `${f} refs pattern must allow T-tier`).toContain('T');
        // Also must accept AC-R tier
        expect(refsPattern, `${f} refs pattern must allow AC-R-tier`).toContain('AC-R');
      }
    }
  });

  it('common-frontmatter.json refs pattern matches all phase schemas (R3 M-Round3-8)', async () => {
    const commonRaw = await readFile(join(SCHEMA_DIR, 'common-frontmatter.json'), 'utf8');
    const common = JSON.parse(commonRaw);
    const commonPattern: string = common.properties?.refs?.items?.pattern ?? '';

    const files = await readdir(SCHEMA_DIR);
    const phaseFiles = files.filter((f) => /^phase-\d+\.json$/.test(f));

    for (const f of phaseFiles) {
      const raw = await readFile(join(SCHEMA_DIR, f), 'utf8');
      const schema = JSON.parse(raw);
      const refsPattern: string | undefined = schema.properties?.refs?.items?.pattern;
      if (refsPattern !== undefined) {
        expect(refsPattern, `${f} refs pattern should match common-frontmatter pattern`).toBe(
          commonPattern,
        );
      }
    }
  });
});
