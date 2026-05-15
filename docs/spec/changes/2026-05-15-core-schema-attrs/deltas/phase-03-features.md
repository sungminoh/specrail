---
phase: 3
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint (APPROVE WITH MINOR NOTES verdict)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 2 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 2 delta §2.6 (R-CSA + AC-R-CSA + R/F row attrs 예고)"
  - "docs/spec/03-features.md (current)"
  - "proposal.md §6 Phase 3 + §3.4 edge kind enum + §5 schema table"
target-version: "docs/spec/03-features.md (post-merge)"
batch: "Phase 3·4·5 verifier-checkpoint batch"
---

# Phase 3 DELTA: Features changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1·2 delta Approved.
> 본 file = Features 변경분.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode (re-confirmed at Phase 3) | **SCOPE EXPANSION** — silent drift 없음 |
| Cognitive Patterns 활성화 | Edge case paranoia (Phase 3) — 47자 attrs id? Zero-attrs entity? Network mid-save? First-time vs power user? |
| 자체 리뷰 면책 | 동일 AI session. verifier lane 예정. |

---

## 1. Why (Phase 3 specific)

3 변경이 Phase 3에서 강제됨:

1. **신규 R-CSA — schema commitment의 functional requirement.** PRD §12 (Phase 1 delta)는 의지·정책 명시. Features §R-CSA는 *기능*으로 measurable AC를 부여. AC 없는 commitment는 enforce 안 됨.
2. **모든 R1~R13 + F-R*.*에 attrs block.** dashboard "feature catalog with persona/journey linkage" view (audit §3.2)가 attrs 없으면 불가능.
3. **R3 (Deferred dashboard) 의미 보존 + reword.** PRD §6 dashboard 명시화와 일관 — R3는 "본 plugin이 dashboard product를 ship하지 않음. dashboard data contract만 export."로 reword.

---

## 2. What Changes

### 2.1 ADDED R-CSA: Schema-First Authoring

```markdown
## R-CSA: Schema-First Authoring (모든 first-class entity attrs presence)
```

<!-- specrail:attrs id=R-CSA -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-1, PAIN-4]    # 환각 ID + 검토 cumbersome
linked-features: [F-R-CSA.1, F-R-CSA.2, F-R-CSA.3, F-R-CSA.4, F-R-CSA.5]
linked-tests: []                  # Phase 10에서 채움
mode: HOLD                        # R-CSA 자체는 견고함 우선
since: 2026-05-15
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

**서술:**
모든 first-class entity (R·F·S·ENT·INV·NFR·ARCH·EXT·OPS·ADR·RISK·TC·EDGE·OQ·KPI·T·PERSONA·SCEN·JNY·ZN·P-CC)는 정의 heading 직후 `<!-- specrail:attrs id=X -->` + fenced YAML attrs block을 가진다. Lifecycle은 PRD §12.

#### Acceptance Criteria

- **AC-R-CSA-1 (GIVEN/WHEN/THEN):** GIVEN 사용자가 새 phase에 first-class entity 정의를 추가하고 attrs block을 누락한 채 phase status=Approved 시도, WHEN state machine gate 평가, THEN INV-3 확장 규칙으로 *reject* + actionable error message (`specrail migrate --fix` 제안).
- **AC-R-CSA-2:** GIVEN 사용자가 attrs block의 `id` field와 heading ID 불일치 작성, WHEN `attrs-completeness.ts` lint 실행, THEN ERROR + 차이 표시.
- **AC-R-CSA-3:** GIVEN attrs YAML이 entity heading 직후가 아닌 위치, WHEN `attrs-placement.ts` lint, THEN ERROR (invariant; OQ-CSA-1 resolution).
- **AC-R-CSA-4:** GIVEN attrs YAML의 `linked-*` field가 unknown edge kind 명시, WHEN `attrs-completeness.ts` lint, THEN ERROR + closed enum 8 kinds 안내 (§3.4 proposal).
- **AC-R-CSA-5:** GIVEN codemod이 `<!-- specrail:attrs-review-required -->` marker 부착, WHEN lint, THEN WARN window 무관 즉시 ERROR.
- **AC-R-CSA-6:** GIVEN v0.1.0~v0.3.0 plugin에서 attrs 누락 entity 정의, WHEN lint, THEN WARN (with migrate-fix suggestion). v0.4.0부터는 ERROR.
- **AC-R-CSA-7:** GIVEN 사용자가 `specrail migrate` 실행, WHEN codemod returns exit 0, THEN idempotent (재실행 시 변경 0) + 모든 conflict에 marker+JSON 발행.

#### Features

##### F-R-CSA.1: attrs parser

`src/markdown/attrs.ts` block 인식·YAML 디코딩·entity ID matching.

<!-- specrail:attrs id=F-R-CSA.1 -->
```yaml
status: Approved
parent-r: R-CSA
acceptance-criteria: [AC-R-CSA-2, AC-R-CSA-3]
linked-zones: []
linked-tests: []   # Phase 10
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

##### F-R-CSA.2: JSON Schema + ajv

`schemas/attrs.schema.json` (JSON Schema 2020-12) + `src/schema/validator.ts`.

<!-- specrail:attrs id=F-R-CSA.2 -->
```yaml
status: Approved
parent-r: R-CSA
acceptance-criteria: [AC-R-CSA-2, AC-R-CSA-4]
linked-zones: []
linked-tests: []
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

##### F-R-CSA.3: lint integration

`src/lint/attrs-completeness.ts` + `attrs-placement.ts` + `run-all.ts` 통합.

<!-- specrail:attrs id=F-R-CSA.3 -->
```yaml
status: Approved
parent-r: R-CSA
acceptance-criteria: [AC-R-CSA-1, AC-R-CSA-3, AC-R-CSA-5, AC-R-CSA-6]
linked-zones: []
linked-tests: []
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

##### F-R-CSA.4: migrate codemod

`bin/specrail migrate` — idempotent, 3 conflict 유형 marker (`yaml-conflict`·`ambiguous-id-mapping`·`partial-cross-ref`).

<!-- specrail:attrs id=F-R-CSA.4 -->
```yaml
status: Approved
parent-r: R-CSA
acceptance-criteria: [AC-R-CSA-5, AC-R-CSA-7]
linked-zones: []
linked-tests: []
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

##### F-R-CSA.5: audit CLI

`bin/specrail audit` — attrs coverage report (KPI-7 측정).

<!-- specrail:attrs id=F-R-CSA.5 -->
```yaml
status: Approved
parent-r: R-CSA
acceptance-criteria: [AC-R-CSA-5]
linked-zones: []
linked-tests: []
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.2 MODIFIED R1·R2·R4~R8·R13 + F-R*.* — codemod-generated attrs (documented contract)

> **Approach:** R1·R2·R4~R8·R13 (8 R) × 평균 4 F-R*.* (≈50 F) attrs block 일괄 부착. 머지 시 `bin/specrail migrate phase-03` 가 본 절의 **template + parameter table**로 생성. delta가 *abbreviation*이 아닌 *codemod contract* (T-CSA.5 RED test가 본 표를 oracle로 사용).

#### 2.2.1 R-tier attrs template

모든 R는 다음 template로 attrs block 부착:

```yaml
status: Approved
importance: P0    # parameter (see §2.2.2)
owner: PERSONA-1  # all R: same owner (single-user)
solves-pains: [...]    # parameter
linked-features: [...]  # parameter
linked-tests: []       # Phase 10 결정 후 채움
mode: HOLD             # all R: HOLD (req는 견고 우선)
since: 2026-05-10      # all R: original date (R-CSA: 2026-05-15)
last-modified: 2026-05-15
```

#### 2.2.2 R-tier parameter table

| ID | importance | solves-pains | linked-features |
|---|---|---|---|
| R1 | P0 | `[PAIN-1, PAIN-2]` | `[F-R1.1, F-R1.2, F-R1.3, F-R1.4]` |
| R2 | P0 | `[PAIN-1, PAIN-3]` | `[F-R2.1, F-R2.2, F-R2.3, F-R2.4]` |
| R4 | P0 | `[PAIN-8]` | `[F-R4.1, F-R4.2, F-R4.3]` |
| R5 | P0 | `[PAIN-9]` | `[F-R5.1, F-R5.2, F-R5.3, F-R5.4]` |
| R6 | P0 | `[PAIN-10]` | `[F-R6.1, F-R6.2, F-R6.4]` |
| R7 | P0 | — | `[F-R7.1, F-R7.2]` |
| R8 | P0 | — | `[F-R8.1, F-R8.2, F-R8.3]` |
| R13 | P0 | — | `[F-R13.x]` (Phase 11 telemetry features) |

(R3 은 §2.3 별도 reword.)

> PAIN ID는 Phase 2 delta normalize 후. `solves-pains: []` (empty) entry는 R7·R8·R13처럼 PAIN cross-ref가 명확 mapping 없는 경우 — `dashboard catalog`·`telemetry` 등 *capability 자체*가 pain-resolution보다 *system* 카테고리.

#### 2.2.3 F-tier attrs template

```yaml
status: Approved
parent-r: R{N}        # parameter (per F)
acceptance-criteria: [AC-R{N}-{M}, ...]   # parameter (해당 R의 AC 인용)
linked-zones: []      # Phase 6/7 zone ID 부여 후 채움
linked-tests: []
last-modified: 2026-05-15
```

F-tier parameter table은 R별 sub-feature ≈50건이라 본 delta에 inline 안 함 — codemod이 `docs/spec/03-features.md` 본문의 기존 `### F-RN.M:` heading을 grep하여 자동 매핑 (parent-r는 prefix 파싱, acceptance-criteria는 §AC 표 cross-ref). T-CSA.5 codemod step `--phase=3 --tier=F`가 생성.

#### 2.2.4 ID pattern dependency (HIGH — verifier 지적 해소)

`R-CSA`·`F-R-CSA.1~5`·`AC-R-CSA-1~7`는 *현재* `src/spec/patterns.ts:23-36`의 `ID_PATTERN_SOURCE` (`R\d+`·`F\d+\.\d+`·`AC-R\d+-\d+`)와 매치 안 됨. **`R-CSA`는 suffix가 digit이 아니라 capability 식별자**. 본 delta는 그 한계를 명시:

- **Dependency:** T-CSA.3 (proposal §7.1) `ID_PATTERN_SOURCE` 확장에 다음 추가 필수:
  - `R-[A-Z]+[A-Z0-9]*` (capability-suffix R)
  - `F-R-[A-Z]+[A-Z0-9]*\.\d+` (capability-suffix F)
  - `AC-R-[A-Z]+[A-Z0-9]*-\d+` (capability-suffix AC)
- T-CSA.3 ship 전에는 R-CSA·F-R-CSA·AC-R-CSA가 `src/graph/builder.ts`에 invisible — Phase 3 delta 머지는 T-CSA.3 ship에 dependency. Implementation Plan §M-CSA dependency graph(proposal §8)에 추가 entry.
- 대안 거절: `R-CSA` → `R99` (canonical R{n}) 으로 reduction — capability identifier 의미 손실, 다른 capability에서 numeric 충돌 risk. 거절.

### 2.3 MODIFIED R3 — Deferred → Data-contract-only reword

**Before** (`03-features.md:71`):
```markdown
## R3: 로컬 웹 대시보드 — DEFERRED (별 cycle)
```

**After:**
```markdown
## R3: Dashboard data-contract export (product 자체는 별 repo `specrail/dashboard`)
```

<!-- specrail:attrs id=R3 -->
```yaml
status: Approved
importance: P1
owner: PERSONA-1
solves-pains: [PAIN-4]
linked-features: [F-R3.1, F-R3.2]
linked-tests: []
mode: HOLD
note: "PRD §6 (Phase 1 delta) Non-Goal 명시화와 일관. 본 plugin은 dashboard product를 ship하지 않음 — schema·graph JSON contract만 export."
since: 2026-05-10
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

#### F-R3.1: schemas/attrs.schema.json published artifact
#### F-R3.2: graph + attrs JSON serializer (CLI `specrail dump --format json`)

(Old F-R3.* "dashboard server 자동 spawn" 등은 모두 REMOVED — `02-personas-journey.md:159` 같은 dashboard-product 기능 인용 모두 제거. SCEN-1·SCEN-2 journey step은 변경 없음 — Phase 2 delta 참조.)

### 2.4 ADDED §10 신설: attrs 컨벤션 reference

```markdown
## 10. Attrs Block Convention (DELTA core-schema-attrs)

본 절은 R-CSA의 normative reference.

### 10.1 형식
- heading 직후 (next-block, prose 이전, OQ-CSA-1 resolved)
- `<!-- specrail:attrs id={ENTITY_ID} -->` + ` ```yaml ` ... ` ``` ` + `<!-- /specrail:attrs -->`
- ID 일치 의무 (id 인자 ↔ heading ID)

### 10.2 Required field per entity 유형
proposal §5 Schema by entity type 인용. 본 Phase 3는 R·F·S에 한정:
- R: status, importance, owner, solves-pains, linked-features, linked-tests, mode
- F-R*.*: status, parent-r, acceptance-criteria, linked-zones, linked-tests
- S{n}.{m}.{k}: status, parent-f, linked-zones

### 10.3 Edge kind (closed enum 8, OQ-CSA-5 resolved)
proposal §3.4 인용. R/F/S에서 발행 가능한 kind: `solves`·`linked-features`·`parent`·`tested-by`·`linked-arch`.

### 10.4 Backward compat
v0.1.0~v0.3.0 WARN · v0.4.0 ERROR (PRD §12).

### 10.5 Validator
- `src/lint/attrs-completeness.ts` (required field check)
- `src/lint/attrs-placement.ts` (heading-immediate invariant)
- `src/schema/validator.ts` (ajv against `schemas/attrs.schema.json`)
- review-required marker = always ERROR (WARN window 무관, OQ-CSA-10 resolved)
```

### 2.5 MODIFIED §0 Roles — 무변동

`03-features.md:12` "Single-user. Plugin은 한 사용자 환경에 install" 유지. PERSONA-1 reference로 본 delta 후 § 3 첫 줄을 `Single-user (PERSONA-1)`로 변경 (1 token diff).

---

## 3. Impact (Phase 3 차원)

| 차원 | 변화 |
|---|---|
| 신규 R | R-CSA 1개 + AC-R-CSA-1~7 + F-R-CSA.1~5 |
| 기존 R attrs 부착 | R1·R2·R3(reword)·R4·R5·R6·R7·R8·R13 = 9개 + F-R*.* ≈ 50개 |
| 기존 R 의미 | 0 변경 (R3 reword는 의미 보존 — Non-Goal 명시화 일관) |
| §10 신설 | attrs 컨벤션 reference (R-CSA normative) |
| AC count | +7 (AC-R-CSA-1~7) |
| F count | +5 (F-R-CSA.1~5) |

---

## 4. Open Questions (Phase 3 차원)

신규 0건. 기존 OQ proposal §10 잔존.

---

## 5. Self-Check (Phase 3 DELTA용)

| Check | 결과 |
|---|---|
| 신규 R-CSA에 AC 7 + F 5 | ✓ |
| AC GIVEN/WHEN/THEN 형식 (INV-5 준수) | ✓ AC-R-CSA-1~7 모두 명시 형식 |
| 모든 신규 entity attrs block 부착 | ✓ (R-CSA·F-R-CSA.x·R3 reword) |
| Edge kind enum 위반 (unknown kind) | 0 (R-CSA의 linked-features·solves-pains·linked-tests 모두 enum 8개 안) |
| Cross-ref consistency — PAIN-1/2/4 references | ✓ Phase 2 delta의 PAIN 정규화와 일관 |
| R3 reword — 의미 보존 | ✓ Non-Goal scope 동일 (별 cycle = 별 repo의 구체화) |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |
| Mode tag | SCOPE EXPANSION 단일 |
| dogfood | ✓ §2.1 R-CSA attrs block 본 delta 안 example |

---

## 6. Lifecycle

```
Phase 3 delta: Proposed (현재)
  ↓ verifier lane checkpoint (Phase 3·4·5 batch)
Approved (batch)
  ↓
다음 → Phase 4 delta (Domain)
```
