# @specrail/dashboard CHANGELOG

## 0.1.0-alpha.1 — 2026-05-17

First public pre-release. Backend skeleton + partial UI. Not feature-complete versus the v1 spec — see "Known gaps" in [README](./README.md) and the deferred list below.

### Features (verified working end-to-end)

- 13-phase markdown view with auto-linkified spec IDs that click-jump to the defining phase (F1.2 partial — popover deferred, see gaps)
- 3-pane app shell + project switcher + sidebar phase list (W-CC-SHELL)
- Multi-project registry persisted via `env-paths` (F1.4, INV-PROJECT-1)
- Edit mode (CodeMirror 6) + frontmatter form + atomic write + 409 conflict dialog (F5.1, F5.2, F5.3, INV-PATCH-2 on PUT path)
- chokidar watcher limited to `docs/spec/` + `changes/` (INV-WATCH-1)
- SSE channel per project with last-event-id catch-up (F6.2)
- Issue inbox: cross-phase deterministic checks (orphan-id, dangling-ref, status-mismatch, traceability-gap) (F3.2, F3.3). Plugin self-check bridge: monorepo dev mode only — silently no-ops for npx-installed users (tracked as gap).
- Patch proposal lifecycle (issue-fix + chat origins) with accept/reject + atomic write (F4.4 partial, INV-PATCH-1)
- AI integration via Claude Code CLI subprocess (execa, stream-json, abort, error classification). Reachable from UI: chat drawer only. Server-side `review-scan` and `inline` exist but lack UI surfaces in alpha.
- Graph view (React Flow + elkjs) with phase/kind filters, orphan/dangling toggles, N-hop slider, 250-node collapse fallback (F2.2, F2.3)
- CSRF double-submit cookie on all mutations (INV-CSRF-1)
- 127.0.0.1-only bind by default; non-localhost host prints warning + 5s wait (NFR-SEC-1)
- "Reading Room" design tokens (Fraunces / Literata / JetBrains Mono, gold accent) applied to shell + phase view + drawer + edit + issue inbox + graph
- npx CLI: `--project`, `--port`, `--host`, `--no-open`, `--help`, `--version`
- Plugin `/specrail dashboard` slash command (`packages/plugin/skills/dashboard/SKILL.md`)

### Known gaps in alpha (target: 0.1.0 release)

- **ID hover popover** (AC-R1-2): IDs click-jump but do not render a preview popover on hover. Deferred.
- **Issue row expansion + accept/reject UI** (AC-R3-2): Inbox rows show one-liner only; suggested-patch preview + buttons not yet wired to the existing patch lifecycle. Deferred.
- **Inline rewrite UI** (AC-R4-3): Backend ready; floating menu on selection not implemented. Deferred.
- **cmd+k quick switcher** (AC-R1-4 / NFR-PERF-5): Deferred.
- **Plugin self-check production path** (F3.1): Hardcoded to monorepo sibling path; needs npm package resolution for installed users. Falls back to PATH lookup which usually fails silently. Tracked.
- **Playwright e2e suite** (Phase 13 §14 Done): Not implemented in alpha. Server has 19 integration tests; UI integration is dogfood-only.
- **AC stubs in `tests/_ac-stubs.test.ts`**: 10 `it.todo` placeholders waiting on real test implementations.
- **Bench gates for NFR-PERF-1/3/4/5**: Only NFR-PERF-2 (graph nhop) is benched. The bench fixture is a real 500-node star (fixed in 0.1.0-alpha.1).
- **SQLite session persistence**: Sessions, proposals, and issue caches are in-memory; restart clears them.

### Not in any 0.1.x release (target: v0.2+)

- DELTA proposal generation UI (use `specrail change` CLI)
- Hosted multi-user mode
- Multiple LLM providers (Anthropic API direct, OpenAI, etc.)
- Mobile / tablet support
- Bulk "Apply all" actions

### Fixes in 0.1.0-alpha.1 (vs the prematurely-tagged 0.1.0)

- `bin/specrail-dashboard.ts`: `--version` now reads `package.json` instead of a hardcoded string.
- `bin/specrail-dashboard.ts`: removed `--no-update-check` flag (never wired; documented but had no effect).
- `package.json`: removed unused deps `better-sqlite3`, `proper-lockfile`, `uuid`, `msw`, `@types/*` siblings.
- `server/tests/issues-patches.test.ts`: added patch-accept stale-mtime 409 integration test (INV-PATCH-2 on patch lifecycle path).
- `core/tests/graph.test.ts`: rewrote 500-node nHop bench to actually traverse 500 nodes (star graph + hop=99).
- `server/app.ts`: SPA fallback so `/` and client routes return `dist/web/index.html` (was 404 in 0.1.0).
