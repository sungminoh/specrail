// INV-WATCH-1 enforcement: only allow paths under <projectRoot>/docs/spec/ and <projectRoot>/changes/.
import { resolve, sep } from 'node:path';

const ALLOWED_SUBPATHS = ['docs/spec', 'docs/spec/changes', 'changes'];

export class PathTraversalError extends Error {
  constructor(public readonly attempted: string) {
    super(`path traversal blocked: ${attempted}`);
    this.name = 'PathTraversalError';
  }
}

/** Validate that `relPath` resolves inside one of the allowed subpaths under `projectRoot`. */
export function safeJoin(projectRoot: string, relPath: string): string {
  const root = resolve(projectRoot);
  const target = resolve(root, relPath);
  if (!(target === root || target.startsWith(root + sep))) {
    throw new PathTraversalError(relPath);
  }
  const rel = target.slice(root.length + 1);
  const normalized = rel.replace(/\\/g, '/');
  const allowed = ALLOWED_SUBPATHS.some(
    (sub) => normalized === sub || normalized.startsWith(sub + '/'),
  );
  if (!allowed) throw new PathTraversalError(relPath);
  return target;
}

export function isAllowedAbsolutePath(projectRoot: string, absPath: string): boolean {
  try {
    const root = resolve(projectRoot);
    if (!(absPath === root || absPath.startsWith(root + sep))) return false;
    const rel = absPath.slice(root.length + 1).replace(/\\/g, '/');
    return ALLOWED_SUBPATHS.some((sub) => rel === sub || rel.startsWith(sub + '/'));
  } catch {
    return false;
  }
}
