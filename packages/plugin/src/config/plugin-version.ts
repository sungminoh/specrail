// Shared helper: read plugin (host project) version from package.json at
// the given projectRoot. Used by lint:plan + approve attrs gate to drive
// version-gated severity (proposal §3.2 / OQ-CSA-3).
//
// Distinct from src/telemetry/client.ts `getPluginVersion`, which reads
// the BUNDLED plugin's own package.json relative to import.meta.url for
// outbound telemetry — different read target, different fallback shape.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const FALLBACK = '0.0.0';

export async function readProjectPluginVersion(projectRoot: string): Promise<string> {
  try {
    const raw = await readFile(join(projectRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}
