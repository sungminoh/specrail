// T1.7 Pre-commit hook installer (chain 방식, 기존 hook 보존)
// AC-R6-3, F2.1, F6.4, RISK-3, INV-10 (기존 hook 절대 보존)

import { readFile, writeFile, mkdir, stat, copyFile, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export type ExistingHookType = 'husky' | 'lefthook' | 'plain' | 'none';

export interface DetectionResult {
  type: ExistingHookType;
  path?: string;
  alreadyChained?: boolean; // R6 M1: signal specrail marker already present
}

// JS-comment marker (not shell #) so it's valid in #!/usr/bin/env node scripts
const HOOK_SENTINEL = 'specrail hook chain';
const HOOK_MARKER = `// ${HOOK_SENTINEL} (INV-10 보존)`;

export async function detectExisting(projectRoot: string): Promise<DetectionResult> {
  // husky v9: .husky/pre-commit (no underscore)
  // husky v8: .husky/_/pre-commit
  for (const p of ['.husky/pre-commit', '.husky/_/pre-commit']) {
    if (await exists(join(projectRoot, p))) {
      return { type: 'husky', path: join(projectRoot, p) };
    }
  }

  if (await exists(join(projectRoot, 'lefthook.yml'))) {
    return { type: 'lefthook', path: join(projectRoot, 'lefthook.yml') };
  }

  const plainPath = join(projectRoot, '.git', 'hooks', 'pre-commit');
  if (await exists(plainPath)) {
    const content = await readFile(plainPath, 'utf8').catch(() => '');
    return { type: 'plain', path: plainPath, alreadyChained: content.includes(HOOK_MARKER) };
  }

  return { type: 'none' };
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export interface InstallResult {
  installed: boolean;
  chainedExisting: boolean;
  backupPath?: string;
  hookPath: string;
  guidance?: string;
}

export const HOOK_TEMPLATE = `#!/usr/bin/env node
${HOOK_MARKER}
// Chain order:
//   1. Run user-original hook if exists (backup file)
//   2. Run specrail checks (schema + id consistency)
//
// Dist resolution (D11 fix):
//   - Try npm-installed package: specrail/dist/...
//   - Fallback to local repo: ./dist/hook/... (self-dogfood / dev)
//   - If neither found: stderr + exit 1 (no silent pass)
import { execFile as ef } from 'node:child_process';
import { promisify } from 'node:util';
import { stat as st } from 'node:fs/promises';
import { dirname, resolve as resolvePath, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFile = promisify(ef);
const projectRoot = process.cwd();
const userOrig = joinPath(projectRoot, '.git', 'hooks', 'pre-commit.user-original');

async function existsP(p) { try { await st(p); return true; } catch { return false; } }

async function loadHooks() {
  // Try npm-installed package first
  try {
    const pkg = await import('specrail/dist/hook/schema-validate.js');
    const ic = await import('specrail/dist/hook/id-consistency.js');
    process.stderr.write('[specrail] loaded from specrail package\\n');
    return { schemaHook: pkg.runHook, idHook: ic.runHook };
  } catch (e) {
    if (e?.code !== 'ERR_MODULE_NOT_FOUND') {
      process.stderr.write(\`[specrail] npm package load failed: \${String(e)}\\n\`);
      throw e;
    }
  }
  // ERR_MODULE_NOT_FOUND — try local dist (self-dogfood / dev)
  try {
    const localDir = dirname(fileURLToPath(import.meta.url));
    const distSchemaPath = resolvePath(localDir, '../dist/hook/schema-validate.js');
    const distIdPath = resolvePath(localDir, '../dist/hook/id-consistency.js');
    const pkg = await import(distSchemaPath);
    const ic = await import(distIdPath);
    process.stderr.write('[specrail] loaded from local dist (development mode)\\n');
    return { schemaHook: pkg.runHook, idHook: ic.runHook };
  } catch (e2) {
    process.stderr.write(\`[specrail] local dist load failed: \${String(e2)}\\n\`);
    return null;
  }
}

(async () => {
  // 1. User original
  if (await existsP(userOrig)) {
    try {
      const r = await execFile(userOrig, [], { cwd: projectRoot });
      process.stdout.write(r.stdout); process.stderr.write(r.stderr);
    } catch (e) {
      process.stderr.write('[user-original hook failed]\\n' + (e.stderr ?? e.message ?? ''));
      process.exit(1);
    }
  }

  // 2. specrail checks
  const hooks = await loadHooks();
  if (!hooks) {
    process.stderr.write('[specrail] dist not found — build first or install package\\n');
    process.exit(1);
  }

  const ic = await hooks.idHook(projectRoot);
  if (!ic.ok) { process.stderr.write(ic.message + '\\n'); process.exit(1); }

  const sc = await hooks.schemaHook(projectRoot);
  if (!sc.ok) { process.stderr.write(sc.message + '\\n'); process.exit(1); }

  process.exit(0);
})().catch((e) => {
  process.stderr.write(\`[specrail] uncaught: \${String(e?.stack ?? e)}\\n\`);
  process.exit(1);
});
`;

export async function installHook(
  projectRoot: string,
  options: { force?: boolean } = {},
): Promise<InstallResult> {
  const hookPath = join(projectRoot, '.git', 'hooks', 'pre-commit');
  await mkdir(join(projectRoot, '.git', 'hooks'), { recursive: true });

  const detection = await detectExisting(projectRoot);

  // M3: warn if both .husky/pre-commit and .git/hooks/pre-commit coexist
  if (
    existsSync(join(projectRoot, '.husky', 'pre-commit')) &&
    existsSync(join(projectRoot, '.git', 'hooks', 'pre-commit'))
  ) {
    process.stderr.write(
      '[specrail] WARNING: both .husky/pre-commit and .git/hooks/pre-commit detected.\n' +
        '[specrail] specrail hook chain installed in .husky path. Verify legacy .git/hooks/pre-commit content matches expectation.\n',
    );
  }

  if (detection.type === 'husky') {
    return {
      installed: false,
      chainedExisting: true,
      hookPath: detection.path!,
      guidance:
        'husky detected. Add this line to .husky/pre-commit instead:\n  npx specrail check',
    };
  }
  if (detection.type === 'lefthook') {
    return {
      installed: false,
      chainedExisting: true,
      hookPath: detection.path!,
      guidance:
        'lefthook detected. Add this block to lefthook.yml under pre-commit.commands:\n  specrail-check:\n    run: npx specrail check',
    };
  }

  // L-R8-2: HOOK_SENTINEL is the module-level source; HOOK_MARKER is built from it (true DRY).
  // HOOK_MARKER.includes(HOOK_SENTINEL) is true by construction — non-empty guaranteed statically.

  let backupPath: string | undefined;
  if (detection.type === 'plain' && detection.path) {
    if (detection.alreadyChained && !options.force) {
      return {
        installed: false,
        chainedExisting: false,
        hookPath,
        guidance: 'specrail hook already installed (force=true to reinstall)',
      };
    }
    // Do NOT back up our own hook (any version) — only back up external user hooks
    const existing = await readFile(detection.path, 'utf8').catch(() => '');
    if (existing.trim().length > 0 && !existing.includes(HOOK_SENTINEL)) {
      backupPath = join(projectRoot, '.git', 'hooks', 'pre-commit.user-original');
      await copyFile(detection.path, backupPath);
      const hash = createHash('sha256').update(existing).digest('hex');
      await writeFile(
        join(projectRoot, '.git', 'hooks', 'pre-commit.user-original.hash'),
        hash + '\n',
      );
    }
  }

  await writeFile(hookPath, HOOK_TEMPLATE);
  await chmod(hookPath, 0o755);

  return {
    installed: true,
    chainedExisting: !!backupPath,
    backupPath,
    hookPath,
  };
}
