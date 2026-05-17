// Resolve the monorepo root (containing pnpm-workspace.yaml) by walking up from import.meta.url.
// Used by tests that read files outside the plugin package (e.g. .github/workflows/, root package.json).
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let cached: string | null = null;

export function repoRoot(): string {
  if (cached) return cached;
  let dir = dirname(fileURLToPath(import.meta.url));
  // Walk up at most 8 levels looking for pnpm-workspace.yaml.
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      cached = dir;
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('repoRoot: could not locate pnpm-workspace.yaml above ' + dirname(fileURLToPath(import.meta.url)));
}

export function fromRoot(...segments: string[]): string {
  return join(repoRoot(), ...segments);
}
