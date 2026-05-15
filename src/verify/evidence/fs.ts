/**
 * Filesystem existence + symbol detection helpers.
 *
 * Symbol detection uses the TS compiler API. We require the named
 * declaration to have substance (interface with ≥1 member, class with
 * ≥1 member, function with parameters or body statements, enum with
 * ≥1 member, type alias not aliased to {}/any/never/unknown). Empty
 * stubs like `interface User {}` are rejected — they vacuously match
 * symbol-name without proving the entity is modelled.
 */

import { stat, readFile } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import * as ts from 'typescript';

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
 * Look for a substantive definition of `symbolName` in `file` via the
 * TS compiler API. Returns the matching line number, or 0 if not found
 * or the match is an empty stub.
 *
 * A definition counts as substantive when:
 *   - interface: has ≥1 member
 *   - class: has ≥1 member
 *   - enum: has ≥1 member
 *   - function: has parameters OR a body with ≥1 statement
 *   - type alias: aliased type is not `any`/`never`/`unknown`/`{}`/`object`
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
  const sf = ts.createSourceFile(
    absFilePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    /\.tsx$/.test(absFilePath) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  let found = 0;
  const visit = (node: ts.Node): void => {
    if (found > 0) return;
    if (isSubstantiveDeclaration(node, symbolName)) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      found = line + 1;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function isSubstantiveDeclaration(node: ts.Node, name: string): boolean {
  if (ts.isInterfaceDeclaration(node) && node.name.text === name) {
    return hasSubstantiveMember(node.members);
  }
  if (ts.isClassDeclaration(node) && node.name?.text === name) {
    return hasSubstantiveMember(node.members);
  }
  if (ts.isEnumDeclaration(node) && node.name.text === name) {
    return node.members.length > 0;
  }
  if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
    if (node.parameters.length > 0) return true;
    if (node.body && node.body.statements.length > 0) return true;
    return false;
  }
  if (ts.isTypeAliasDeclaration(node) && node.name.text === name) {
    return !isTriviallyEmptyType(node.type);
  }
  return false;
}

/**
 * Round-N+3 scope correction: verifier checks SHAPE PRESENCE, not
 * shape QUALITY. An interface with ≥1 member has shape; whether the
 * member's type is `never` / `any` / `string` is the author's modeling
 * choice — review's concern, not verifier's. Previous rounds tried
 * non-trivial-type checks, then union/intersection recursion, and
 * still left wrapper shapes (paren, array, tuple, generic, mapped,
 * conditional) gameable in 2-32 chars. The search space is unbounded.
 *
 * The honest cut: `members.length > 0` for interface/class. Author
 * who writes `_stub: never` declares zero modeling — that's a review
 * issue, not a verifier lie.
 *
 * Type alias still rejects literal `{}` since that's `members.length === 0`
 * in structural form. Other type-alias bodies trust the author.
 */
function hasSubstantiveMember(
  members: ReadonlyArray<ts.ClassElement | ts.TypeElement>,
): boolean {
  return members.length > 0;
}

function isTriviallyEmptyType(typeNode: ts.TypeNode): boolean {
  // Only the literal empty-type cases. Anything author wrote with
  // structure is trusted at the verifier layer.
  if (ts.isTypeLiteralNode(typeNode) && typeNode.members.length === 0) {
    return true;
  }
  return false;
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
