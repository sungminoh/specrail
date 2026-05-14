/**
 * Filesystem existence + symbol detection helpers.
 *
 * Symbol detection is naive grep — sufficient for spec-body Type/Files
 * fields where we just need to confirm "an interface/class/function named
 * X exists somewhere in src/". For deeper semantic checks (parameter
 * types, return types) callers should layer their own AST visitor on top.
 */

import { stat, readFile } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';

export async function pathExists(absPath: string): Promise<boolean> {
  try {
    await stat(absPath);
    return true;
  } catch {
    return false;
  }
}

export async function existsRelative(
  projectRoot: string,
  relPath: string,
): Promise<boolean> {
  return pathExists(join(projectRoot, relPath));
}

/**
 * Look for a definition of `symbolName` in `file`. Matches any of:
 *   - `export interface X`
 *   - `export type X`
 *   - `export class X`
 *   - `export function X`
 *   - `export const X`
 *   - `interface X`, `type X`, `class X`, `function X`, `const X` (non-exported)
 * Returns the matching line number, or 0 if not found.
 */
export async function hasSymbolInFile(
  absFilePath: string,
  symbolName: string,
): Promise<number> {
  let content: string;
  try {
    content = await readFile(absFilePath, 'utf8');
  } catch {
    return 0;
  }
  const escaped = symbolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Only top-of-file (or top-of-block) declarations qualify. Exclude
  // `const`/`let` because architect flagged that `const Project = "foo"`
  // would false-positive on ENT-Project even when no domain entity is
  // implemented. interface/type/class/function/enum are still allowed
  // because they almost always represent a real definition shape.
  const re = new RegExp(
    `^\\s*(?:export\\s+)?(?:interface|type|class|function|enum)\\s+${escaped}\\b`,
  );
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return 0;
}

export interface SymbolHit {
  readonly file: string;
  readonly line: number;
}

/**
 * Locate a symbol anywhere under `searchRoot`. Returns the first hit, or
 * null when no matching definition is found. Walks the tree itself so the
 * caller does not need a separate grep helper for the common case.
 */
export async function findSymbol(
  projectRoot: string,
  searchRoot: string,
  symbolName: string,
): Promise<SymbolHit | null> {
  const { readdir } = await import('node:fs/promises');
  const queue: string[] = [join(projectRoot, searchRoot)];
  while (queue.length > 0) {
    const dir = queue.shift() as string;
    let entries: Dirent[];
    try {
      entries = (await readdir(dir, { withFileTypes: true })) as Dirent[];
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      const p = join(dir, ent.name);
      if (ent.isDirectory()) {
        queue.push(p);
      } else if (ent.isFile() && /\.(ts|tsx|js|jsx)$/.test(ent.name)) {
        const line = await hasSymbolInFile(p, symbolName);
        if (line > 0) {
          return { file: relative(projectRoot, p), line };
        }
      }
    }
  }
  return null;
}
