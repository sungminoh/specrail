# Delta — Phase 13 (Implementation Plan)

**Base:** `docs/spec/13-implementation-plan.md`
**Proposal:** [../proposal.md](../proposal.md)

## ADD — M9: Typed graph relationships + Connections panel

```markdown
### M9: Typed graph relationships + Connections panel

**Goal:** F2.4 (Connections panel) + F2.5 (typed-refs) + F2.6 (graph upgrades)
가 v0.2 의 graph 효용 게이트 만족.

**Dependencies:** M7 (graph view) 완료. M4 (file watcher) — typed-refs 변경 시 graph
invalidation 경로 검증.

**Done definition:**
- All AC: AC-R2-5, AC-R2-6 통과 (TC-GRAPH-EDGE-RENDER-1, TC-CONN-PANEL-1).
- All NFR: NFR-PERF-6, NFR-COMPAT-1 통과 (bench + fixture).
- backward-compat: 기존 0.1.0-alpha.1 client 가 새 /api/graph payload 처리 가능.
- Spec sync: 영향 phase (3, 6, 7, 8, 9, 10) markdown 머지.

#### T9.1: core extractTypedRefs + attrs scalars

<!-- specrail:attrs id=T9.1 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "TC-TYPED-REFS-1 + TC-TYPED-REFS-2 + EDGE-MALFORMED-ATTRS"
commit-msg-stub: "feat(core): typed refs from attrs blocks (8 closed-enum kinds)"
depends-on: [T1.4]
covers-ac: [AC-R2-5]
linked-features: [F2.5]
\`\`\`
<!-- /specrail:attrs -->

- Files: `packages/core/src/spec/attrs.ts` (NEW), `packages/core/src/spec/index.ts` (export),
  `packages/core/src/spec/types.ts` (SpecRefSchema `kind?` field), `packages/core/tests/attrs.test.ts` (NEW).

#### T9.2: server /api/graph payload extension

<!-- specrail:attrs id=T9.2 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "server/tests/integration.test.ts: graph payload has edge.kind for typed edges, node.status when present"
commit-msg-stub: "feat(server): /api/graph exposes edge.kind + node.status"
depends-on: [T9.1]
covers-ac: [AC-R2-5]
linked-arch: [ARCH-2]
\`\`\`
<!-- /specrail:attrs -->

- Files: `packages/dashboard/server/adapters/fs.ts` (merge typed + prose refs),
  `packages/dashboard/server/routes/graph.ts` (propagate kind + status),
  `packages/dashboard/server/tests/graph-typed.test.ts` (NEW).

#### T9.3: UI-A — Connections panel (inline in phase view)

<!-- specrail:attrs id=T9.3 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "TC-CONN-PANEL-1 + NFR-PERF-6 (≤16ms refresh budget)"
commit-msg-stub: "feat(web): inline Connections panel in phase view (F2.4)"
depends-on: [T9.2]
covers-ac: [AC-R2-6]
linked-features: [F2.4]
\`\`\`
<!-- /specrail:attrs -->

- Files: `packages/dashboard/web/src/features/connections/ConnectionsPanel.tsx` (NEW),
  `useGraphConnections.ts` (NEW hook — derives from cached graph query),
  `PhaseView.tsx` (wire as right rail, sticky localStorage),
  layout.css (3-pane variant + collapsible chevron rail).

#### T9.4: UI-B — Graph page upgrades (legend + focus + status tint)

<!-- specrail:attrs id=T9.4 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "TC-GRAPH-EDGE-RENDER-1 snapshot + cmd+k-style focus input"
commit-msg-stub: "feat(web): typed edge styling + legend + focus input + status tint"
depends-on: [T9.2]
covers-ac: [AC-R2-5]
linked-features: [F2.5, F2.6]
\`\`\`
<!-- /specrail:attrs -->

- Files: `packages/dashboard/web/src/features/graph/GraphView.tsx` (edge color/dash by kind,
  status tint), `Legend.tsx` (NEW), `FocusInput.tsx` (NEW — typeahead via idIndex),
  `useGraphURLState.ts` (NEW — URL ↔ focus/hop sync).

#### T9.5: Spec sync — apply deltas

<!-- specrail:attrs id=T9.5 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "docs/spec/* updated; `specrail check` PASS"
commit-msg-stub: "docs(spec): apply M9 deltas (phases 3/6/7/8/9/10)"
depends-on: [T9.1, T9.2, T9.3, T9.4]
\`\`\`
<!-- /specrail:attrs -->

- Files: `packages/dashboard/docs/spec/{03,06,07,08,09,10,13}-*.md` (merge each delta into base).
```

## MODIFIED — §14 Done Definition

기존 v0.1.0 ship gate 에 추가:
> v0.2.0 ship gate: M9 의 모든 task complete + AC-R2-5/6 + NFR-PERF-6/COMPAT-1 PASS.
> v0.1.0 release 는 M9 없이 가능 (변경 없음, backward-compat 유지).
