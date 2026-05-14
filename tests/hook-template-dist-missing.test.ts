import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const HOOK_INSTALL_PATH = join(process.cwd(), 'src/cli/hook-install.ts');

describe('HOOK_TEMPLATE dist resolution (US-T6.1, M6, D11 regression)', () => {
  let templateSource: string;

  beforeAll(async () => {
    templateSource = await readFile(HOOK_INSTALL_PATH, 'utf8');
  });

  it('contains exit(1) on dist not found (no silent pass)', () => {
    // Within HOOK_TEMPLATE template literal
    const templateMatch = templateSource.match(/const HOOK_TEMPLATE = `[\s\S]+?`;/);
    expect(templateMatch).not.toBeNull();
    const template = templateMatch![0];
    expect(template).toContain('process.exit(1)');
  });

  it('contains "dist not found" stderr message', () => {
    const templateMatch = templateSource.match(/const HOOK_TEMPLATE = `[\s\S]+?`;/);
    const template = templateMatch![0];
    expect(template).toContain('dist not found');
    expect(template).toContain('build first or install package');
  });

  it('loadHooks tries npm package first then local dist', () => {
    const templateMatch = templateSource.match(/const HOOK_TEMPLATE = `[\s\S]+?`;/);
    const template = templateMatch![0];
    expect(template).toContain('specrail/dist/hook/id-consistency.js');
    expect(template).toContain('dist/hook/id-consistency.js');
    expect(template.indexOf('specrail')).toBeLessThan(
      template.indexOf('../dist/hook/id-consistency.js'),
    );
  });

  it('returns null from loadHooks (not silent pass) when both fail', () => {
    const templateMatch = templateSource.match(/const HOOK_TEMPLATE = `[\s\S]+?`;/);
    const template = templateMatch![0];
    // Pattern: if (!hooks) { ... process.exit(1); }
    expect(template).toMatch(/if\s*\(\s*!hooks\s*\)/);
  });

  it('does not contain bare exit(0) bypass when hook resolution fails', () => {
    const templateMatch = templateSource.match(/const HOOK_TEMPLATE = `[\s\S]+?`;/);
    const template = templateMatch![0];
    // The only exit(0) should be at end of successful flow, not in catch/!hooks branch
    const exitZeroOccurrences = (template.match(/process\.exit\(0\)/g) ?? []).length;
    const exitOneOccurrences = (template.match(/process\.exit\(1\)/g) ?? []).length;
    expect(exitOneOccurrences).toBeGreaterThanOrEqual(2); // user-original fail + dist not found
    expect(exitZeroOccurrences).toBe(1); // success path only
  });
});
