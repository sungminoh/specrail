import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from '../src/markdown/yaml.js';

describe('yaml parser (H-Round3-1, defensive array copy)', () => {
  it('parsed array is independent of internal state (R3 H-Round3-1)', () => {
    const yaml = `phase: 3
items:
  - first
  - second
status: Draft
`;
    const result = parseYaml(yaml);
    const items = result.items as string[];
    items.push('mutated');
    // Re-parse — should NOT see 'mutated'
    const result2 = parseYaml(yaml);
    expect((result2.items as string[]).length).toBe(2);
  });

  it('each parseYaml call returns a fresh array (R3 H-Round3-1)', () => {
    const yaml = `tags:
  - alpha
  - beta
`;
    const r1 = parseYaml(yaml);
    const r2 = parseYaml(yaml);
    // Each parse returns an independent array — not the same reference
    expect(r1.tags).not.toBe(r2.tags);
    expect(r1.tags).toEqual(r2.tags);
  });
});
