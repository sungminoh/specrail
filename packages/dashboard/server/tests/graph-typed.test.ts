import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
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
let projectId: string;

async function bootstrap() {
  dataDir = await mkdtemp(join(tmpdir(), 'specrail-typed-'));
  process.env.SPECRAIL_DASHBOARD_DATA_DIR = dataDir;
  projectRoot = await mkdtemp(join(tmpdir(), 'specrail-typed-proj-'));
  await mkdir(join(projectRoot, 'docs/spec'), { recursive: true });

  // Required by INV-PROJECT-1.
  await writeFile(
    join(projectRoot, 'docs/spec/01-prd.md'),
    '---\nphase: 1\nstatus: Approved\n---\n# PRD\n',
  );

  // Phase 3: R1 defined with attrs scalars + typed-refs (all 8 kinds split across two ids).
  await writeFile(
    join(projectRoot, 'docs/spec/03-features.md'),
    [
      '---', 'phase: 3', 'status: Approved', '---',
      '# Features', '',
      '## R1: Spec view',
      '',
      '<!-- specrail:attrs id=R1 -->',
      '```yaml',
      'status: Approved',
      'importance: P0',
      'solves: [PAIN-1]',
      'linked-features: [F1.1]',
      'parent: [R0]',
      'tested-by: [TC-1]',
      '```',
      '<!-- /specrail:attrs -->',
      '',
      '## R2: Cross-ref',
      '',
      '<!-- specrail:attrs id=R2 -->',
      '```yaml',
      'status: Draft',
      'covers-ac: [AC-R1-1]',
      'mitigates: [RISK-1]',
      'linked-arch: [ARCH-1]',
      'depends-on: [F2.1]',
      '```',
      '<!-- /specrail:attrs -->',
      '',
      'Prose mention of ARCH-9 elsewhere.',
      '',
    ].join('\n'),
  );

  const registry = await RegistryAdapter.open();
  app = buildApp({ registry });

  const healthRes = await app.request('/api/health');
  const setCookie = healthRes.headers.get('set-cookie') ?? '';
  const m = setCookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  csrfToken = m?.[1] ?? '';
  cookieHeader = `${CSRF_COOKIE_NAME}=${csrfToken}`;

  const reg = await app.request('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [CSRF_HEADER_NAME]: csrfToken,
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ rootPath: projectRoot }),
  });
  const j = (await reg.json()) as { id?: string };
  projectId = j.id!;
}

beforeEach(bootstrap);
afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true }).catch(() => {});
  await rm(projectRoot, { recursive: true, force: true }).catch(() => {});
  delete process.env.SPECRAIL_DASHBOARD_DATA_DIR;
});

describe('/api/projects/:id/graph — typed refs (T9.2)', () => {
  it('exposes edge.kind for all 8 closed-enum yaml keys', async () => {
    const res = await app.request(`/api/projects/${projectId}/graph`);
    expect(res.status).toBe(200);
    const g = (await res.json()) as {
      nodes: Array<{ id: string; status?: string; phase?: number; kind?: string | null }>;
      edges: Array<{ from: string; to: string; kind?: string }>;
    };
    const kindsSeen = new Set(g.edges.map((e) => e.kind).filter(Boolean));
    expect(kindsSeen).toEqual(new Set([
      'solves',
      'linked-features',
      'parent',
      'tested-by',
      'covers-ac',
      'mitigates',
      'linked-arch',
      'depends-on',
    ]));
  });

  it('typed edges have correct from/to', async () => {
    const res = await app.request(`/api/projects/${projectId}/graph`);
    const g = (await res.json()) as { edges: Array<{ from: string; to: string; kind?: string }> };
    const r1Tested = g.edges.find((e) => e.from === 'R1' && e.kind === 'tested-by');
    expect(r1Tested?.to).toBe('TC-1');
    const r2Mitigates = g.edges.find((e) => e.from === 'R2' && e.kind === 'mitigates');
    expect(r2Mitigates?.to).toBe('RISK-1');
  });

  it('exposes node.status when attrs scalar present', async () => {
    const res = await app.request(`/api/projects/${projectId}/graph`);
    const g = (await res.json()) as { nodes: Array<{ id: string; status?: string }> };
    const r1 = g.nodes.find((n) => n.id === 'R1');
    const r2 = g.nodes.find((n) => n.id === 'R2');
    expect(r1?.status).toBe('Approved');
    expect(r2?.status).toBe('Draft');
  });

  it('prose-only mentions still produce edges (untyped, kind=undefined)', async () => {
    const res = await app.request(`/api/projects/${projectId}/graph`);
    const g = (await res.json()) as { edges: Array<{ from: string; to: string; kind?: string }> };
    // ARCH-9 was mentioned in prose, not in any attrs block → its inbound edge has no kind.
    const arch9 = g.edges.find((e) => e.to === 'ARCH-9');
    expect(arch9).toBeTruthy();
    expect(arch9?.kind).toBeUndefined();
  });

  it('typed-ref suppresses duplicate prose-ref to the same target (no double edges)', async () => {
    // R1 attrs has `tested-by: [TC-1]`. The body also contains "TC-1" implicitly as defined id.
    // The deduper should keep the typed-ref and drop the prose-ref FROM R1 → TC-1.
    const res = await app.request(`/api/projects/${projectId}/graph`);
    const g = (await res.json()) as { edges: Array<{ from: string; to: string; kind?: string }> };
    const r1ToTc1 = g.edges.filter((e) => e.from === 'R1' && e.to === 'TC-1');
    // Exactly one edge with kind 'tested-by' — not two (one typed + one untyped).
    expect(r1ToTc1).toHaveLength(1);
    expect(r1ToTc1[0]?.kind).toBe('tested-by');
  });
});
