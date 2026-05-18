# Delta — Phase 08 (System Architecture)

**Base:** `docs/spec/08-system-architecture.md`
**Proposal:** [../proposal.md](../proposal.md)

## ARCH-4 (core domain library) — MODIFIED

기존 책임 표 row 에 추가:

| 추가 책임 |
|-----------|
| `<!-- specrail:attrs -->` block 의 closed-enum 8 edge keys (`solves`, `linked-features`, `parent`, `tested-by`, `covers-ac`, `mitigates`, `linked-arch`, `depends-on`) parsing → typed-refs |
| attrs scalars (`status`, `importance`, `owner`) 추출 → per-id metadata |
| `Phase.parsedRefs` 가 typed + prose refs 의 union 으로 변경 |

여전히 0 I/O, 0 process, 0 network. yaml runtime 의존 없음 (regex / line-scan).

## ARCH-2 (Hono HTTP/SSE server) — MODIFIED (payload only, route shape 그대로)

기존 sequence diagram 의 `Graph: project graph (nodes+edges)` 항목 확장:

```
GET /api/projects/:id/graph response:
{
  nodes: [{
    id: string,
    phase: number,
    kind: string | null,
    status?: string         // ADDED — from attrs scalars
  }],
  edges: [{
    from: string,
    to: string,
    phase: number,
    line: number,
    kind?: "solves" | "linked-features" | "parent" | "tested-by"
        | "covers-ac" | "mitigates" | "linked-arch" | "depends-on"
                            // ADDED — undefined = prose mention
  }]
}
```

Backward compat: 모든 추가 fields 가 optional → 0.1.0-alpha.1 client 가 deserialize 통과.

## ARCH-? (web) — MODIFIED

기존 web layer 책임에 추가:
> `useGraphConnections(projectId, focusId)` — cached graph query 에서 in/out neighbors 를 edge kind 별로 group 핑. 새 API 호출 없음.

## ADD — payload contract test

새 server integration test:
- typed-ref payload 가 schema 통과
- 동일 project 의 graph 호출 2회: edge.kind 안정 (deterministic)

## Persisted contracts (no change)

- File watcher (ARCH-5), env-paths registry (ARCH-7), CSRF middleware, Claude CLI adapter (ARCH-6) — 변화 없음.
