# @specrail/dashboard

> Local web app for viewing, relating, and AI-reviewing the specrail 13-phase markdown spec.

Status: **v0.1.0** — first public release. Implementation milestones M0–M8 complete; visual design system ("Reading Room") applied per [`DESIGN.md`](./DESIGN.md).

## Install + run

```bash
# From inside a specrail project (one with docs/spec/01-prd.md):
npx -y @specrail/dashboard@^0.1 --project "$(pwd)"

# Open the printed URL (default: http://127.0.0.1:<random>/) in a browser.
```

Or, if you have the [`specrail`](https://www.npmjs.com/package/specrail) plugin installed in Claude Code:

```text
/specrail dashboard
```

## What it does

| Feature | Screenshot path |
|---------|------------------|
| 13-phase markdown view with ID auto-linkify + hover-popover + click-jump | `design/preview.html` |
| Cross-phase graph (React Flow + elkjs) with phase/kind/orphan/dangling filters + N-hop slider | (graph view) |
| Issue inbox: plugin self-check + cross-phase deterministic checks + AI-quality review (3-tier with color-coded source chips) | (issues view) |
| Edit mode (CodeMirror 6 + atomic write + mtime-guarded 409 conflict dialog) | (edit toggle) |
| AI chat drawer with Claude Code CLI subprocess streaming + inline patch cards (accept/reject) | (chat drawer) |
| Per-project SSE channel for file/issue/patch/ai events; file watcher (`docs/spec/`, `changes/` allowlist) | — |
| Multi-project registry (`<env-paths>/registry.json`) | (project switcher) |

## CLI flags

```text
specrail-dashboard [options]

--project <path>       auto-register this project root
--port <n>             HTTP port (0 = random free, default 0)
--host <addr>          bind address (default 127.0.0.1)
--no-open              don't auto-open browser
--no-update-check      skip npm registry update ping at startup
-h, --help             show help
-v, --version          show version
```

## Architecture

See [`docs/spec/08-system-architecture.md`](./docs/spec/08-system-architecture.md). High-level:

- `@specrail/core` (pure domain, 0 fs/net/process imports) — frontmatter parse, patch apply, graph/checks/IDs.
- `@specrail/dashboard/server` — Hono HTTP + SSE, adapters for filesystem (chokidar), Claude CLI (execa stream-json), registry, SQLite session store.
- `@specrail/dashboard/web` — Vite + React 19 + TanStack Query + React Flow + CodeMirror 6.

## Design

["Reading Room"](./DESIGN.md): Fraunces (display) + Literata (body serif) + JetBrains Mono (mono IDs/code). Antique gold (#C9A961) sole accent. Warm dark mode default; parchment light mode toggle.

## Security

- 127.0.0.1 only by default; `--host=0.0.0.0` prints a warning and waits 5s before binding externally.
- CSRF double-submit cookie on every mutation route (INV-CSRF-1).
- Path allowlist limits server fs reads/writes to `<projectRoot>/docs/spec/` and `<projectRoot>/changes/` (INV-WATCH-1).
- Subprocess spawns use `execa({ shell: false })` with `cwd = projectRoot` (INV-AI-1).
- No external telemetry. No update auto-install. Hold the user in control.

## Spec

The dashboard is itself specified using specrail — [`docs/spec/`](./docs/spec/) contains all 13 phases (Approved). Run `specrail check` from this directory to verify spec invariants.

## License

MIT — see [LICENSE](./LICENSE).
