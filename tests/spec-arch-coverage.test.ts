// TC-33: INV-4 P0 spec coverage
import { describe, it, expect } from 'vitest';
import { buildGraph } from '../src/graph/builder.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Phase 8 ARCH coverage (US-11.1, M11)', () => {
  it('graph builder recognizes ARCH-8 through ARCH-12', async () => {
    const root = resolve(__dirname, '..');
    const graph = await buildGraph(root);
    for (const id of ['ARCH-8', 'ARCH-9', 'ARCH-10', 'ARCH-11', 'ARCH-12']) {
      expect(graph.definedIds.has(id)).toBe(true);
    }
  });
});
