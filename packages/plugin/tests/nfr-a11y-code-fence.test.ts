import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * NFR-A11Y-3: every fenced code block in docs/spec/ must declare a
 * language for screen-reader friendliness. Static check, no LLM needed.
 *
 * A11Y-3 is the one A11Y NFR that's mechanically verifiable; the rest
 * (color + icon + text, hyperlink descriptiveness, terminal-side
 * keyboard nav) require manual review and are documented in the
 * ignore-block of 09-non-functional-requirements.md.
 */

describe('NFR-A11Y-3: every fenced code block declares a language', () => {
  it('docs/spec/*.md has no bare ``` fences', async () => {
    const dir = join(process.cwd(), 'docs', 'spec');
    const files = (await readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name);

    const violations: Array<{ file: string; line: number; raw: string }> = [];
    for (const f of files) {
      const raw = await readFile(join(dir, f), 'utf8');
      const lines = raw.split('\n');
      let inFence = false;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (!l.startsWith('```')) continue;
        if (inFence) {
          inFence = false;
          continue;
        }
        inFence = true;
        const lang = l.slice(3).trim();
        if (lang === '') {
          violations.push({ file: f, line: i + 1, raw: l });
        }
      }
    }

    if (violations.length > 0) {
      // Print full list so reviewer can see exactly which lines.
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}  ${v.raw}`)
        .join('\n');
      throw new Error(
        `NFR-A11Y-3 violation: ${violations.length} bare fence(s) without language tag:\n${msg}\n` +
          'Fix: add a language hint (e.g. ```ts, ```bash, ```md, ```text).',
      );
    }
    expect(violations.length).toBe(0);
  });
});
