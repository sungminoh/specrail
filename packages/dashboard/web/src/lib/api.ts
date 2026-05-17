// Typed API client. Reads CSRF cookie + includes header on mutations.
import type { Project, Phase, PhaseNumber, Issue, PatchProposal, Hunk } from '@specrail/core';

const CSRF_HEADER = 'x-specrail-csrf';
const CSRF_COOKIE = 'specrail_csrf';

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m?.[1] ?? '';
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const method = init?.method?.toUpperCase() ?? 'GET';
  if (method !== 'GET') {
    const token = readCookie(CSRF_COOKIE);
    headers.set(CSRF_HEADER, token);
    if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers, credentials: 'include' });
  if (!res.ok) {
    const errBody = await res.text();
    throw new ApiError(res.status, errBody);
  }
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return undefined as T;
}

export class ApiError extends Error {
  constructor(public readonly status: number, body: string) {
    super(`API ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

export const api = {
  health: () => req<{ ok: boolean; csrf: string }>(`/api/health`),
  listProjects: () => req<Project[]>(`/api/projects`),
  registerProject: (rootPath: string) =>
    req<Project>(`/api/projects`, { method: 'POST', body: JSON.stringify({ rootPath }) }),
  openProject: (id: string) => req<Project>(`/api/projects/${id}/open`, { method: 'POST' }),
  deleteProject: (id: string) => req<void>(`/api/projects/${id}`, { method: 'DELETE' }),

  listPhases: (id: string) =>
    req<
      Array<{
        number: PhaseNumber;
        slug: string;
        filePath: string;
        status: string | null;
        mtimeMs: number;
        idCount: number;
        refCount: number;
      }>
    >(`/api/projects/${id}/phases`),
  getPhase: (id: string, n: PhaseNumber) => req<Phase>(`/api/projects/${id}/phases/${n}`),
  writePhase: (id: string, n: PhaseNumber, content: string, basedOnMtimeMs: number) =>
    req<{ mtimeMs: number }>(`/api/projects/${id}/phases/${n}`, {
      method: 'PUT',
      body: JSON.stringify({ content, basedOnMtimeMs }),
    }),

  eventsUrl: (id: string) => `/api/projects/${id}/events`,

  listIssues: (id: string) => req<Issue[]>(`/api/projects/${id}/issues`),
  refreshIssues: (id: string) =>
    req<{ count: number }>(`/api/projects/${id}/issues/refresh`, { method: 'POST' }),

  getPatch: (id: string, pid: string) => req<PatchProposal>(`/api/projects/${id}/patches/${pid}`),
  createPatch: (
    id: string,
    body: {
      origin: 'issue-fix' | 'chat' | 'inline-rewrite';
      phase: PhaseNumber;
      hunks: Hunk[];
      rationale?: string;
      basedOnMtimeMs: number;
    },
  ) =>
    req<PatchProposal>(`/api/projects/${id}/patches`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  acceptPatch: (id: string, pid: string) =>
    req<PatchProposal>(`/api/projects/${id}/patches/${pid}/accept`, { method: 'POST' }),
  rejectPatch: (id: string, pid: string) =>
    req<PatchProposal>(`/api/projects/${id}/patches/${pid}/reject`, { method: 'POST' }),

  getGraph: (id: string) =>
    req<{
      nodes: Array<{ id: string; phase: number; kind: string | null }>;
      edges: Array<{ from: string; to: string; phase: number; line: number }>;
    }>(`/api/projects/${id}/graph`),

  // AI sessions
  listSessions: (id: string) =>
    req<Array<{ id: string; origin: string; status: string; proposedPatchIds: string[] }>>(
      `/api/projects/${id}/ai/sessions`,
    ),
  createSession: (id: string, origin: 'review-scan' | 'chat' | 'inline') =>
    req<{ id: string; status: string; origin: string }>(`/api/projects/${id}/ai/sessions`, {
      method: 'POST',
      body: JSON.stringify({ origin }),
    }),
  sendMessage: (
    id: string,
    sid: string,
    body: { phase: PhaseNumber; content: string; selection?: string; surrounding?: string },
  ) =>
    req<{ ok: true }>(`/api/projects/${id}/ai/sessions/${sid}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  abortSession: (id: string, sid: string) =>
    req<void>(`/api/projects/${id}/ai/sessions/${sid}`, { method: 'DELETE' }),
};
