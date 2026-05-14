// T2.6 00-common-principles 자동 상속 (F5.4, AC-R5-3, TC-11)
// SKILL.md content + 00-common content prepend mechanism
//
// Content source (analyst Ambiguity #1 resolved 2026-05-13):
//   `docs/spec/00-common-principles.md` (T2.5c refinement 적용)
//   - ETHOS (Boil the Lake / Search Before Building / User Sovereignty)
//   - 4 Modes (SCOPE_EXPANSION / SELECTIVE / HOLD / REDUCTION)
//   - Anti-Sycophancy (5 pushback patterns)
//   - HARD-GATE (state machine으로 자동 강제)
//   - AskUserQuestion ONE-AT-A-TIME (F5.3 wrapper)
//   - No Placeholders / Confidence Calibration / Diagrams Mandatory
// 원본 (refinement 전): git tag v3-archive 참조.

import { readFile } from 'node:fs/promises';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getInputFromPhase, formatInputBlock } from './inject.js';

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(join(here, '..', '..'));
const DEFAULT_COMMON_PATH = join(here, '..', '..', 'docs', 'spec', '00-common-principles.md');

/**
 * D5 fix (4차 reviewer security): path traversal defense.
 * commonPath must resolve within project boundary.
 *
 * @param commonPath - Path to the common principles file.
 * @param projectRoot - Explicit project root for boundary check.
 *   Defaults to the package-derived PROJECT_ROOT. Pass the user's project
 *   root when the package is installed under node_modules and the common
 *   file lives in the user's project tree (R5 MEDIUM#5).
 * @returns File content, or null if the file does not exist (ENOENT).
 *   Other I/O errors (EACCES, EISDIR, etc.) are logged to stderr and re-thrown.
 */
export async function loadCommon(
  commonPath: string = DEFAULT_COMMON_PATH,
  projectRoot?: string,
): Promise<string | null> {
  const root = projectRoot ?? PROJECT_ROOT;
  const resolved = resolve(commonPath);
  if (resolved !== root && !resolved.startsWith(root + sep)) {
    throw new Error(
      `D5: commonPath escapes project boundary (${resolved} not under ${root})`,
    );
  }
  try {
    return await readFile(resolved, 'utf8');
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return null; // legitimate skip — file simply absent
    // Other errors (EACCES, EISDIR, …) — surface so callers are not silently misled
    process.stderr.write(
      `[inheritance] loadCommon failed for ${resolved}: ${String(err.message ?? err)}\n`,
    );
    throw err;
  }
}

/**
 * Compose final skill prompt = common preamble + optional phase frontmatter + skill body.
 * F5.4 enforcement — every skill auto-inherits 00-common.
 * US-T5.4 — inputFrom prepends Phase N frontmatter before skill body.
 */
export async function composeSkillPrompt(
  skillBody: string,
  options: {
    commonPath?: string;
    includeCommon?: boolean;
    inputFrom?: { projectRoot: string; phase: number };
  } = {},
): Promise<string> {
  const include = options.includeCommon !== false;

  const parts: string[] = [];

  if (include) {
    const common = await loadCommon(options.commonPath);
    if (common) {
      parts.push('<!-- F5.4 auto-inject: 00-common-principles -->');
      parts.push(common);
      parts.push('');
      parts.push('<!-- skill body below -->');
    }
  }

  if (options.inputFrom) {
    const fm = await getInputFromPhase(options.inputFrom.projectRoot, options.inputFrom.phase);
    if (Object.keys(fm).length > 0) {
      parts.push(formatInputBlock(fm, options.inputFrom.phase));
    }
  }

  parts.push(skillBody);
  return parts.join('\n');
}

/**
 * Check whether common is referenced in skill metadata (frontmatter line).
 * AC-R5-3 verification helper.
 */
export function declaresCommonInheritance(skillMd: string): boolean {
  return /applies-to:\s*00-common|applies-to:\s*every phase/.test(skillMd);
}
