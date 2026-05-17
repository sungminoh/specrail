---
name: specrail-dashboard
description: Open the specrail dashboard for the current project. Auto-installs via npx.
trigger-words: dashboard, specrail dashboard, /specrail dashboard
---

# specrail dashboard

Launch the local web app for viewing, relating, and AI-reviewing the current project's
13-phase specrail spec markdown.

## What it does

Spawns `npx -y @specrail/dashboard@^0.x` with `--project <cwd>` so the dashboard
auto-registers the current repository on first launch. Opens the browser to the
local URL (default `127.0.0.1:<random port>`).

## When to use

- When you want to read 13 phase markdown specs in one place with ID cross-ref popovers + click-jump
- When you want to run AI-driven quality review on the spec with one click
- When you want to see the spec graph (R → F → S → NFR → TC) visually
- When you want to edit a phase in-browser with atomic-write conflict detection

## Invocation

```bash
npx -y @specrail/dashboard@^0.1 --project "$(pwd)"
```

Pass `--no-open` to suppress auto-opening the browser.
Pass `--port 8787` to use a fixed port.
First invocation downloads the package (~30 seconds); subsequent invocations are cached.

## Requirements

- A `docs/spec/01-prd.md` file must exist in the project root (INV-PROJECT-1).
- Claude Code CLI must be on PATH for AI review features (M6).
- Node ≥ 20.
