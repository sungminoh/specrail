import { describe, it, expect } from 'vitest';
import { extractPatches, applyHunks, PatchConflictError } from '../src/patch/index.js';

describe('extractPatches', () => {
  it('extracts a valid envelope from fenced JSON block', () => {
    const text = `Sure. Here\'s the fix:\n\n\`\`\`json\n${JSON.stringify({
      patches: [
        { phase: 9, hunks: [{ before: 'NFR-1', after: 'NFR-1 (unit: ms)', rationale: 'add unit' }] },
      ],
    })}\n\`\`\``;
    const r = extractPatches(text);
    expect(r.envelopes).toHaveLength(1);
    expect(r.envelopes[0]?.patches[0]?.hunks[0]?.rationale).toBe('add unit');
    expect(r.errors).toEqual([]);
  });

  it('ignores non-JSON fenced blocks', () => {
    const text = `\`\`\`bash\nls -la\n\`\`\`\nNothing.`;
    const r = extractPatches(text);
    expect(r.envelopes).toEqual([]);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('reports validation error when JSON does not match envelope', () => {
    const text = `\`\`\`json\n{"hello": "world"}\n\`\`\``;
    const r = extractPatches(text);
    expect(r.envelopes).toEqual([]);
    expect(r.errors[0]).toContain('failed validation');
  });
});

describe('applyHunks', () => {
  it('applies a happy-path single hunk', () => {
    const body = 'one two three';
    const result = applyHunks(body, [{ before: 'two', after: 'TWO' }]);
    expect(result).toBe('one TWO three');
  });

  it('applies sequential hunks', () => {
    const body = 'a b c';
    const result = applyHunks(body, [
      { before: 'a', after: 'A' },
      { before: 'c', after: 'C' },
    ]);
    expect(result).toBe('A b C');
  });

  it('throws PatchConflictError when before-text is missing', () => {
    expect(() => applyHunks('hello', [{ before: 'world', after: 'WORLD' }])).toThrow(PatchConflictError);
  });

  it('throws PatchConflictError when before-text is ambiguous (multiple matches)', () => {
    expect(() => applyHunks('ab ab', [{ before: 'ab', after: 'AB' }])).toThrow(/ambiguous/);
  });
});
