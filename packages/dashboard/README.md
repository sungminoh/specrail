# specrail dashboard

Local OSS web app for viewing, relating, and AI-reviewing specrail 13-phase markdown specs.

> **Status:** spec-complete (Phase 1-13 Approved), design-complete (DESIGN.md v0). Implementation not yet started. v0.1.0 ship plan in `docs/spec/13-implementation-plan.md`.

## What this is

A reading room for software specs. Phase markdown rendered with editorial typography, cross-reference IDs as click-jump links, graph view (React Flow + elkjs) for dependency exploration, unified issue inbox (plugin self-check + cross-phase deterministic + AI quality review), and direct edit mode with atomic write.

- **Local** (npx + localhost, no auth, single user)
- **AI = Claude Code CLI** subprocess (no API key management)
- **Multi-project registry** with `~/.specrail-dashboard/registry.json`

PRD §10 of the specrail plugin reserved this as a separate cycle; this package is its implementation.

## Directory

| Path | Contents |
|------|----------|
| [`docs/spec/`](./docs/spec/) | 13-phase specrail spec — source of truth |
| [`DESIGN.md`](./DESIGN.md) | Design system (codename "Reading Room") |
| [`design/preview.html`](./design/preview.html) | Visual preview — open in browser |
| [`CLAUDE.md`](./CLAUDE.md) | Working notes for AI agents |
| [`tests/`](./tests/) | AC stubs (becomes real test suite during M0+) |

## Spec snapshot

- Phase 1 PRD — HOLD SCOPE, Spec-Driven Builder persona, 7 Non-Goals, 5 KPIs
- Phase 3 Features — 6 R / 19 F / 52 S (43 P0 + 9 P1)
- Phase 4 Domain — 8 ENT, 3 SM, 6 INV
- Phase 8 Architecture — Vite SPA + Hono + core domain (hexagonal), Claude CLI subprocess, SQLite sessions
- Phase 10 Test — 28 TC + 10 EDGE + 5 PT, 70/20/10 pyramid
- Phase 12 — 9 ADRs (Boring by default, 2/3 innovation tokens), 9 RISKs
- Phase 13 — 9 milestones (M0-M8), 36+ atomic tasks, ~53h AI-assisted

Run `specrail check` from this directory to verify spec invariants.

## Status quo

Implementation lives in milestones M0 (monorepo migration) → M8 (npm distribution + plugin `/specrail dashboard` slash command). Before then this package is **spec + design only**. See `docs/spec/13-implementation-plan.md` for the sequence.
