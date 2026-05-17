// Project ID = sha256(absolute root path) first 16 hex chars. Deterministic per machine.
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export function projectIdOf(rootPath: string): string {
  const abs = resolve(rootPath);
  return createHash('sha256').update(abs).digest('hex').slice(0, 16);
}
