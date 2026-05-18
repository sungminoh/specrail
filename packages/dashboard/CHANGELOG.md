# @specrail/dashboard CHANGELOG

## Unreleased — M9 typed-graph-relationships + side-panels refactor + graph view modes

DELTA-3: `packages/dashboard/changes/2026-05-18-graph-view-modes/` (proposal + 3 per-phase deltas, Approved). Spec sync applied to phases 3 / 13.

### Added (DELTA-3)
- **F2.8 Graph view modes** — graph page now has 4 explicit tabs: Overview (default), Phase Focus, ID Focus, Quality.
  - **Overview:** 13 large phase nodes only (Phase 01 · PRD, etc.), inter-phase edges with `weight = aggregate ref count`, stroke scales `log₂(weight)`. Click a phase → switch to Phase Focus.
  - **Phase Focus:** Single phase's IDs + 1-hop boundary nodes from other phases (dimmed opacity 0.45). Click a node → switch to ID Focus.
  - **ID Focus:** Existing ego-graph behavior (focus input + n-hop slider). URL `?focus=<id>` auto-enters this mode for back-compat.
  - **Quality:** Orphans (no in/out edges) + dangling refs (referenced IDs not defined) only. Friendly "All clean." state when nothing to report.
- **AC-R2-9** — mode switch re-renders ≤ 200ms.
- **AC-R2-10** — Overview readability with 400+ node specs.
- **AC-R2-11** — Quality mode clean-state UX.
- URL state: `?mode=overview|phase|id|quality`, `?phase=N`, `?focus=<id>&hop=N` — bidirectional sync, shareable.

### Changed (DELTA-3)
- **F2.2 Graph view** rewritten as mode-driven (was free-form filter sidebar with phase chips + kind + orphans + dangling toggles all visible at once).
- **F2.3 N-hop slider** scoped to ID Focus mode only.
- **F2.6 Focus input** scoped to ID Focus mode only.
- **Legend overlay** default **closed** (was open by default — took ~30% of canvas).
- Sidebar shown only in Phase Focus mode (phase chips + optional kind filter). Hidden in Overview / ID Focus / Quality.
- Phase nodes (Overview) ~3× larger (200×60) with full labels ("Phase 09 · NFR"). Were tiny rectangles clustered at canvas bottom.
- ChatDrawer onChange: resets state when `currentPhase` changes (no longer shows stale buffer with new-phase context).
- ConnectionsPanel uses `useLocation()` to re-evaluate focus on react-router navigation. Empty state shows "Open a phase to see typed connections." on non-phase routes.

## Unreleased — M9 typed-graph-relationships + side-panels refactor

DELTA-2: `packages/dashboard/changes/2026-05-18-side-panels-and-hover/` (proposal + 4 per-phase deltas, Approved). Spec sync applied to phases 3 / 9 / 13.

### Added (DELTA-2)
- **F2.7 Connections hover tooltip** — neighbor row in Connections panel now shows `IdPopover` on hover with id + kind + preview. `buildIdIndex` Pass-3 picks up `- **AC-R*-*:**` bullet-style definitions so AC entries (common in dashboard spec) get full previews. AC-R2-8.
- **AC-R2-7** — Reading column stability: markdown body stays centered at max-w 760px regardless of which right panel is open.
- **AC-R2-8** — Connections hover tooltip.
- **NFR-PERF-7** — side-panel toggle animation ≤ 200ms.

### Changed (DELTA-2)
- **F2.4 Connections panel — layout: floating right side panel**. Previously a 3rd column in `phase-body` CSS grid which ate markdown width. Now `position: fixed; right: 0` — markdown reading column unaffected. Open/close is sticky in localStorage.
- **F4.2 ChatDrawer — same layout pattern**. Both panels stack vertically when both open (Connections top half / Chat bottom half).
- Both panels mounted globally in `AppShell` (not `PhaseRoute`) — focus state survives phase navigation.
- New `usePanelState` store (useSyncExternalStore + LS) drives both panels; `CONNECTIONS` and `AI CHAT` buttons in phase header are togglers.
- `phase-body` reverted from CSS grid to plain block; `.phase-body-main` gets `max-width: 760px; margin: 0 auto`. Reading Room identity preserved.

## Unreleased — M9 typed-graph-relationships

DELTA: `packages/dashboard/changes/2026-05-17-typed-graph-relationships/` (proposal + 7 per-phase deltas, all Approved). Spec sync applied to phases 3 / 9 / 13.

### Added
- **F2.4 Connections panel** — always-visible right-rail in phase view. Shows the focused ID's typed neighbors grouped by edge kind (in/out, with status pills). Reads from cached graph query (no new API roundtrip). Collapsible with localStorage sticky state. AC-R2-6.
- **F2.5 Typed graph relationships** — `@specrail/core` now extracts typed refs from `<!-- specrail:attrs -->` yaml blocks. Recognizes the 8 schema closed-enum kinds (`solves`, `linked-features`, `parent`, `tested-by`, `covers-ac`, `mitigates`, `linked-arch`, `depends-on`) plus 6 qualified variants used in real dashboard spec (`parent-f`, `parent-r`, `parent-zone`, `linked-ac`, `linked-r`, `solves-pains`). Typed refs suppress prose-mention duplicates for the same `(from, to)`.
- **F2.6 Graph focus input + status tint** — graph page toolbar has typeahead focus input (powered by idIndex); URL search params `?focus=<id>&hop=N` are now bidirectionally synced. Nodes are tinted by attrs.status (Draft/Proposed = dashed border, Rejected = muted + strikethrough). Edge styling per OQ-DELTA-1: gold-accent only, differentiated by stroke weight / dasharray / opacity in 4 visual families (relational / coverage / value / link). Floating legend overlay.
- **AC-R2-5, AC-R2-6** — new acceptance criteria for the graph upgrades.
- **NFR-PERF-6** — Connections panel refresh ≤16ms on focus change (single frame).
- **NFR-COMPAT-1** — attrs typed-ref extraction completeness (100% of supported edge keys produce typed-refs).

### Changed
- `/api/projects/:id/graph` payload now includes optional `edge.kind` (14-kind union) and `node.status` (attrs scalar). Backward compat: existing clients unaffected.
- `GraphEdge` / `GraphNode` in `@specrail/core` carry optional `kind` / `status`.
- `Phase.parsedRefs` now contains both typed and prose refs (typed take priority on duplicate targets).
- Graph view: `/api/graph` edges are now filtered to require both endpoints present in the rendered node set — fixes ELK "Referenced shape does not exist" when typed refs point at undefined IDs (e.g. PAIN-* in dashboard spec).

### Tests
- `packages/core/tests/attrs.test.ts` — 17 new unit tests for parseAttrsBlocks + extractTypedRefs (TC-TYPED-REFS-1, TC-TYPED-REFS-2, EDGE-MALFORMED-ATTRS).
- `packages/dashboard/server/tests/graph-typed.test.ts` — 5 new integration tests (edge.kind exposure for all 8 schema kinds, node.status, prose fallback, dedup, payload contract).
- Total: 92 PASS (was 87).

## 0.1.0-alpha.1 — 2026-05-17

First public pre-release. Backend skeleton + partial UI. Not feature-complete versus the v1 spec — see "Known gaps" in [README](./README.md) and the deferred list below.

### Features (verified working end-to-end)

- 13-phase markdown view with auto-linkified spec IDs that click-jump to the defining phase (F1.2)
- **ID hover popover** with 200-char preview, kind, phase/line (F1.2 — AC-R1-2)
- **cmd+k / ctrl+k quick switcher** (fuzzy across phases + IDs, Fuse.js, NFR-PERF-5 budget) (AC-R1-4)
- 3-pane app shell + project switcher + sidebar phase list (W-CC-SHELL)
- Multi-project registry persisted via `env-paths` (F1.4, INV-PROJECT-1)
- Edit mode (CodeMirror 6) + frontmatter form + atomic write + 409 conflict dialog (F5.1, F5.2, F5.3, INV-PATCH-2 on PUT path)
- chokidar watcher limited to `docs/spec/` + `changes/` (INV-WATCH-1)
- SSE channel per project with last-event-id catch-up (F6.2)
- Issue inbox: cross-phase deterministic checks (orphan-id, dangling-ref, status-mismatch, traceability-gap) (F3.2, F3.3). Plugin self-check bridge: monorepo dev mode only — silently no-ops for npx-installed users (tracked as gap).
- **Issue row expansion + suggested-patch accept/reject UI** wired to the patch lifecycle (AC-R3-2)
- Patch proposal lifecycle (issue-fix + chat origins) with accept/reject + atomic write + mtime guard (F4.4, INV-PATCH-1, INV-PATCH-2 on patch path — tested)
- AI integration via Claude Code CLI subprocess (execa, stream-json, abort, error classification). Reachable from UI: chat drawer only. Server-side `review-scan` and `inline` exist but lack UI surfaces in alpha.
- Graph view (React Flow + elkjs) with phase/kind filters, orphan/dangling toggles, N-hop slider, 250-node collapse fallback with inter-phase edge folding (F2.2, F2.3)
- CSRF double-submit cookie on all mutations (INV-CSRF-1)
- 127.0.0.1-only bind by default; non-localhost host prints warning + 5s wait (NFR-SEC-1)
- "Reading Room" design tokens (Fraunces / Literata / JetBrains Mono, gold accent) applied to shell + phase view + drawer + edit + issue inbox + graph
- npx CLI: `--project`, `--port`, `--host`, `--no-open`, `--help`, `--version`
- Plugin `/specrail dashboard` slash command (`packages/plugin/skills/dashboard/SKILL.md`)

### Known gaps in alpha (target: 0.1.0 release)

- **Inline rewrite UI** (AC-R4-3): Backend `runInline` is wired; floating menu on text selection not yet built.
- **Plugin self-check production path** (F3.1): Hardcoded to monorepo sibling path; needs npm package resolution for installed users. Falls back to PATH lookup which usually fails silently. Cross-phase deterministic half works.
- **Playwright e2e suite** (Phase 13 §14 Done): Not implemented in alpha. Server has 33 unit + integration tests (+10 AC stubs as `it.todo`); UI integration is dogfood-only.
- **AC stubs in `tests/_ac-stubs.test.ts`**: 10 `it.todo` placeholders waiting on real test implementations.
- **Bench gates for NFR-PERF-1/3/4/5**: Only NFR-PERF-2 (graph nhop) is benched (real 500-node hub-and-spoke + chain, hop=99, ≤200ms median).
- **Session/proposal/issue persistence**: Sessions, proposals, and issue caches are in-memory `Map`s; restart clears them.
- **Watcher.stop on project DELETE**: registry removal leaves the chokidar watcher running.
- **CORS dev-mode origin**: hardcoded to `http://127.0.0.1:0`; same-origin production is unaffected but Vite dev mode needs a proxy.

### Not in any 0.1.x release (target: v0.2+)

- DELTA proposal generation UI (use `specrail change` CLI)
- Hosted multi-user mode
- Multiple LLM providers (Anthropic API direct, OpenAI, etc.)
- Mobile / tablet support
- Bulk "Apply all" actions

### Fixes in 0.1.0-alpha.1 (vs the prematurely-tagged 0.1.0)

- `web/features/phases/IdPopover.tsx` + `idIndex.ts`: added the ID hover popover (AC-R1-2) covering both heading-defined and `<!-- specrail:attrs -->`-defined IDs.
- `web/features/quick-switcher/QuickSwitcher.tsx`: added cmd+k/ctrl+k fuzzy switcher across phases and all spec IDs (AC-R1-4) using Fuse.js.
- `web/features/issues/IssueInbox.tsx`: issue rows expand to show description, Open-in-phase, and inline suggested-patch accept/reject (AC-R3-2).
- `web/features/graph/GraphView.tsx`: when >250 nodes collapse fires, inter-phase edges are folded onto the 13 phase nodes (was 0 edges).
- `server/adapters/claude-cli.ts`: real-CLI compatibility — added `--verbose --include-partial-messages`, rewrote `parseEvent` for the actual `system / stream_event / assistant / result` wrappers, added dedup so the final assistant event doesn't re-emit text deltas.
- `server/app.ts`: `/api/*` misses now return JSON 404 *before* the SPA catch-all (was: SPA fallback ate API miss responses); static `dist/web/` is served for non-API paths.
- `bin/specrail-dashboard.ts`: `--version` now reads `package.json` instead of a hardcoded string.
- `bin/specrail-dashboard.ts`: removed `--no-update-check` flag (never wired; documented but had no effect).
- `package.json`: removed unused deps `better-sqlite3`, `proper-lockfile`, `uuid`, `msw`, `@types/*` siblings.
- `server/tests/issues-patches.test.ts`: added patch-accept stale-mtime 409 integration test (INV-PATCH-2 on patch lifecycle path).
- `core/tests/graph.test.ts`: rewrote 500-node nHop bench to actually traverse 500 nodes (hub-and-spoke + chain + hop=99, 3-run median, ≤200ms assertion).
