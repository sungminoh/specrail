import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000, // 30s — accommodates npx tsx cold spawn for CLI integration tests
    hookTimeout: 30000,
  },
});
