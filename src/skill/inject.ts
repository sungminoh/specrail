// US-T5.4 — Frontmatter inject runtime (M5 wire-up)
// F1.2 input auto-inject 실현. Phase N+1 skill 진입 시 Phase N frontmatter를 prompt에 prepend.

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from '../markdown/frontmatter.js';

export async function getInputFromPhase(
  projectRoot: string,
  fromPhase: number,
): Promise<Record<string, unknown>> {
  const specDir = join(projectRoot, 'docs', 'spec');
  const prefix = String(fromPhase).padStart(2, '0') + '-';
  let files: string[];
  try {
    files = await readdir(specDir);
  } catch {
    return {};
  }
  const file = files.find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  if (!file) return {};
  try {
    const raw = await readFile(join(specDir, file), 'utf8');
    const { frontmatter } = parseFrontmatter(raw);
    return frontmatter;
  } catch {
    return {};
  }
}

export function formatInputBlock(frontmatter: Record<string, unknown>, fromPhase: number): string {
  const lines = [`<!-- F1.2 auto-inject: Phase ${fromPhase} frontmatter -->`];
  for (const [k, v] of Object.entries(frontmatter)) {
    lines.push(`- ${k}: ${JSON.stringify(v)}`);
  }
  return lines.join('\n');
}
