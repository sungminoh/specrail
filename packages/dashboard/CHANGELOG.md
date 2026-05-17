# @specrail/dashboard CHANGELOG

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
- **Playwright e2e suite** (Phase 13 §14 Done): Not implemented in alpha. Server has 19 integration tests; UI integration is dogfood-only.
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
