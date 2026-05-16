# Changelog

All notable changes to **specrail** are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [0.2.0] — 2026-05-16

M-CSA milestone shipped. Attrs schema migration per `docs/spec/changes/2026-05-15-core-schema-attrs/`.

### Added — Subsystems

- **Attrs block parser** (`src/markdown/attrs.ts`, T-CSA.1): `<!-- specrail:attrs id=X -->` + fenced YAML + closer marker. Returns `{blocks, diagnostics}` with 4 diagnostic kinds (invalid-yaml, unclosed-marker, missing-yaml-fence, duplicate-id).
- **JSON Schema validator** (`schemas/attrs.schema.json` + `schemas/edge-kinds.schema.json` + extended `src/schema/validator.ts`, T-CSA.2): 21 entity kinds, `validateAttrs(payload, kind)`, `validateEdgeKind(kind)`, `classifyEntityKind(id)`.
- **ID family extensions** (`src/spec/patterns.ts`, T-CSA.3): capability-suffix R/F/AC/T (R-CSA, F-R-CSA.1, AC-R-CSA-1, T-CSA.5), FLN/FLE flow IDs, PERSONA·SCEN·JNY·ZN·P-CC·E-CC·KPI.
- **Typed edge builder** (`src/graph/builder.ts`, T-CSA.4): `buildTypedEdges(blocks)` emits 8 closed-enum kinds (`solves`·`linked-features`·`parent`·`tested-by`·`covers-ac`·`mitigates`·`linked-arch`·`depends-on`) per ADR-16.
- **Migrate codemod** (`bin/specrail migrate`, T-CSA.5): Phase 5 N-NNN→FLN-N and E-N→FLE-N rename, fence-aware, idempotent (TC-81). Writes `.specrail/migrate-report.json`.
- **Audit CLI** (`bin/specrail audit`, T-CSA.10): KPI-7 attrs coverage % per phase, markdown report, exits 1 on review-required markers.
- **Attrs lints** (`src/lint/attrs-lint.ts`, T-CSA.8): `attrs-completeness` (per-kind required fields, semver-gated WARN/ERROR), `attrs-placement` (heading-immediate invariant per OQ-CSA-1), `review-required` (always ERROR per OQ-CSA-10).
- **State machine attrs gate** (`src/state/machine.ts`, T-CSA.9): `checkApprovedAttrsGate(md, version)` extends INV-3 — v0.2.0~v0.4.x WARN, v0.5.0+ ERROR.
- **Telemetry schema-version** (`src/telemetry/client.ts`, T-CSA.13): payload field `schema-version: '1.0'` per ADR-13, semver-only per NFR-CSA-PRIV-1.
- **Published artifacts**: `schemas/` directory now ships in npm tarball (`files` array, T-CSA.7) — dashboard / third-party consumers fetch via `node_modules/specrail/schemas/` or GitHub raw URL.

### Added — Spec authoritative docs

- `skills/_common/principles.md` §"Attrs Blocks Are Mandatory" (T-CSA.12).
- All 13 `skills/phase-NN-*/SKILL.md` get attrs-example appendix (T-CSA.11).
- Phase 5 dogfood spec migrated: 292 ID renames in `docs/spec/05-user-flow.md` (T-CSA.6).
- `migrations/2026-05-15-flow-rename.csv` oracle file.

### Tests

- 98 test files, 853 pass, 9 skip. +98 tests added across T-CSA.1~13.

### Breaking changes

- Phase 5 user-flow node IDs renamed: `N-001..N-076` → `FLN-1..FLN-76`, `E-1..E-50` → `FLE-1..FLE-50`. Any external reference to the old IDs will break. Run `specrail migrate --phase=5 --apply` on your own spec to migrate.

### Known limitations

- **Spec attrs blocks not yet present in dogfood**: `specrail audit` reports 0% coverage on `docs/spec/` because the 13 phase files don't yet contain attrs blocks (only Phase 5 ID rename was applied as part of T-CSA.6). Author migration of attrs blocks is a follow-up workstream — the codemod scaffolds them mechanically once invoked per phase.
- **JSON output for `specrail audit`** deferred — OQ-CSA-6 resolution favored markdown-only for 0.2.0; JSON flag tracked for 0.2.x patch.
- **TC-86 E2E** end-to-end migration test deferred to 0.2.1 — coverage covered by per-module tests (parser, validator, codemod, lint, audit) for 0.2.0.

### Upgrade from 0.1.0

1. `npm install specrail@0.2.0`
2. `specrail migrate --phase=5 --apply` if your spec uses Phase 5 flow IDs in the old `N-NNN` / `E-N` form.
3. Optionally run `specrail audit` to see attrs coverage and identify entities needing migration.
4. Adopt the `<!-- specrail:attrs id=X -->` block convention for new entities per `skills/_common/principles.md` §"Attrs Blocks Are Mandatory".

### Next release (planned — 0.3.0)

- TC-86 full-chain E2E test
- JSON output mode for `specrail audit`
- Bulk attrs scaffolding from delta parameter tables (currently codemod handles ID rename only; attrs scaffolding from `deltas/phase-NN-*.md` parameter tables is a future codemod pass).

[0.2.0]: https://github.com/sungminoh/specrail/releases/tag/v0.2.0

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
