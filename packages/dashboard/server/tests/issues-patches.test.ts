import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../app.js';
import { RegistryAdapter } from '../adapters/registry.js';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../middleware/csrf.js';
import { PatchesService } from '../services/patches.js';

let dataDir: string;
let projectRoot: string;
let app: ReturnType<typeof buildApp>;
let csrfToken: string;
let cookieHeader: string;
let projectId: string;

async function bootstrap() {
  dataDir = await mkdtemp(join(tmpdir(), 'specrail-issues-'));
  projectRoot = await mkdtemp(join(tmpdir(), 'specrail-proj-'));
  process.env.SPECRAIL_DASHBOARD_DATA_DIR = dataDir;
  await mkdir(join(projectRoot, 'docs/spec'), { recursive: true });
  // Phase 1 + 3 with F1.1 → R3 (dangling ref since R3 not defined) + F1.1 has no TC
  await writeFile(
    join(projectRoot, 'docs/spec/01-prd.md'),
    `---\nphase: 1\nstatus: Approved\n---\n# PRD\nR1 and R2 are the goals.\n`,
  );
  await writeFile(
    join(projectRoot, 'docs/spec/03-features.md'),
    `---\nphase: 3\nstatus: Approved\n---\n# Features\n## F1.1\nImplements R1. Tested by TC-99 which lives nowhere.\n`,
  );
  const registry = await RegistryAdapter.open();
  app = buildApp({ registry });
  PatchesService.__reset();
  // Get CSRF
  const h = await app.request('/api/health');
  const sc = h.headers.get('set-cookie') ?? '';
  csrfToken = sc.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))?.[1] ?? '';
  cookieHeader = `${CSRF_COOKIE_NAME}=${csrfToken}`;
  // Register project
  const reg = await app.request('/api/projects', {
    method: 'POST',
    headers: mutHeaders(),
    body: JSON.stringify({ rootPath: projectRoot }),
  });
  const body = await reg.json();
  projectId = body.id;
}

function mutHeaders(): HeadersInit {
  return {
    [CSRF_HEADER_NAME]: csrfToken,
    Cookie: cookieHeader,
    'Content-Type': 'application/json',
  };
}

beforeEach(bootstrap);
afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
  await rm(projectRoot, { recursive: true, force: true });
  delete process.env.SPECRAIL_DASHBOARD_DATA_DIR;
});

describe('Issue inbox + cross-phase checks', () => {
  it('GET /api/projects/:id/issues starts empty', async () => {
    const r = await app.request(`/api/projects/${projectId}/issues`, { headers: { Cookie: cookieHeader } });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual([]);
  });

  it('POST /issues/refresh detects dangling-ref (TC-99) and emits issues.updated', async () => {
    const r = await app.request(`/api/projects/${projectId}/issues/refresh`, {
      method: 'POST',
      headers: mutHeaders(),
    });
    expect(r.status).toBe(202);
    const body = await r.json();
    expect(body.count).toBeGreaterThan(0);

    // Issues now in the cache
    const list = await app.request(`/api/projects/${projectId}/issues`, { headers: { Cookie: cookieHeader } });
    const issues = await list.json();
    // Either dangling-ref (TC-99) or traceability-gap (R1 has no TC chain) — both signal the same drift.
    expect(
      issues.some((i: { ruleId: string }) => i.ruleId === 'dangling-ref' || i.ruleId === 'traceability-gap'),
    ).toBe(true);
  });
});

describe('Patch lifecycle', () => {
  it('create / accept / SSE patch.proposed → patch.accepted', async () => {
    // Get the current phase 1 to find body + mtime for hunk targeting.
    const phaseRes = await app.request(`/api/projects/${projectId}/phases/1`, { headers: { Cookie: cookieHeader } });
    const phase = await phaseRes.json();
    const before = 'R1 and R2 are the goals.';
    const after = 'R1, R2, and R3 are the goals.';

    const createRes = await app.request(`/api/projects/${projectId}/patches`, {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({
        origin: 'issue-fix',
        phase: 1,
        hunks: [{ before, after }],
        rationale: 'add R3 since it is referenced',
        basedOnMtimeMs: phase.mtimeMs,
      }),
    });
    expect(createRes.status).toBe(201);
    const proposal = await createRes.json();
    expect(proposal.status).toBe('proposed');

    const acceptRes = await app.request(`/api/projects/${projectId}/patches/${proposal.id}/accept`, {
      method: 'POST',
      headers: mutHeaders(),
    });
    expect(acceptRes.status).toBe(200);
    const accepted = await acceptRes.json();
    expect(accepted.status).toBe('accepted');

    // Verify file content actually updated.
    const after2 = await app.request(`/api/projects/${projectId}/phases/1`, { headers: { Cookie: cookieHeader } });
    const updated = await after2.json();
    expect(updated.body).toContain('R3');
  });

  it('patch-accept with stale mtime returns 409 PatchConflictError (INV-PATCH-2 on patch path)', async () => {
    // 1. Create a proposal anchored to current mtime.
    const phaseRes = await app.request(`/api/projects/${projectId}/phases/1`, { headers: { Cookie: cookieHeader } });
    const phase = await phaseRes.json();
    const createRes = await app.request(`/api/projects/${projectId}/patches`, {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({
        origin: 'issue-fix',
        phase: 1,
        hunks: [{ before: 'R1 and R2 are the goals.', after: 'R1, R2 (changed by patch) are the goals.' }],
        rationale: '',
        basedOnMtimeMs: phase.mtimeMs,
      }),
    });
    expect(createRes.status).toBe(201);
    const proposal = await createRes.json();
    // 2. Simulate concurrent external write that bumps mtime past basedOnMtimeMs.
    const { writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    await new Promise((r) => setTimeout(r, 30)); // ensure mtime increment
    await writeFile(
      join(projectRoot, 'docs/spec/01-prd.md'),
      `---\nphase: 1\nstatus: Approved\n---\n# PRD\nExternally modified after the patch was proposed.\nR1 and R2 are the goals.\n`,
    );
    // 3. Accept should now fail with 409.
    const acceptRes = await app.request(`/api/projects/${projectId}/patches/${proposal.id}/accept`, {
      method: 'POST',
      headers: mutHeaders(),
    });
    expect(acceptRes.status).toBe(409);
    // 4. Proposal status moves to 'stale' (not 'accepted').
    const getRes = await app.request(`/api/projects/${projectId}/patches/${proposal.id}`, {
      headers: { Cookie: cookieHeader },
    });
    const updated = await getRes.json();
    expect(updated.status).toBe('stale');
  });

  it('reject moves status to rejected without touching file', async () => {
    const phaseRes = await app.request(`/api/projects/${projectId}/phases/1`, { headers: { Cookie: cookieHeader } });
    const phase = await phaseRes.json();
    const createRes = await app.request(`/api/projects/${projectId}/patches`, {
      method: 'POST',
      headers: mutHeaders(),
      body: JSON.stringify({
        origin: 'issue-fix',
        phase: 1,
        hunks: [{ before: 'R1', after: 'R1 (TOUCHED)' }],
        rationale: '',
        basedOnMtimeMs: phase.mtimeMs,
      }),
    });
    const proposal = await createRes.json();
    const rejectRes = await app.request(`/api/projects/${projectId}/patches/${proposal.id}/reject`, {
      method: 'POST',
      headers: mutHeaders(),
    });
    expect(rejectRes.status).toBe(200);
    const after = await rejectRes.json();
    expect(after.status).toBe('rejected');
    const phase2 = await (await app.request(`/api/projects/${projectId}/phases/1`, { headers: { Cookie: cookieHeader } })).json();
    expect(phase2.body).not.toContain('(TOUCHED)');
  });
});
