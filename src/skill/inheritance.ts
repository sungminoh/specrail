// T2.6 00-common-principles 자동 상속 (F5.4, AC-R5-3, TC-11)
// SKILL.md content + 00-common content prepend mechanism
//
// Content source (analyst Ambiguity #1 resolved 2026-05-13):
//   `docs/spec/00-common-principles.md` (v3 차용, T2.5c refinement 적용)
//   - ETHOS (Boil the Lake / Search Before Building / User Sovereignty)
//   - 4 Modes (SCOPE_EXPANSION / SELECTIVE / HOLD / REDUCTION)
//   - Anti-Sycophancy (5 pushback patterns)
//   - HARD-GATE (state machine으로 자동 강제)
//   - AskUserQuestion ONE-AT-A-TIME (F5.3 wrapper)
//   - No Placeholders / Confidence Calibration / Diagrams Mandatory
// v3 원본 (refinement 전): git tag v3-archive 참조.

import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(join(here, '..', '..'));
const DEFAULT_COMMON_PATH = join(here, '..', '..', 'docs', 'spec', '00-common-principles.md');

/**
 * D5 fix (4차 reviewer security): path traversal defense.
 * commonPath must resolve within project boundary.
 */
export async function loadCommon(commonPath: string = DEFAULT_COMMON_PATH): Promise<string> {
  const resolved = resolve(commonPath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(
      `D5: commonPath escapes project boundary (${resolved} not under ${PROJECT_ROOT})`,
    );
  }
  try {
    return await readFile(resolved, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Compose final skill prompt = common preamble + skill body.
 * F5.4 enforcement — every skill auto-inherits 00-common.
 */
export async function composeSkillPrompt(
  skillBody: string,
  options: { commonPath?: string; includeCommon?: boolean } = {},
): Promise<string> {
  const include = options.includeCommon !== false;
  if (!include) return skillBody;

  const common = await loadCommon(options.commonPath);
  if (!common) return skillBody;

  return [
    '<!-- F5.4 auto-inject: 00-common-principles -->',
    common,
    '',
    '<!-- skill body below -->',
    skillBody,
  ].join('\n');
}

/**
 * Check whether common is referenced in skill metadata (frontmatter line).
 * AC-R5-3 verification helper.
 */
export function declaresCommonInheritance(skillMd: string): boolean {
  return /applies-to:\s*00-common|applies-to:\s*every phase/.test(skillMd);
}
