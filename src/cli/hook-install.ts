// T1.7 Pre-commit hook installer (chain 방식, 기존 hook 보존)
// AC-R6-3, F2.1, F6.4, RISK-3, INV-10 (기존 hook 절대 보존)

import { readFile, writeFile, mkdir, stat, copyFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export type ExistingHookType = 'husky' | 'lefthook' | 'plain' | 'none';

export interface DetectionResult {
  type: ExistingHookType;
  path?: string;
}

const V4_MARKER = '# plan-pipeline v4 hook chain (INV-10 보존)';

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
    // Already chain-installed by us → skip
    if (content.includes(V4_MARKER)) {
      return { type: 'plain', path: plainPath };
    }
    return { type: 'plain', path: plainPath };
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

const V4_HOOK_TEMPLATE = `#!/usr/bin/env node
${V4_MARKER}
// Chain order:
//   1. Run user-original hook if exists (backup file)
//   2. Run v4 checks (schema + id consistency)
import { execFile as ef } from 'node:child_process';
import { promisify } from 'node:util';
import { stat as st } from 'node:fs/promises';
import { join as joinPath } from 'node:path';

const execFile = promisify(ef);
const projectRoot = process.cwd();
const userOrig = joinPath(projectRoot, '.git', 'hooks', 'pre-commit.user-original');

async function existsP(p) { try { await st(p); return true; } catch { return false; } }

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

  // 2. v4 checks (dynamic import to avoid hard failure if plugin not installed)
  try {
    const { runHook: idHook } = await import('@plan-pipeline/v4/dist/hook/id-consistency.js');
    const { runHook: schemaHook } = await import('@plan-pipeline/v4/dist/hook/schema-validate.js');
    const ic = await idHook(projectRoot);
    if (!ic.ok) { process.stderr.write(ic.message + '\\n'); process.exit(1); }
    const sc = await schemaHook(projectRoot);
    if (!sc.ok) { process.stderr.write(sc.message + '\\n'); process.exit(1); }
  } catch (e) {
    process.stderr.write('[plan-pipeline v4 hook unavailable — skipping checks]\\n');
  }

  process.exit(0);
})();
`;

export async function installHook(
  projectRoot: string,
  options: { force?: boolean } = {},
): Promise<InstallResult> {
  const hookPath = join(projectRoot, '.git', 'hooks', 'pre-commit');
  await mkdir(join(projectRoot, '.git', 'hooks'), { recursive: true });

  const detection = await detectExisting(projectRoot);

  if (detection.type === 'husky') {
    return {
      installed: false,
      chainedExisting: true,
      hookPath: detection.path!,
      guidance:
        'husky detected. Add this line to .husky/pre-commit instead:\n  npx plan-pipeline check',
    };
  }
  if (detection.type === 'lefthook') {
    return {
      installed: false,
      chainedExisting: true,
      hookPath: detection.path!,
      guidance:
        'lefthook detected. Add this block to lefthook.yml under pre-commit.commands:\n  plan-pipeline-check:\n    run: npx plan-pipeline check',
    };
  }

  let backupPath: string | undefined;
  if (detection.type === 'plain' && detection.path) {
    const existing = await readFile(detection.path, 'utf8').catch(() => '');
    if (existing.includes(V4_MARKER) && !options.force) {
      return {
        installed: false,
        chainedExisting: false,
        hookPath,
        guidance: 'v4 hook already installed (force=true to reinstall)',
      };
    }
    if (existing.trim().length > 0 && !existing.includes(V4_MARKER)) {
      backupPath = join(projectRoot, '.git', 'hooks', 'pre-commit.user-original');
      await copyFile(detection.path, backupPath);
      const hash = createHash('sha256').update(existing).digest('hex');
      await writeFile(
        join(projectRoot, '.git', 'hooks', 'pre-commit.user-original.hash'),
        hash + '\n',
      );
    }
  }

  await writeFile(hookPath, V4_HOOK_TEMPLATE);
  await chmod(hookPath, 0o755);

  return {
    installed: true,
    chainedExisting: !!backupPath,
    backupPath,
    hookPath,
  };
}
