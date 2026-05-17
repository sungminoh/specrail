// Bundle server + bin into a single dist/bin/specrail-dashboard.js, with native deps as externals.
import * as esbuild from 'esbuild';
import { rmSync, mkdirSync } from 'node:fs';

rmSync('dist/server', { recursive: true, force: true });
rmSync('dist/bin', { recursive: true, force: true });
mkdirSync('dist/bin', { recursive: true });

await esbuild.build({
  entryPoints: ['bin/specrail-dashboard.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: 'dist/bin/specrail-dashboard.js',
  external: [
    'better-sqlite3',
    'chokidar',
    'execa',
    'open',
    'fsevents',
    // Keep gray-matter/remark/unified bundled; they're pure JS.
  ],
  sourcemap: true,
  banner: {
    js: [
      'import { createRequire as __cr } from "node:module";',
      'import { fileURLToPath as __furl } from "node:url";',
      'import { dirname as __dn } from "node:path";',
      'const require = __cr(import.meta.url);',
      'const __filename = __furl(import.meta.url);',
      'const __dirname = __dn(__filename);',
    ].join('\n'),
  },
});

console.log('✓ server bundle: dist/bin/specrail-dashboard.js');
