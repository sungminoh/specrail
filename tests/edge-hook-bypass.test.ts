// EDGE-11·12·13 hook bypass + cache corruption (US-10.4, M10)
//
// EDGE-11: hook missing recovery — install, delete .git/hooks/pre-commit, reinstall
// EDGE-12: telemetry token mismatch / bad config → silent no-op (no throw)
// EDGE-13: graph cache corruption N/A — ADR-9 option D (on-demand, no on-disk cache)
// EDGE:    hook template + dist missing — exit(1) + error message (no silent pass)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installHook } from '../src/cli/hook-install.js';
import { createPlausibleSender } from '../src/telemetry/plausible-adapter.js';
import { buildGraph } from '../src/graph/builder.js';

const HOOK_MARKER = '// specrail hook chain (INV-10 보존)';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'edge-hook-bypass-'));
  // Provide minimal .git/hooks structure for hook tests
  await mkdir(join(dir, '.git', 'hooks'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('EDGE-11: hook missing recovery (US-10.4)', () => {
  it('restores HOOK_MARKER after pre-commit deleted and re-installed', async () => {
    // First install
    const r1 = await installHook(dir);
    expect(r1.installed).toBe(true);

    const hookPath = join(dir, '.git', 'hooks', 'pre-commit');

    // Simulate hook bypass: user deletes .git/hooks/pre-commit
    await unlink(hookPath);

    // Confirm deletion
    const contentAfterDelete = await readFile(hookPath, 'utf8').catch(() => null);
    expect(contentAfterDelete).toBeNull();

    // Re-run install (no force needed — file is gone, detectExisting returns 'none')
    const r2 = await installHook(dir);
    expect(r2.installed).toBe(true);

    // Hook file exists again with HOOK_MARKER
    const restored = await readFile(hookPath, 'utf8');
    expect(restored).toContain(HOOK_MARKER);
  });

  it('reinstalls with force=true when hook is present but corrupted', async () => {
    // Install specrail hook
    await installHook(dir);

    const hookPath = join(dir, '.git', 'hooks', 'pre-commit');

    // Corrupt the hook (overwrite with garbage but keep the marker so detectExisting
    // returns 'plain' with our marker — force is required to overwrite)
    await writeFile(hookPath, HOOK_MARKER + '\n# corrupted garbage\n');

    // Without force → guidance only
    const r1 = await installHook(dir);
    expect(r1.installed).toBe(false);
    expect(r1.guidance).toContain('already installed');

    // With force=true → fresh reinstall
    const r2 = await installHook(dir, { force: true });
    expect(r2.installed).toBe(true);

    const content = await readFile(hookPath, 'utf8');
    expect(content).toContain(HOOK_MARKER);
    // Restored template contains the chain comment — not the corrupted content
    expect(content).not.toContain('# corrupted garbage');
  });
});

describe('EDGE-12: telemetry bad/empty config → silent no-op (US-10.4)', () => {
  it('empty domain → fetch called but adapter does not throw', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', mockFetch);

    const sender = createPlausibleSender({ domain: '' });
    const result = await sender.emit({ eventType: 'PhaseApproved', phaseId: 1 });

    // Adapter silently returns { ok: false } — no throw propagated to caller
    expect(result.ok).toBe(false);
  });

  it('mismatched endpoint (unreachable URL) → silent { ok: false }, no throw', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', mockFetch);

    const sender = createPlausibleSender({
      domain: 'specrail.dev',
      endpoint: 'https://wrong-host.invalid/api/event',
    });

    const result = await sender.emit({ eventType: 'HookBlock', hookReason: 'schema' });
    expect(result.ok).toBe(false);
    // fetch was called exactly once — adapter did not retry or throw
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('non-2xx HTTP response → { ok: false }, no throw', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', mockFetch);

    const sender = createPlausibleSender({ domain: 'specrail.dev' });
    const result = await sender.emit({ eventType: 'PhaseApproved' });

    expect(result.ok).toBe(false);
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});

describe('EDGE-13: graph cache corruption N/A — ADR-9 option D (US-10.4)', () => {
  /**
   * ADR-9 option D (adopted at M0 spike T0.4): full rebuild every commit,
   * no on-disk cache. buildGraph() reads docs/spec/ directly on every call.
   *
   * Consequence: there is no graph.json or .cache file to corrupt.
   * Cache corruption (EDGE-13) is architecturally impossible by design.
   *
   * This test documents the invariant: after writing an unrelated JSON file
   * into the project root, buildGraph still returns a valid (empty) graph
   * and does not throw.
   */
  it('no on-disk cache — spurious JSON file does not affect graph build', async () => {
    // Write a file that looks like a corrupted cache (not read by buildGraph)
    await writeFile(join(dir, 'graph.json'), '{ CORRUPTED JSON !!!');

    // docs/spec/ absent → initialized: false, no throw
    const graph = await buildGraph(dir);
    expect(graph.initialized).toBe(false);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it('fresh rebuild succeeds from valid docs/spec/ regardless of any stale files', async () => {
    // Create a minimal docs/spec/ with one file
    const specDir = join(dir, 'docs', 'spec');
    await mkdir(specDir, { recursive: true });
    await writeFile(
      join(specDir, '01-phase.md'),
      '---\nphase: 1\n---\n\n## US-1: title\n\nSome body.\n',
    );

    // Stale "cache" file present — ignored
    await writeFile(join(dir, 'graph.json'), '{ CORRUPTED JSON !!!');

    const graph = await buildGraph(dir);
    expect(graph.initialized).toBe(true);
    // No throw — fresh rebuild completed successfully
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
  });
});

describe('EDGE: hook template + dist missing (extends hook-template-dist-missing pattern)', () => {
  it('HOOK_TEMPLATE contains exit(1) when dist not found (no silent pass)', async () => {
    const { readFile: fsReadFile } = await import('node:fs/promises');
    const src = await fsReadFile(join(process.cwd(), 'src/cli/hook-install.ts'), 'utf8');
    const templateMatch = src.match(/const HOOK_TEMPLATE = `[\s\S]+?`;/);
    expect(templateMatch).not.toBeNull();
    const template = templateMatch![0];

    // Must exit(1) on dist not found — no silent pass
    expect(template).toContain('process.exit(1)');
    expect(template).toContain('dist not found');
  });

  it('installed hook file contains the no-silent-pass guard', async () => {
    const result = await installHook(dir);
    expect(result.installed).toBe(true);

    const hookContent = await readFile(result.hookPath, 'utf8');

    // The installed hook must carry the dist-missing guard
    expect(hookContent).toContain('dist not found');
    expect(hookContent).toContain('process.exit(1)');
  });

  it('hook template loadHooks returns null (not exit(0)) when both dist paths fail', async () => {
    const src = await readFile(join(process.cwd(), 'src/cli/hook-install.ts'), 'utf8');
    const templateMatch = src.match(/const HOOK_TEMPLATE = `[\s\S]+?`;/);
    const template = templateMatch![0];

    // Pattern: if (!hooks) { ... process.exit(1); } — not silent exit(0)
    expect(template).toMatch(/if\s*\(\s*!hooks\s*\)/);

    // The only exit(0) is the success path; at least 2 exit(1)s guard failures
    const exitOneCount = (template.match(/process\.exit\(1\)/g) ?? []).length;
    const exitZeroCount = (template.match(/process\.exit\(0\)/g) ?? []).length;
    expect(exitOneCount).toBeGreaterThanOrEqual(2);
    expect(exitZeroCount).toBe(1);
  });
});
