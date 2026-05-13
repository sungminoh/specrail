// T2.6 00-common-principles 자동 상속 (F5.4, AC-R5-3, TC-11)
// SKILL.md content + 00-common content prepend mechanism

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_COMMON_PATH = join(here, '..', '..', 'docs', 'spec', '00-common-principles.md');

export async function loadCommon(commonPath: string = DEFAULT_COMMON_PATH): Promise<string> {
  try {
    return await readFile(commonPath, 'utf8');
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
