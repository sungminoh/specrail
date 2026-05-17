import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../app.js';
import { RegistryAdapter } from '../adapters/registry.js';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../middleware/csrf.js';
import { StubClaudeCli } from '../adapters/claude-cli.js';
import { AiService } from '../services/ai.js';
import { PatchesService } from '../services/patches.js';

let dataDir: string;
let projectRoot: string;
let app: ReturnType<typeof buildApp>;
let csrfToken: string;
let cookieHeader: string;
let projectId: string;

async function bootstrap() {
  dataDir = await mkdtemp(join(tmpdir(), 'specrail-ai-'));
  projectRoot = await mkdtemp(join(tmpdir(), 'specrail-proj-'));
  process.env.SPECRAIL_DASHBOARD_DATA_DIR = dataDir;
  await mkdir(join(projectRoot, 'docs/spec'), { recursive: true });
  await writeFile(
    join(projectRoot, 'docs/spec/01-prd.md'),
    `---\nphase: 1\nstatus: Approved\n---\n# PRD\nOriginal sentence.\n`,
  );
  PatchesService.__reset();
  AiService.__reset();
  // Canned CLI emits text including a patch JSON envelope
  const cli = new StubClaudeCli([
    { type: 'text', delta: 'I see one improvement.\n\n' },
    {
      type: 'text',
      delta:
        '```json\n' +
        JSON.stringify({
          patches: [
            {
              phase: 1,
              hunks: [
                { before: 'Original sentence.', after: 'Original sentence. Patched by AI.', rationale: 'add detail' },
              ],
            },
          ],
        }) +
        '\n```',
    },
    { type: 'done', stopReason: 'end' },
  ]);
  const registry = await RegistryAdapter.open();
  app = buildApp({ registry, claudeCli: cli });
  const h = await app.request('/api/health');
  const sc = h.headers.get('set-cookie') ?? '';
  csrfToken = sc.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))?.[1] ?? '';
  cookieHeader = `${CSRF_COOKIE_NAME}=${csrfToken}`;
  const reg = await app.request('/api/projects', {
    method: 'POST',
    headers: { [CSRF_HEADER_NAME]: csrfToken, Cookie: cookieHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rootPath: projectRoot }),
  });
  const body = await reg.json();
  projectId = body.id;
}

function mutHeaders(): HeadersInit {
  return { [CSRF_HEADER_NAME]: csrfToken, Cookie: cookieHeader, 'Content-Type': 'application/json' };
}

beforeEach(bootstrap);
afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
  await rm(projectRoot, { recursive: true, force: true });
  delete process.env.SPECRAIL_DASHBOARD_DATA_DIR;
});

describe('AI sessions w/ stub CLI', () => {
  it('chat origin → message → patch.proposed → patch accept rewrites file', async () => {
    const create = await app.request(`/api/projects/${projectId}/ai/sessions`, {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({ origin: 'chat' }),
    });
    expect(create.status).toBe(201);
    const session = await create.json();
    expect(session.status).toBe('idle');

    const msg = await app.request(`/api/projects/${projectId}/ai/sessions/${session.id}/messages`, {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({ phase: 1, content: 'improve' }),
    });
    expect(msg.status).toBe(202);

    // Wait until session done
    let attempts = 0;
    while (attempts++ < 60) {
      await new Promise((res) => setTimeout(res, 50));
      const list = await app.request(`/api/projects/${projectId}/ai/sessions`, {
        headers: { Cookie: cookieHeader },
      });
      const sessions = await list.json();
      const s = sessions.find((x: { id: string }) => x.id === session.id);
      if (s && (s.status === 'done' || s.status === 'error')) break;
    }
    const finalList = await app.request(`/api/projects/${projectId}/ai/sessions`, {
      headers: { Cookie: cookieHeader },
    });
    const final = (await finalList.json()).find((x: { id: string }) => x.id === session.id);
    expect(final.status).toBe('done');

    // Should have produced one patch
    expect(final.proposedPatchIds.length).toBeGreaterThanOrEqual(1);
    const patchId = final.proposedPatchIds[0];
    const accept = await app.request(`/api/projects/${projectId}/patches/${patchId}/accept`, {
      method: 'POST',
      headers: mutHeaders(),
    });
    expect(accept.status).toBe(200);

    const phase = await (
      await app.request(`/api/projects/${projectId}/phases/1`, { headers: { Cookie: cookieHeader } })
    ).json();
    expect(phase.body).toContain('Patched by AI');
  });
});
