# @specrail/dashboard

> Local web app for viewing, relating, and AI-reviewing the specrail 13-phase markdown spec.

**Status: `0.1.0-alpha.1` — pre-release.** Backend + partial UI shipped. Several UI features called out in the [spec](./docs/spec/) are still deferred — see [Known gaps](#known-gaps-in-alpha) below. See [CHANGELOG.md](./CHANGELOG.md) for the precise scope of this alpha.

## Install + run

```bash
# From inside a specrail project (one with docs/spec/01-prd.md):
npx -y @specrail/dashboard@0.1.0-alpha.1 --project "$(pwd)"

# Open the printed URL (default: http://127.0.0.1:<random>/) in a browser.
```

Or, if you have the [`specrail`](https://www.npmjs.com/package/specrail) plugin installed in Claude Code:

```text
/specrail dashboard
```

## What works in alpha

| Feature | Shipped? | Notes |
|---------|:--:|------|
| 13-phase markdown view, ID auto-linkify, click-jump to definition | ✅ | F1.1, S1.2.1, S1.2.3 |
| **ID hover popover** (200-char preview, kind, phase/line) | ✅ | F1.2 — AC-R1-2 |
| **cmd+k / ctrl+k quick switcher** (fuzzy across phases + IDs) | ✅ | F1.3 — AC-R1-4 |
| Multi-project registry + switcher | ✅ | F1.4, INV-PROJECT-1 |
| Edit mode (CodeMirror 6) + frontmatter form + atomic write + 409 conflict dialog | ✅ | F5.1, F5.2, F5.3, INV-PATCH-2 |
| File watcher → SSE → React Query invalidation | ✅ | F6.1, F6.2 |
| Issue inbox + cross-phase deterministic checks (orphan/dangling/status/traceability) | ✅ | F3.2, F3.3 |
| Issue row expand + Open-in-phase + suggested-patch accept/reject | ✅ | AC-R3-2 |
| Patch lifecycle (issue-fix + chat origins) with mtime-guarded accept | ✅ | F4.4, INV-PATCH-1, INV-PATCH-2 (on patch path, tested) |
| AI chat drawer (Claude CLI subprocess, stream tokens, patch extraction) | ✅ | F4.2, INV-AI-1 |
| Graph view (React Flow + elkjs) with filters + N-hop slider | ✅ | F2.2, F2.3 |
| CSRF on all mutations | ✅ | INV-CSRF-1 |
| 127.0.0.1-only bind by default | ✅ | NFR-SEC-1 |
| "Reading Room" design tokens (Fraunces + Literata + JetBrains Mono, gold accent) | ✅ | DESIGN.md |

## Known gaps in alpha

Path to `0.1.0` (full release) requires closing these:

- **Inline rewrite UI** (AC-R4-3): backend `runInline` is wired; floating menu on text selection not yet built.
- **Plugin self-check production path** (F3.1): currently resolves to a monorepo sibling `../plugin/src/bin/specrail.ts`; falls back to a `specrail` PATH lookup. Installed-user case (npm-shipped) silently produces no plugin findings — only `cross-phase` and `ai-quality` sources appear. Cross-phase deterministic checks (the more important half) work.
- **Playwright e2e suite**: server has 19 integration tests; UI has no automated browser coverage in alpha.
- **AC stubs in `tests/_ac-stubs.test.ts`**: 10 `it.todo` placeholders awaiting real test implementations.
- **NFR-PERF bench coverage**: Only NFR-PERF-2 (graph nHop) is benched (real 500-node hub-and-spoke, hop=99, ≤200ms median). PERF-1/3/4/5 have no automated benches yet.
- **Session/proposal/issue persistence**: in-memory `Map`s; restart clears them.
- **Watcher.stop on project DELETE**: registry removal leaves the chokidar watcher running.

## Not in scope for v0.1.x

Target: v0.2+

- DELTA proposal generation UI (use `specrail change` CLI in the plugin)
- Hosted multi-user mode + auth
- Multiple LLM providers (Anthropic API direct, OpenAI, etc.)
- Mobile / tablet support
- Bulk "Apply all" actions on issues

## CLI flags

```text
specrail-dashboard [options]

--project <path>   auto-register this project root (must contain docs/spec/01-prd.md)
--port <n>         HTTP port (0 = random free, default 0)
--host <addr>      bind address (default 127.0.0.1; non-localhost warns + 5s wait)
--no-open          don't auto-open browser
-h, --help         show help
-v, --version      show package version
```

## Architecture

See [`docs/spec/08-system-architecture.md`](./docs/spec/08-system-architecture.md). High level:

- `@specrail/core` (pure domain, 0 fs/net/process imports) — frontmatter parse, patch apply, graph/checks/IDs.
- `@specrail/dashboard/server` — Hono HTTP + SSE, adapters for filesystem (chokidar), Claude CLI (execa stream-json), env-paths JSON registry.
- `@specrail/dashboard/web` — Vite + React 19 + TanStack Query + React Flow + CodeMirror 6.

## Design

["Reading Room"](./DESIGN.md): Fraunces (display) + Literata (body serif) + JetBrains Mono (mono IDs/code). Antique gold (#C9A961) sole accent. Warm dark mode default; parchment light mode toggle.

## Security

- 127.0.0.1 only by default; `--host=0.0.0.0` prints a warning and waits 5s before binding externally.
- CSRF double-submit cookie on every mutation route (INV-CSRF-1).
- Path allowlist limits server fs reads/writes to `<projectRoot>/docs/spec/` and `<projectRoot>/changes/` (INV-WATCH-1).
- Subprocess spawns use `execa({ shell: false })` with `cwd = projectRoot` (INV-AI-1).
- No external telemetry. No auto-update.

## Spec

The dashboard is itself specified using specrail — [`docs/spec/`](./docs/spec/) contains all 13 phases (Approved). Run `specrail check` from this directory to verify spec invariants.

## License

MIT — see [LICENSE](./LICENSE).
