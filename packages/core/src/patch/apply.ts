import type { Hunk } from '../spec/types.js';

export class PatchConflictError extends Error {
  constructor(
    message: string,
    public readonly hunk: Hunk,
  ) {
    super(message);
    this.name = 'PatchConflictError';
  }
}

/**
 * Apply hunks sequentially to `body`. Each hunk replaces a single occurrence of `before` with `after`.
 *
 * Conflict behavior:
 *   - If `before` does not appear in body → throw PatchConflictError ("hunk not found")
 *   - If `before` appears multiple times → throw PatchConflictError ("ambiguous: N matches")
 */
export function applyHunks(body: string, hunks: Hunk[]): string {
  let out = body;
  for (let i = 0; i < hunks.length; i++) {
    const hunk = hunks[i];
    if (!hunk) continue;
    const idx = out.indexOf(hunk.before);
    if (idx < 0) {
      throw new PatchConflictError(`hunk ${i + 1}/${hunks.length} not found in body`, hunk);
    }
    const second = out.indexOf(hunk.before, idx + 1);
    if (second >= 0) {
      throw new PatchConflictError(
        `hunk ${i + 1}/${hunks.length} ambiguous: matches at offset ${idx} and ${second}`,
        hunk,
      );
    }
    out = out.slice(0, idx) + hunk.after + out.slice(idx + hunk.before.length);
  }
  return out;
}
