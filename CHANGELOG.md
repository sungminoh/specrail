# Changelog

All notable changes to **specrail** are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [0.1.0] — 2026-05-15

First published release. M0~M11 milestones substantively implemented; ships as the initial public artifact (`npm install specrail`).

### Added — Subsystems
- **13-phase spec discipline plugin** — Claude Code skill collection (`skills/orchestrator/` + `skills/phase-01-prd/` … `skills/phase-13-implementation-plan/` + `skills/_common/principles.md` auto-inject).
- **`specrail verify`** — auto-derived implementation status per spec ID. Baseline run on dogfood spec classifies 514 IDs across {Built, Partial, NotBuilt, ManualReview, ManualReview-Stale} (per `docs/verify-baseline-2026-05-14.md`).
- **Pre-commit hooks** — `id-consistency` · `schema-validate` · `verify-status` (`src/hook/`).
- **Lint suite** — `anti-sycophancy` · `ac-traceability` · `inv-5 (AC GIVEN/WHEN/THEN)` · `inv-7 (ADR ≥2 alternatives)` (`src/lint/`).
- **Phase state machine** — `Draft → Proposed → Reviewed → Approved → Applied` transitions enforced (ADR-8 reified in `src/state/machine.ts`).
- **Dependency graph + downstream extraction** — AST-based ID definition + citation tracker (`src/graph/builder.ts` + `src/graph/downstream.ts`), supports table-form / bold-prefix / def-list / heading-form definitions and `<!-- specrail:ignore-* -->` annotations.
- **CLI** — `specrail verify`, `specrail change`, `specrail approve`, `specrail hook-install` (`src/cli/` + `src/bin/specrail.ts`).
- **Subagent orchestration** — 2-stage runWithReview pattern with BLOCKED escalation + audit trail (`src/subagent/`).
- **Telemetry** — opt-in metric stream (`src/telemetry/`), default `OptedOut` per INV-9.

### Added — Spec authoritative docs
- 13 phase spec files `docs/spec/01-prd.md` through `docs/spec/13-implementation-plan.md` — all `status: Approved`.
- Plugin own dogfood: 514 IDs across {R, F, S, ENT, INV, NFR, ARCH, EXT, OPS, ADR, RISK, TC, EDGE, OQ, KPI, T, PAIN, P-CC, ...}.
- DELTA proposal infrastructure: `docs/spec/changes/{date}-{topic}/proposal.md` + `deltas/phase-NN-*.md` per CLAUDE.md lifecycle.

### Tests
- 89 test files, 747 tests pass, 9 skipped. `npm run test`, `npm run typecheck`, `npm run lint:plan`, `npm run build` all green.

### Breaking changes
- None — first published version.

### Known limitations
- **Attrs schema migration (M-CSA) NOT included** — `<!-- specrail:attrs -->` per-entity attribute layer is specified in `docs/spec/changes/2026-05-15-core-schema-attrs/` (Approved DELTA proposal, 13 phase deltas, 16-task plan) but **scheduled for 0.2.0** per OQ-CSA-7 resolution + RISK-CSA-7 ordering. Current spec uses prose attribute layer.
- **Dashboard companion product NOT included** — `specrail/dashboard` is a separate repo / cycle (ADR-15, PRD §10). Schema contract export (`schemas/attrs.schema.json` per EXT-6) lands with 0.2.0.
- **`.claude-plugin/plugin.json` manifest deferred** — install via skill drop-in into `~/.claude/plugins/` or `npm install specrail` (which now ships `skills/`); marketplace listing tracked separately for a future release.
- **Visualizer proposal archived** — earlier 2026-05-15 `spec-visualizer` proposal under `docs/spec/changes/archive/2026-05-15-spec-visualizer/` was Deferred (user reject + reconsidered as multi-repo dashboard per ADR-15). Kept as audit trail.

### Next release (planned — 0.2.0)
- M-CSA attrs schema migration (T-CSA.1~16, ≈43h):
  - `<!-- specrail:attrs id=X -->` per-entity attribute YAML blocks (proposal §3.1).
  - Closed enum of 8 typed edge kinds (proposal §3.4): `solves`·`linked-features`·`parent`·`tested-by`·`covers-ac`·`mitigates`·`linked-arch`·`depends-on`.
  - New ID families: `PERSONA-N`, `SCEN-N`, `JNY-N.M`, `FLN-N`, `FLE-N`, `ZN-CC-PAT-N`.
  - `bin/specrail-migrate` codemod (idempotent + conflict marker emission).
  - `bin/specrail-audit` CLI — attrs coverage report (KPI-7 measurement).
  - `schemas/attrs.schema.json` + `schemas/edge-kinds.schema.json` as published artifacts (EXT-6).
- Lint window for legacy `S\d` → `SCEN-N` rename: v0.2.0~v0.4.0 WARN, v0.5.0+ ERROR.

[0.1.0]: https://github.com/sungminoh/specrail/releases/tag/v0.1.0
