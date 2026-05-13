---
name: plan-pipeline-orchestrator
description: Planning Pipeline v4 orchestrator — invoke /plan-pipeline init·status·change·resume
trigger-words: plan-pipeline, /plan-pipeline
applies-to: all phases
state-machine: explicit (ADR-8)
---

# Plan Pipeline Orchestrator

Single entry point for v4 plugin. State machine (ADR-8) enforces phase transitions.

## Commands

- `/plan-pipeline init` — bootstrap docs/spec/ + Phase 1 trigger (T2.11)
- `/plan-pipeline status` — show phase progress
- `/plan-pipeline change "<topic>"` — DELTA mode proposal draft (T2.4)
- `/plan-pipeline resume` — continue from last approved phase
- `/plan-pipeline opt-out` — telemetry opt-out (M3 T3.9)

## State machine

Phase N+1 invoke requires Phase N status=Approved (frontmatter primary).
Cache (`.plan-pipeline-cache/state.json`) derived from frontmatter.

Reference: docs/spec/00-common-principles.md
