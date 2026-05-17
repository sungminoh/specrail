# @specrail/dashboard CHANGELOG

## 0.1.0 — 2026-05-17

First public release. Implements milestones M0-M8 of the dashboard spec
(`packages/dashboard/docs/spec/13-implementation-plan.md`).

### Features
- 13-phase markdown view with ID auto-linkify, hover popover, click-jump (S1.1.1-2, S1.2.1-3)
- 3-pane app shell with project switcher + sidebar phase list + collapsible right drawer (W-CC-SHELL)
- Multi-project registry persisted via `env-paths` (F1.4, INV-PROJECT-1)
- Edit mode with CodeMirror 6 + frontmatter form + atomic write + 409 conflict dialog (F5.1, F5.2, F5.3, INV-PATCH-2)
- File watcher (chokidar) limited to `docs/spec/` + `changes/` (INV-WATCH-1)
- Single SSE channel per project with last-event-id catch-up (F6.2)
- Issue inbox: plugin self-check + cross-phase deterministic checks (orphan-id, dangling-ref, status-mismatch, traceability-gap) + AI quality (F3.1, F3.2, F3.3)
- Patch proposal lifecycle (issue-fix / chat / inline-rewrite) with accept/reject + atomic write (F4.4, INV-PATCH-1)
- AI integration via Claude Code CLI subprocess (execa, stream-json, abort, error classification) + 3 prompt origins (F4.1, F4.2, F4.3, INV-AI-1)
- Graph view (React Flow + elkjs layered layout) with phase/kind/orphan/dangling filters and N-hop slider (F2.2, F2.3)
- CSRF double-submit cookie on all mutations (INV-CSRF-1)
- 127.0.0.1 only bind by default (NFR-SEC-1)
- "Reading Room" design system (Fraunces + Literata + JetBrains Mono, antique gold accent, warm dark + parchment light)
- npx CLI: `--project`, `--port`, `--host`, `--no-open`, `--no-update-check`, `--help`, `--version`
- Plugin `/specrail dashboard` slash command

### Not in this release (deferred to v0.2)
- DELTA proposal generation UI (use `specrail change` CLI)
- Hosted multi-user mode
- Multiple LLM providers (Anthropic API direct, OpenAI, etc.)
- Mobile / tablet support
- Bulk "Apply all" actions
- SQLite-backed session persistence (sessions are in-memory in 0.1.0)
- Visual polish from `/design-consultation` (DESIGN.md tokens applied; full polish pending)
