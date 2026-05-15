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
 * Architect round-N+1 attack vector: `interface User { _stub: never; }`
 * satisfied the previous `members.length > 0` check trivially. Require
 * at least one member whose declared type is NOT one of the trivial
 * placeholders (`never` / `any` / `unknown` / `void` / `undefined` /
 * `null` / `{}`). Class methods / accessors and property signatures
 * without a type annotation (inferred) count as substantive.
 */
function hasSubstantiveMember(
  members: ReadonlyArray<ts.ClassElement | ts.TypeElement>,
): boolean {
  if (members.length === 0) return false;
  for (const m of members) {
    if (
      ts.isMethodDeclaration(m) ||
      ts.isMethodSignature(m) ||
      ts.isGetAccessor(m) ||
      ts.isSetAccessor(m) ||
      ts.isConstructorDeclaration(m) ||
      ts.isConstructSignatureDeclaration(m) ||
      ts.isCallSignatureDeclaration(m) ||
      ts.isIndexSignatureDeclaration(m)
    ) {
      return true; // any callable/accessor member is non-trivial
    }
    if (
      ts.isPropertyDeclaration(m) ||
      ts.isPropertySignature(m)
    ) {
      if (!m.type) return true; // inferred type, treat as substantive
      if (!isTriviallyEmptyType(m.type)) return true;
    }
    if (ts.isEnumMember(m as unknown as ts.Node)) {
      return true;
    }
  }
  return false;
}

function isTriviallyEmptyType(typeNode: ts.TypeNode): boolean {
  if (typeNode.kind === ts.SyntaxKind.AnyKeyword) return true;
  if (typeNode.kind === ts.SyntaxKind.NeverKeyword) return true;
  if (typeNode.kind === ts.SyntaxKind.UnknownKeyword) return true;
  if (typeNode.kind === ts.SyntaxKind.ObjectKeyword) return true;
  if (typeNode.kind === ts.SyntaxKind.VoidKeyword) return true;
  if (typeNode.kind === ts.SyntaxKind.UndefinedKeyword) return true;
  if (typeNode.kind === ts.SyntaxKind.NullKeyword) return true;
  // `null` in type position is a LiteralTypeNode wrapping NullLiteral.
  if (
    ts.isLiteralTypeNode(typeNode) &&
    typeNode.literal.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }
  if (ts.isTypeLiteralNode(typeNode) && typeNode.members.length === 0) {
    return true;
  }
  // Architect round-N+2: `string | never`, `void | undefined`, etc.
  // wrap the trivial leaves in a union/intersection node and bypassed
  // the leaf-only keyword check. A union of ALL trivials is itself
  // trivial; same for intersection.
  if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
    return typeNode.types.every(isTriviallyEmptyType);
  }
  // `typeof undefined` — TypeQuery wrapping the undefined identifier
  // is structurally the same as undefined.
  if (ts.isTypeQueryNode(typeNode)) {
    const name = typeNode.exprName;
    if (ts.isIdentifier(name)) {
      const t = name.text;
      if (t === 'undefined' || t === 'null') return true;
    }
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
