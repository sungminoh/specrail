#!/usr/bin/env node
// npx entrypoint for @specrail/dashboard.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import open from 'open';
import { start } from '../server/main.js';
import { RegistryAdapter } from '../server/adapters/registry.js';

interface Args {
  project?: string;
  port?: number;
  host?: string;
  noOpen?: boolean;
  help?: boolean;
  version?: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--version' || a === '-v') args.version = true;
    else if (a === '--no-open') args.noOpen = true;
    else if (a?.startsWith('--project=')) args.project = a.slice('--project='.length);
    else if (a === '--project') args.project = argv[++i];
    else if (a?.startsWith('--port=')) args.port = Number(a.slice('--port='.length));
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a?.startsWith('--host=')) args.host = a.slice('--host='.length);
    else if (a === '--host') args.host = argv[++i];
  }
  return args;
}

const HELP = `specrail-dashboard — local web app for specrail 13-phase markdown specs

USAGE:
  npx @specrail/dashboard [options]

OPTIONS:
  --project <path>   Auto-register this project root (must contain docs/spec/01-prd.md)
  --port <n>         HTTP port (0 = random free, default 0)
  --host <addr>      Bind address (default 127.0.0.1; use --host=0.0.0.0 to expose externally — warning printed)
  --no-open          Don't auto-open browser
  -h, --help         Show this help
  -v, --version      Show package version
`;

async function readVersion(): Promise<string> {
  // dist/bin/specrail-dashboard.js → ../../package.json
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      resolve(here, '../../package.json'),
      resolve(here, '../package.json'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        const raw = await readFile(p, 'utf8');
        const json = JSON.parse(raw) as { name?: string; version?: string };
        if (json.name === '@specrail/dashboard' && json.version) return json.version;
      }
    }
  } catch {
    // fall through
  }
  return 'unknown';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  if (args.version) {
    const v = await readVersion();
    process.stdout.write(`${v}\n`);
    return;
  }

  if (args.host && args.host !== '127.0.0.1' && args.host !== 'localhost') {
    process.stderr.write(
      `[warn] Binding to ${args.host} exposes the dashboard beyond localhost.\n` +
        `       Starting in 5 seconds — press Ctrl-C to abort.\n`,
    );
    await new Promise((res) => setTimeout(res, 5000));
  }

  // Optionally register --project before starting.
  if (args.project) {
    const root = resolve(args.project);
    if (!existsSync(`${root}/docs/spec/01-prd.md`)) {
      process.stderr.write(
        `[error] --project ${root} is not a specrail project (docs/spec/01-prd.md missing)\n`,
      );
      process.exit(1);
    }
    const reg = await RegistryAdapter.open();
    await reg.register(root);
  }

  const { url } = await start({ host: args.host ?? '127.0.0.1', port: args.port ?? 0 });
  process.stdout.write(`specrail-dashboard ready: ${url}\n`);
  if (!args.noOpen) {
    try {
      await open(url);
    } catch (e) {
      process.stderr.write(`[warn] could not open browser: ${(e as Error).message}\n`);
    }
  }
}

main().catch((e) => {
  process.stderr.write(`[fatal] ${(e as Error).stack ?? e}\n`);
  process.exit(1);
});
