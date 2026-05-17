import { serve } from '@hono/node-server';
import { buildApp } from './app.js';
import { RegistryAdapter } from './adapters/registry.js';

export interface StartOptions {
  host?: string;
  port?: number;
}

export async function start(opts: StartOptions = {}): Promise<{ url: string; close: () => Promise<void> }> {
  const registry = await RegistryAdapter.open();
  const app = buildApp({ registry });
  const host = opts.host ?? '127.0.0.1';
  const port = opts.port ?? 0;
  return new Promise((resolve) => {
    const server = serve({ fetch: app.fetch, hostname: host, port }, (info) => {
      const url = `http://${host}:${info.port}`;
      resolve({
        url,
        close: () =>
          new Promise<void>((res) => {
            server.close(() => res());
          }),
      });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start({ port: Number(process.env.PORT ?? 0) }).then(({ url }) => {
    process.stdout.write(`specrail-dashboard listening on ${url}\n`);
  });
}
