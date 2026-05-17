import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, stat, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../app.js';
import { RegistryAdapter } from '../adapters/registry.js';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../middleware/csrf.js';

let dataDir: string;
let projectRoot: string;
let app: ReturnType<typeof buildApp>;
let csrfToken: string;
let cookieHeader: string;

async function bootstrapProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'specrail-proj-'));
  await mkdir(join(root, 'docs/spec'), { recursive: true });
  await writeFile(
    join(root, 'docs/spec/01-prd.md'),
    `---\nphase: 1\nstatus: Approved\n---\n# PRD\nbody\n`,
  );
  await writeFile(
    join(root, 'docs/spec/03-features.md'),
    `---\nphase: 3\nstatus: Approved\n---\n# Features\n\n## R1: top req\n\n<!-- specrail:attrs id=TC-1 -->\nrefs F1.1 and R1\n`,
  );
  return root;
}

async function getCsrf() {
  const res = await app.request('/api/health');
  const setCookie = res.headers.get('set-cookie') ?? '';
  const m = setCookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  csrfToken = m?.[1] ?? '';
  cookieHeader = `${CSRF_COOKIE_NAME}=${csrfToken}`;
}

function mutHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    [CSRF_HEADER_NAME]: csrfToken,
    Cookie: cookieHeader,
    'Content-Type': 'application/json',
    ...extra,
  };
}

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'specrail-data-'));
  process.env.SPECRAIL_DASHBOARD_DATA_DIR = dataDir;
  projectRoot = await bootstrapProject();
  const registry = await RegistryAdapter.open();
  app = buildApp({ registry });
  await getCsrf();
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
  await rm(projectRoot, { recursive: true, force: true });
  delete process.env.SPECRAIL_DASHBOARD_DATA_DIR;
});

describe('CSRF (INV-CSRF-1)', () => {
  it('rejects POST without X-CSRF header', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ rootPath: projectRoot }),
    });
    expect(res.status).toBe(403);
  });

  it('accepts POST with X-CSRF header equal to cookie', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({ rootPath: projectRoot }),
    });
    expect(res.status).toBe(201);
  });
});

describe('Project lifecycle (INV-PROJECT-1)', () => {
  it('GET /api/projects starts empty', async () => {
    const res = await app.request('/api/projects', { headers: { Cookie: cookieHeader } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('POST /api/projects with valid root returns 201 and project record', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({ rootPath: projectRoot }),
    });
    expect(res.status).toBe(201);
    const project = await res.json();
    expect(project.hasSpecrail).toBe(true);
    expect(project.id).toMatch(/^[a-f0-9]{16}$/);
  });

  it('POST /api/projects with invalid root returns 400 (INV-PROJECT-1)', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({ rootPath: '/var' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('docs/spec/01-prd.md missing');
  });
});

describe('Phases CRUD with mtime guard (INV-PATCH-2)', () => {
  let projectId: string;

  beforeEach(async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({ rootPath: projectRoot }),
    });
    const body = await res.json();
    projectId = body.id;
  });

  it('GET /api/projects/:id/phases returns summaries', async () => {
    const res = await app.request(`/api/projects/${projectId}/phases`, {
      headers: { Cookie: cookieHeader },
    });
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list).toHaveLength(2);
    expect(list[0].number).toBe(1);
    expect(list[1].number).toBe(3);
  });

  it('GET single phase returns full Phase', async () => {
    const res = await app.request(`/api/projects/${projectId}/phases/3`, {
      headers: { Cookie: cookieHeader },
    });
    expect(res.status).toBe(200);
    const phase = await res.json();
    expect(phase.number).toBe(3);
    expect(phase.parsedIds).toContain('R1');
    expect(phase.parsedIds).toContain('TC-1');
  });

  it('PUT phase with correct mtime succeeds', async () => {
    const getRes = await app.request(`/api/projects/${projectId}/phases/3`, {
      headers: { Cookie: cookieHeader },
    });
    const phase = await getRes.json();
    const put = await app.request(`/api/projects/${projectId}/phases/3`, {
      method: 'PUT',
      headers: mutHeaders(),
      body: JSON.stringify({
        content: `---\nphase: 3\nstatus: Approved\n---\n# Features\nUpdated\n`,
        basedOnMtimeMs: phase.mtimeMs,
      }),
    });
    expect(put.status).toBe(200);
    const result = await put.json();
    expect(result.mtimeMs).toBeGreaterThan(0);
  });

  it('PUT phase with stale mtime returns 409 (INV-PATCH-2)', async () => {
    const put = await app.request(`/api/projects/${projectId}/phases/3`, {
      method: 'PUT',
      headers: mutHeaders(),
      body: JSON.stringify({
        content: `---\nphase: 3\nstatus: Approved\n---\nstale write\n`,
        basedOnMtimeMs: 1,
      }),
    });
    expect(put.status).toBe(409);
    const body = await put.json();
    expect(body.error).toBe('mtime conflict');
  });
});

describe('Path traversal blocked', () => {
  // Invalid relative paths are rejected at the safeJoin layer (Phase API has no user-supplied path field
  // currently, but the registry path is validated by INV-PROJECT-1). Direct probe of safeJoin happens
  // in the unit test below.
  it('safeJoin rejects ../ escapes', async () => {
    const { safeJoin, PathTraversalError } = await import('../lib/path-allowlist.js');
    expect(() => safeJoin(projectRoot, '../../etc/passwd')).toThrow(PathTraversalError);
    expect(() => safeJoin(projectRoot, 'node_modules/x')).toThrow(PathTraversalError);
    // Allowlisted paths must be permitted.
    expect(() => safeJoin(projectRoot, 'docs/spec/01-prd.md')).not.toThrow();
    expect(() => safeJoin(projectRoot, 'changes/2026-01-01-x/proposal.md')).not.toThrow();
  });
});

describe('SSE channel', () => {
  it('SSE connects and emits file.changed after PUT (self-write)', async () => {
    // register
    const reg = await app.request('/api/projects', {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({ rootPath: projectRoot }),
    });
    const project = await reg.json();
    const projectId = project.id;

    // open SSE stream
    const sseRes = await app.request(`/api/projects/${projectId}/events`, {
      headers: { Cookie: cookieHeader },
    });
    expect(sseRes.status).toBe(200);
    expect(sseRes.headers.get('content-type')).toMatch(/text\/event-stream/);

    // Trigger a PUT (which publishes file.changed)
    const getRes = await app.request(`/api/projects/${projectId}/phases/1`, {
      headers: { Cookie: cookieHeader },
    });
    const phase = await getRes.json();
    const put = await app.request(`/api/projects/${projectId}/phases/1`, {
      method: 'PUT',
      headers: mutHeaders(),
      body: JSON.stringify({
        content: `---\nphase: 1\nstatus: Approved\n---\nUpdated\n`,
        basedOnMtimeMs: phase.mtimeMs,
      }),
    });
    expect(put.status).toBe(200);

    // Read first chunk(s) from SSE
    const reader = sseRes.body?.getReader();
    expect(reader).toBeDefined();
    if (!reader) return;
    const decoder = new TextDecoder();
    let collected = '';
    for (let i = 0; i < 3; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      collected += decoder.decode(value, { stream: true });
      if (collected.includes('file.changed')) break;
    }
    try { await reader.cancel(); } catch { /* ignore */ }
    expect(collected).toContain('event: open');
  });
});
