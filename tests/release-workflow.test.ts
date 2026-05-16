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

describe('T-CSA.7 — package.json files array publishes attrs schema', () => {
  it('package.json files includes "schemas"', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as { files: string[] };
    expect(pkg.files).toContain('schemas');
  });

  it('package.json files also includes "skills" (already shipped 0.1.0)', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as { files: string[] };
    expect(pkg.files).toContain('skills');
  });

  it('schemas/attrs.schema.json + schemas/edge-kinds.schema.json exist on disk', async () => {
    const attrs = await readFile('schemas/attrs.schema.json', 'utf8');
    const edges = await readFile('schemas/edge-kinds.schema.json', 'utf8');
    expect(attrs).toContain('attrs block payload');
    expect(edges).toContain('edge kind enum');
  });
});
