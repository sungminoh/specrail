// Resolves the user-level data directory using env-paths (XDG / macOS / Windows).
// Allows override via SPECRAIL_DASHBOARD_DATA_DIR (used by tests).
import envPaths from 'env-paths';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export function dataDir(): string {
  const override = process.env.SPECRAIL_DASHBOARD_DATA_DIR;
  if (override) return override;
  return envPaths('specrail-dashboard', { suffix: '' }).data;
}

export function projectDataDir(projectId: string): string {
  return join(dataDir(), 'projects', projectId);
}

export async function ensureDataDir(): Promise<string> {
  const dir = dataDir();
  await mkdir(dir, { recursive: true });
  await mkdir(join(dir, 'projects'), { recursive: true });
  await mkdir(join(dir, 'logs'), { recursive: true });
  return dir;
}
