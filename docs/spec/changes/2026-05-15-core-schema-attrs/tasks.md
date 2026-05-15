---
type: implementation-tasks
capability: core-schema-attrs
date: 2026-05-15
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — final batch verifier APPROVE
basis: "deltas/phase-13-implementation-plan.md §2.2 T-CSA.1~16"
total-hours-estimate: ~43
ordered-after: M11 (RISK-CSA-7 mitigation — core shipping 일정 보호)
---

# tasks.md — M-CSA Implementation

> Phase 13 delta `deltas/phase-13-implementation-plan.md`가 normative spec. 본 file은 implementing lane이 사용하는 actionable expansion.
> 각 task는 RED → GREEN → REFACTOR (principles.md ETHOS · Phase 10 §0 Iron Law).
> commit-msg-stub은 `~/.claude/rules/git-workflow.md` 컨벤션.

---

## T-CSA.1: `src/markdown/attrs.ts` parser

**Status:** Pending
**RED test:** TC-78 (`tests/markdown/attrs.test.ts`)
**Linked AC:** AC-R-CSA-2 (id mismatch lint)
**Files to create/modify:**
- `src/markdown/attrs.ts` (new)
- `tests/markdown/attrs.test.ts` (new)
**Steps:**
1. RED — write TC-78 in `tests/markdown/attrs.test.ts`: valid attrs block parses · invalid YAML → throws · orphan id (no heading match) → returns null + warning · duplicate id within file → returns first + warning.
2. Run `vitest run tests/markdown/attrs.test.ts` — verify RED (4 fail).
3. GREEN — implement `parseAttrsBlocks(file: string): AttrsBlock[]` using remark + remark-frontmatter + custom marker detection. Export `AttrsBlock` type.
4. Run test — verify GREEN.
5. REFACTOR — extract `MARKER_OPEN_RE` / `MARKER_CLOSE_RE` constants. Inline doc minimal (principles §No Placeholders).
6. Commit: `feat(markdown): add attrs block parser (T-CSA.1)`

---

## T-CSA.2: `schemas/attrs.schema.json` + ajv validator

**Status:** Pending
**RED test:** TC-79 (`tests/schema/validator.test.ts`)
**Linked AC:** AC-R-CSA-2, AC-R-CSA-4 (unknown kind ERROR)
**Files to create/modify:**
- `schemas/attrs.schema.json` (new)
- `schemas/edge-kinds.schema.json` (new)
- `src/schema/validator.ts` (new)
- `tests/schema/validator.test.ts` (new)
**Steps:**
1. RED — write TC-79: 21 entity-type validation matrix (each kind: valid + missing-required + unknown-edge-kind + invalid-field-type).
2. Run vitest — RED.
3. GREEN — author `schemas/attrs.schema.json` JSON Schema 2020-12 covering 21 entity types (proposal §5). Author `schemas/edge-kinds.schema.json` with 8 frozen kinds (proposal §3.4 / ADR-16). Implement `validateAttrs(block)` using ajv with both schemas compiled.
4. Run test — GREEN.
5. REFACTOR — split entity-type subschemas to `schemas/entities/*.schema.json` if root JSON exceeds 500 LOC.
6. Commit: `feat(schema): publish attrs schema + ajv validator (T-CSA.2)`

---

## T-CSA.3: `src/spec/patterns.ts` ID family extend

**Status:** Pending
**RED test:** regex match test in `tests/spec/patterns.test.ts`
**Linked AC:** (parser side) AC-R-CSA-2
**Files to create/modify:**
- `src/spec/patterns.ts`
- `tests/spec/patterns.test.ts`
**Steps:**
1. RED — extend test matrix: `R-CSA`·`F-R-CSA.1`·`AC-R-CSA-1`·`FLN-1`·`FLE-1`·`PERSONA-1`·`SCEN-1`·`JNY-1.1`·`ZN-CC-PAT-1`·`E-CC-1`·`P-CC-1` 모두 ID_PATTERN_SOURCE match.
2. Run vitest — RED.
3. GREEN — add to `ID_PATTERN_SOURCE`:
   - `R-[A-Z]+[A-Z0-9]*` (capability-suffix R)
   - `F-R-[A-Z]+[A-Z0-9]*\.\d+` (capability-suffix F)
   - `AC-R-[A-Z]+[A-Z0-9]*-\d+` (capability-suffix AC)
   - `FLN-\d+`·`FLE-\d+`·`PERSONA-\d+`·`SCEN-\d+`
   - `JNY-\d+\.\d+`
   - `ZN-[A-Z0-9-]+-\d+`
   - `E-CC-\d+`·`P-CC-\d+` (canonical, not user-namespace)
4. Verify `parseSpecId` 호환 (legacy `S\d` dual-parse window 동작).
5. Run test — GREEN.
6. Commit: `feat(spec): extend ID_PATTERN_SOURCE for attrs migration (T-CSA.3)`

---

## T-CSA.4: `src/graph/builder.ts` typed edges from attrs

**Status:** Pending
**RED test:** TC-80 (`tests/graph/builder.test.ts`)
**Linked TC:** TC-80
**Depends on:** T-CSA.1, T-CSA.2, T-CSA.3
**Files to create/modify:**
- `src/graph/builder.ts` (extend)
- `tests/graph/builder.test.ts`
**Steps:**
1. RED — extend TC-80: attrs block에 `solves-pains: [PAIN-3]` 있으면 builder가 `TypedEdge {from: R3, to: PAIN-3, kind: 'solves'}` emit.
2. RED for 8 enum kinds × valid source-target × invalid source (unknown kind).
3. Run vitest — RED.
4. GREEN — implement `buildTypedEdges(attrsBlocks: AttrsBlock[]): TypedEdge[]` mapping YAML field names to closed-enum kinds (table from proposal §3.4). Union with existing mention-edges.
5. Run test — GREEN.
6. REFACTOR — extract `FIELD_TO_KIND_MAP` constant.
7. Commit: `feat(graph): emit typed edges from attrs block (T-CSA.4)`

---

## T-CSA.5: `bin/specrail-migrate.ts` codemod

**Status:** Pending
**RED test:** TC-81 (idempotency) + TC-82 (conflict marker)
**Linked AC:** AC-R-CSA-5, AC-R-CSA-7
**Depends on:** T-CSA.1, T-CSA.3
**Files to create/modify:**
- `bin/specrail-migrate.ts` (new)
- `tests/bin/specrail-migrate.test.ts` (new)
- `.specrail/migrate-report.json` (output artifact)
**Steps:**
1. RED — write TC-81: codemod 2회 실행 후 `git diff` byte count = 0.
2. RED — write TC-82: 3 conflict types (`yaml-conflict`·`ambiguous-id-mapping`·`partial-cross-ref`) 각각 marker emit + JSON row.
3. Run vitest — RED.
4. GREEN — implement migrate:
   - Phase 5 N-NNN→FLN-N·E-N→FLE-N rename (oracle CSV `migrations/2026-05-15-flow-rename.csv` from delta phase-05 §2.3.6)
   - Phase 2 S\d→SCEN-N rename
   - per-entity attrs block scaffolding from parameter tables (delta §2.2 등)
   - conflict 발견 시 `<!-- specrail:attrs-review-required reason=... -->` marker + JSON row 발행
5. Run test — GREEN.
6. REFACTOR — split conflict-handlers per type.
7. Commit: `feat(bin): add specrail-migrate codemod (T-CSA.5)`

---

## T-CSA.6: Codemod 13 spec file 실행 + manual review

**Status:** Pending
**RED test:** TC-86 (full-chain e2e on dogfood)
**Linked AC:** AC-R-CSA-1~7
**Depends on:** T-CSA.5
**Files to create/modify:**
- `docs/spec/*.md` (13 files, code-generated changes)
- `migrations/2026-05-15-flow-rename.csv` (oracle source-of-truth — created here)
- `.specrail/migrate-report.json`
**Steps:**
1. Create `migrations/2026-05-15-flow-rename.csv` with columns `old_id,new_id,scenario,step-order,journey-step,feature,surface` per delta phase-05.
2. Run `bin/specrail-migrate.ts --phase=all --dry-run` — review log.
3. Run `bin/specrail-migrate.ts --phase=all` — apply.
4. `git diff` — manual review per file. Any unexpected change → revert and fix codemod (T-CSA.5).
5. Run `bin/specrail-migrate.ts --phase=all` 다시 — idempotency 확인 (0-byte diff).
6. `.specrail/migrate-report.json`에 conflict marker가 있으면 manual fix + marker 제거.
7. Run vitest TC-86 e2e — verify all green.
8. Commit: `chore(spec): migrate 13 spec files to attrs schema (T-CSA.6)`

---

## T-CSA.7: Publish schema (npm + GH raw URL)

**Status:** Pending
**RED test:** OPS-CSA-1 CI smoke test
**Linked:** EXT-6, OPS-CSA-1
**Depends on:** T-CSA.2
**Files to modify:**
- `package.json` (add `schemas/` to `files` field)
- `.github/workflows/release.yml`
**Steps:**
1. `package.json` `files` array에 `"schemas"` 추가.
2. Release workflow에 git tag 생성 step + `npm publish` step.
3. Smoke test: `npm pack` (local) → `tar tf specrail-*.tgz | grep schemas/` — 파일 포함 검증.
4. CI smoke: post-publish curl `https://raw.githubusercontent.com/.../schemas/attrs.schema.json` HTTP 200 확인.
5. Commit: `chore(release): publish schemas/* as npm artifact (T-CSA.7)`

---

## T-CSA.8: `src/lint/attrs-completeness.ts` + `attrs-placement.ts`

**Status:** Pending
**RED test:** TC-83 (completeness) + TC-84 (placement)
**Linked AC:** AC-R-CSA-1, AC-R-CSA-3, AC-R-CSA-6
**Depends on:** T-CSA.2
**Files to create/modify:**
- `src/lint/attrs-completeness.ts` (new)
- `src/lint/attrs-placement.ts` (new)
- `src/lint/run-all.ts` (register)
- `tests/lint/*.test.ts`
**Steps:**
1. RED TC-83: required field 누락 → WARN (v0.1.0~0.3.0) / ERROR (v0.4.0+). Version-aware via `package.json` semver.
2. RED TC-83.b: review-required marker 존재 → 즉시 ERROR (WARN window 무관).
3. RED TC-84: attrs YAML이 heading 직후가 아닌 위치 → ERROR.
4. Run vitest — RED.
5. GREEN — implement both lints + register in `run-all.ts`. WARN message에 `specrail migrate --fix` 제안 의무 (OQ-CSA-3 resolution).
6. Run test — GREEN.
7. Commit: `feat(lint): add attrs-completeness + attrs-placement checks (T-CSA.8)`

---

## T-CSA.9: State machine gate (INV-3 확장)

**Status:** Pending
**RED test:** TC-85
**Linked AC:** AC-R-CSA-1
**Depends on:** T-CSA.8
**Files to modify:**
- `src/state/machine.ts`
- `tests/state/machine.test.ts`
**Steps:**
1. RED TC-85: Phase status `Proposed → Approved` 전환 시 attrs presence check. 누락 entity 있으면 transition reject.
2. Run vitest — RED.
3. GREEN — `validateTransition(phase, fromStatus, toStatus)`에 attrs-completeness check 추가 (v0.1.0~0.3.0 WARN, v0.4.0+ reject).
4. Run test — GREEN.
5. Commit: `feat(state): enforce attrs presence on Phase Approved transition (T-CSA.9, INV-3 확장)`

---

## T-CSA.10: `bin/specrail-audit.ts` CLI

**Status:** Pending
**RED test:** manual smoke (output format OQ-CSA-6 — markdown vs JSON)
**Linked NFR:** NFR-CSA-A11Y-1
**Depends on:** T-CSA.1, T-CSA.2, T-CSA.4
**Files to create:**
- `bin/specrail-audit.ts`
**Steps:**
1. Implement `auditCoverage()`: per-phase attrs coverage % · cross-ref dangling count · review-required marker count · KPI-7 측정.
2. Implement `acceptCodemodConflict(file)`: marker 제거 + JSON row resolve 표시.
3. Output format markdown 우선 (OQ-CSA-6 maintainer 결정 후 JSON 추가 옵션). Colour-blind safe — NFR-CSA-A11Y-1 (Coblis simulator manual test).
4. Smoke test: `bin/specrail-audit.ts` on dogfood spec → `docs/research/2026-05-15-markdown-audit.md` 형식과 유사 report 출력.
5. Commit: `feat(bin): add specrail-audit CLI (T-CSA.10)`

---

## T-CSA.11: Skill body rewrite — 13 phase

**Status:** Pending
**RED test:** grep test (`grep -l "specrail:attrs" skills/phase-*/SKILL.md` returns 13)
**Files to modify:**
- `skills/phase-01-prd/SKILL.md` ... `skills/phase-13-implementation-plan/SKILL.md` (13)
**Steps:**
1. Each phase skill body: "각 first-class entity 정의 직후 attrs block 작성" 단계 추가 with concrete example block.
2. grep test: 각 file에 `<!-- specrail:attrs` 인용 1+ 발견.
3. Manual review — skill body가 새 컨벤션을 자연스럽게 통합.
4. Commit: `docs(skills): teach attrs block convention in 13 phase skill bodies (T-CSA.11)`

---

## T-CSA.12: `skills/_common/principles.md` update

**Status:** Pending
**RED test:** grep test
**Files to modify:**
- `skills/_common/principles.md`
**Steps:**
1. Add §"Attrs Blocks Are Mandatory" 옆에 기존 §"Diagrams Are Mandatory" — same template.
2. Reference proposal §3.1 형식 + §3.4 closed enum 8 kinds.
3. grep test: `grep "Attrs Blocks Are Mandatory" skills/_common/principles.md` returns 1.
4. Commit: `docs(principles): add Attrs Blocks Are Mandatory section (T-CSA.12)`

---

## T-CSA.13: Telemetry schema-version key

**Status:** Pending
**RED test:** TC-87 (PII-detector semver-only)
**Linked NFR:** NFR-CSA-PRIV-1
**Files to modify:**
- `src/telemetry/payload.ts`
- `tests/telemetry/payload.test.ts`
**Steps:**
1. RED TC-87: payload schema validate against PII-detector — `schema-version` field type가 semver-number-only 강제.
2. Run vitest — RED.
3. GREEN — add `schema-version: string` field to telemetry payload (Phase 11 OPS-5 modification 일관). Value from `schemas/attrs.schema.json` `$id` or `$version`.
4. Run test — GREEN.
5. Commit: `feat(telemetry): add schema-version to opt-in payload (T-CSA.13)`

---

## T-CSA.14: 0.2.0 release notes + CHANGELOG + version bump (OQ-CSA-7 Resolved)

**Status:** Pending
**RED test:** npm pack dry-run · semver lint
**Depends on:** T-CSA.7, T-CSA.12, T-CSA.13
**Files to modify:**
- `package.json` (version → 0.2.0, assuming 0.1.0 already shipped per OQ-CSA-7)
- `CHANGELOG.md`
- `RELEASE.md` (new release notes section)
**Steps:**
1. `package.json` version 0.1.0 → 0.2.0 (OQ-CSA-7 Resolved 2026-05-15 — 0.1.0 already ships M0~M11 only).
2. `CHANGELOG.md`에 0.2.0 entry — attrs schema migration, ID family extend, codemod, audit CLI, breaking changes (legacy `S\d` dual-parse window, v0.5.0 ERROR cut 예고).
3. Release notes section in `RELEASE.md`.
4. `npm pack --dry-run` — verify schemas/ included, dist/ included.
5. Semver lint (`npx semantic-release --dry-run` 또는 manual).
6. Git tag `v0.2.0` with signed commit (NFR-CSA-SEC-1).
7. Commit: `chore(release): 0.2.0 — core-schema-attrs migration (T-CSA.14)`

---

## T-CSA.15: Playwright E2E TC-86

**Status:** Pending (T-CSA.6에 통합 — separate task entry for visibility)
**RED test:** TC-86
**Linked AC:** AC-R-CSA-1~7
**Depends on:** T-CSA.6 (codemod 실행 후)
**Files to create:**
- `tests/e2e/full-migration.test.ts` (Playwright + node test runner)
**Steps:**
1. Copy `docs/spec/` to temp dir.
2. Run `bin/specrail-migrate` on copy.
3. Run `bin/specrail-audit` on copy.
4. Assert: 0 conflict markers · KPI-7 coverage = 100% · attrs blocks on every first-class entity.
5. Run `vitest run tests/e2e/` — GREEN.
6. Commit: `test(e2e): full migration chain on dogfood spec (T-CSA.15, TC-86)`

---

## T-CSA.16: Perf bench (NFR-CSA-PERF-1·2·3)

**Status:** Pending
**RED test:** TC-78·TC-79·TC-81 perf assertion
**Linked NFR:** NFR-CSA-PERF-1, NFR-CSA-PERF-2, NFR-CSA-PERF-3
**Depends on:** T-CSA.1, T-CSA.2, T-CSA.5
**Files to modify:**
- Existing TC-78·TC-79·TC-81 tests — add perf timing assertion
**Steps:**
1. TC-78: assert parser per-file < 50ms p95 over 50 runs.
2. TC-79: assert validator full-spec < 500ms p95.
3. TC-81: assert codemod idempotency 0-byte diff (already in T-CSA.5).
4. Run vitest — GREEN.
5. Commit: `test(perf): add NFR-CSA-PERF-1·2·3 assertions (T-CSA.16)`

---

## Exit criteria (M-CSA 종료 조건)

- [ ] AC-R-CSA-1~7 all green (TC-78~87 모두 pass)
- [ ] NFR-CSA-PERF-1~3 all green (T-CSA.16 perf bench)
- [ ] NFR-CSA-AVAIL-1 schema fetch SLO 측정 시작 (외부 GitHub status)
- [ ] NFR-CSA-SEC-1 git tag signing (T-CSA.14)
- [ ] NFR-CSA-PRIV-1 semver-only (TC-87)
- [ ] NFR-CSA-A11Y-1 Coblis smoke test (T-CSA.10)
- [ ] `specrail audit` on dogfood spec reports KPI-7 = 100%
- [ ] 0 unresolved review-required markers in `.specrail/migrate-report.json`
- [ ] Phase 1~13 spec files merged with attrs blocks
- [ ] CHANGELOG + release notes published (T-CSA.14)
- [ ] dashboard repo `specrail/dashboard`이 `schemas/attrs.schema.json` consumer test 통과 (별 repo 책임, EXT-6 boundary)

---

## Lifecycle

```
tasks.md: Proposed (현재)
  ↓ verifier final sign-off (Phase 12·13 + tasks.md batch)
Approved
  ↓
Implementing — T-CSA.1 RED test 작성으로 시작
```
