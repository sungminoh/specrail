import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'node:path'; // unused — we do string checks

describe('T4.2 Release workflow (Phase 11 OPS-1, RB-7)', () => {
  async function loadYaml(): Promise<string> {
    return readFile('.github/workflows/release.yml', 'utf8');
  }

  it('release.yml exists and has a name field', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('name:');
  });

  it('triggers on tag push matching v*.*.*', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain("tags:");
    expect(yaml).toMatch(/['"]?v\*\.\*\.\*['"]?/);
  });

  it('uses actions/checkout@v4 and actions/setup-node@v4', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('actions/checkout@v4');
    expect(yaml).toContain('actions/setup-node@v4');
  });

  it('runs npm test (gate) before release', async () => {
    const yaml = await loadYaml();
    const testIdx = yaml.indexOf('npm test');
    const releaseIdx = yaml.indexOf('gh release create');
    expect(testIdx).toBeGreaterThan(-1);
    expect(releaseIdx).toBeGreaterThan(-1);
    // test gate must appear before release step
    expect(testIdx).toBeLessThan(releaseIdx);
  });

  it('creates GitHub release with .tgz artifact (RB-7 fallback)', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('gh release create');
    expect(yaml).toContain('.tgz');
  });

  it('includes npm pack to produce the release artifact', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('npm pack');
  });

  it('has contents:write permission for gh CLI', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('contents: write');
  });
});
