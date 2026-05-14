---
name: specrail-orchestrator
description: specrail orchestrator — invoke /specrail init·status·change·resume
trigger-words: specrail, /specrail
applies-to: all phases
state-machine: explicit (ADR-8)
---

# specrail Orchestrator

Single entry point for the plugin. State machine (ADR-8) enforces phase transitions.

## Commands

- `/specrail init` — bootstrap docs/spec/ + Phase 1 trigger (T2.11)
- `/specrail status` — show phase progress
- `/specrail change "<topic>"` — DELTA mode proposal draft (T2.4)
- `/specrail resume` — continue from last approved phase
- `/specrail opt-out` — telemetry opt-out (M3 T3.9)

## State machine

Phase N+1 invoke requires Phase N status=Approved (frontmatter primary).
Cache (`.specrail-cache/state.json`) derived from frontmatter.

Reference: docs/spec/00-common-principles.md
