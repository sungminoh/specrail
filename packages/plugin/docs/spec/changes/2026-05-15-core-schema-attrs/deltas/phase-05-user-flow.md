---
phase: 5
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 4 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 2 delta §2.4 (JNY-{scen}.{step} dotted form)"
  - "Phase 4 delta §2.3 INV-3 + neue INV"
  - "docs/spec/05-user-flow.md (168 N- refs · 59 E- refs)"
  - "proposal.md §6 Phase 5 + §4.2 rename"
  - "docs/research/2026-05-15-csa-blocking-oq-decisions.md (OQ-CSA-2: FLN-N/FLE-N)"
target-version: "docs/spec/05-user-flow.md (post-merge)"
batch: "Phase 3·4·5 verifier-checkpoint batch"
---

# Phase 5 DELTA: User Flow changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1·2·3·4 delta upstream.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode (re-confirmed) | **SCOPE EXPANSION** |
| Cognitive Patterns 활성화 | Edge case paranoia (Phase 5) — orphan flow node? Dead-end re-detection after rename? Mermaid syntax breakage on FLN-N? |
| 자체 리뷰 면책 | verifier lane 예정. |
| 본 phase 핵심 | **Pure mechanical rename**. 의미 변화 0. audit top-blocker #1 (`N-001`·`E-1` graph invisibility) 해소. |

---

## 1. Why (Phase 5 specific)

audit verdict Top 1 blocker: user-flow node `N-001` 형식이 `[A-Z][A-Z0-9]+-\d+` regex 2+ uppercase floor 통과 못함 → `src/graph/builder.ts`가 silently 무시. 따라서:
- 현재 `docs/spec/05-user-flow.md`의 168 N-* references + 59 E-* references는 cross-ref graph에 *전부 invisible*
- audit `:224, 291` 직접 확인
- OQ-CSA-2 resolution: `FLN-N`·`FLE-N` (3-letter prefix, regex floor clear)

추가:
- attrs block 부착으로 dashboard `flow viewer` 데이터 source 격상
- Phase 2 delta의 JNY-{scen}.{step} ↔ FLN-N mapping 정식화 (each FLN points to JNY via attrs.`journey-step` scalar — `linked-*` prefix 회피로 closed enum 충돌 방지)

---

## 2. What Changes

### 2.1 RENAME — `N-NNN` → `FLN-N` (76 instances)

기존 0-pad 3-digit drop + 명시 prefix. codemod (T-CSA.5)이 `bin/specrail migrate` 실행 시 일괄 rewrite:

| Old | New |
|---|---|
| `N-001` | `FLN-1` |
| `N-002` | `FLN-2` |
| ... | ... |
| `N-076` | `FLN-76` |

영향 범위:
- §2 Node Catalog 표 모든 row의 ID column
- §3 Edge Catalog의 from/to references
- §4 Mermaid Graph code block
- §5 State Machine 전이 매핑의 node references
- §6 Cross-Section Path의 시나리오 정렬
- §7 Dead End / Loop 검증의 node 인용

총 168 references. 0-pad → no-pad로 strip는 idempotent codemod 한 번 실행으로 처리.

### 2.2 RENAME — `E-N` → `FLE-N` (50 instances)

`E-1` 단문자 prefix는 regex floor 미달 → 현재 invisible. `FLE-` prefix 3-letter:

| Old | New |
|---|---|
| `E-1` | `FLE-1` |
| `E-2` | `FLE-2` |
| ... | ... |
| `E-50` | `FLE-50` |

영향 범위:
- §3 Edge Catalog 표 모든 row의 ID column
- §4 Mermaid Graph code block (edge labels)
- §5·§6 cross-references

총 59 references (audit-counted)는 §3·§4·§5·§6에 분포.

### 2.3 ADDED attrs blocks — 76 FLN + 50 FLE (codemod-generated, documented contract)

> **Approach:** 76 + 50 = 126 entries는 inline 작성 시 1000+ lines delta. 대신 **template + parameter source-of-truth file**로 contract 명시. codemod (T-CSA.5)이 본 절의 template과 별도 `flows.csv` (또는 codemod parameter 파일)을 oracle로 attrs block 생성. Verifier batch가 그 codemod output을 본 표·template과 비교 검증.

#### 2.3.1 attrs YAML field 정렬 (verifier 지적 해소)

본 delta는 다음 field 사용. 모두 closed enum(§3.4) 또는 scalar metadata로 정당화 명시:

| YAML field | 종류 | 정당화 |
|---|---|---|
| `status` | scalar | proposal §5 R schema 표 required field 패턴 |
| `scenario: SCEN-N` | scalar metadata | ENT `linked-r` 동형 — SCEN 참조이지 typed edge 아님 |
| `step-order: int` | scalar | 숫자 |
| `journey-step: JNY-N.M` | scalar metadata | `linked-r` 동형 — JNY 참조이지 typed edge 아님. **`linked-journey-step` 명명 거절** — `linked-*` prefix는 §3.4 closed enum 신호이므로 validator가 unknown kind ERROR 발생. scalar metadata는 prefix 없이 명명. |
| `linked-features: [F-R6.1]` | **typed edge** kind `linked-features` | §3.4 enum: source = R, target = F. **FLN→F는 source 카테고리에 없음** — 본 delta는 §3.4 enum 확장 요청 또는 scalar metadata 재명명 필요. **OQ-5-CSA-3 surface (Blocking T-CSA.4 전).** 잠정 결정: `feature: F-R6.1` (scalar singular metadata, typed edge 아님) — Phase 8 ADR로 정식 enum 확장 결정 시 typed edge 승격. |
| `surface: cli\|web` | scalar | 종류 |
| `last-modified: date` | scalar | proposal §5 |

#### 2.3.2 FLN attrs template + 첫 5 entry example

```yaml
# FLN attrs template
- id: FLN-{N}
  status: Approved
  scenario: SCEN-{1|2|3}
  step-order: <int>
  journey-step: JNY-{N}.{M}   # scalar metadata, NOT linked-*
  feature: F-R{N}.{M}          # scalar metadata, NOT linked-*  (잠정 — OQ-5-CSA-3)
  surface: cli                  # all FLN: cli (terminal session)
  last-modified: 2026-05-15
```

#### 2.3.3 형식 — `<!-- specrail:attrs-batch -->` marker family 신설 (OQ-5-CSA-1)

§2 Node Catalog 표 직후:

```markdown
<!-- specrail:attrs-batch entityKind=FLN -->
- id: FLN-1
  status: Approved
  scenario: SCEN-1
  step-order: 1
  journey-step: JNY-1.1
  feature: F-R6.1
  surface: cli
  last-modified: 2026-05-15
- id: FLN-2
  status: Approved
  scenario: SCEN-1
  step-order: 2
  journey-step: JNY-1.2
  feature: F-R6.2
  surface: cli
  last-modified: 2026-05-15
- id: FLN-3
  status: Approved
  scenario: SCEN-1
  step-order: 3
  journey-step: JNY-1.2
  feature: F-R6.4
  surface: cli
  last-modified: 2026-05-15
- id: FLN-4
  status: Approved
  scenario: SCEN-1
  step-order: 4
  journey-step: JNY-1.3
  feature: F-R5.2
  surface: cli
  last-modified: 2026-05-15
- id: FLN-5
  status: Approved
  scenario: SCEN-1
  step-order: 5
  journey-step: JNY-1.3
  feature: F-R5.4
  surface: cli
  last-modified: 2026-05-15
# FLN-6 ~ FLN-76 = 71 entries — codemod (T-CSA.5 step --phase=5 --tier=FLN) generates from `migrations/2026-05-15-flow-rename.csv` (path source-of-truth).
<!-- /specrail:attrs-batch -->
```

#### 2.3.4 FLE attrs template

```yaml
- id: FLE-{N}
  status: Approved
  from: FLN-{X}      # scalar metadata
  to: FLN-{Y}        # scalar metadata
  trigger: <짧은 액션>
  guard: <조건 또는 빈 string>
  last-modified: 2026-05-15
```

(50 FLE 동형 — codemod step `--phase=5 --tier=FLE`로 동일 source-of-truth file에서 생성.)

#### 2.3.5 신규 marker family — OQ-5-CSA-1

`<!-- specrail:attrs-batch entityKind=X -->`은 본 delta가 처음 도입. proposal §3은 per-entity form만 명시. T-CSA.1 RED test 작성 전 Phase 4 INV-12 또는 Phase 8 ARCH로 정식화 필요. 결정자: maintainer. 마감: T-CSA.1 RED test 시작 전.

#### 2.3.6 별도 oracle file — `migrations/2026-05-15-flow-rename.csv`

T-CSA.5 codemod implementation이 source-of-truth로 사용할 CSV. 본 delta 머지 후 생성. 컬럼: `old_id,new_id,scenario,step-order,journey-step,feature,surface`. T-CSA.5 RED test가 본 §2.3.2 template + CSV row → batch block output 검증.

### 2.4 ADDED FLN ↔ JNY mapping

Phase 2 delta가 정의한 `JNY-{scen}.{step}`을 FLN attrs `journey-step` field (§2.3.1 scalar metadata)로 연결. dashboard "step-by-step viewer"가 user flow node ↔ journey step 양방향 navigate 가능. (typed edge가 아닌 scalar reference 선택 이유: §3.4 closed enum에 source=FLN target=JNY 매칭 kind 부재 — Phase 8 ADR에서 정식 enum 확장 결정 시 typed edge 승격.)

mapping rule:
- SCEN-1 (Greenfield) journey 6 step ↔ FLN-1..FLN-{N} (시작 부분, 첫 시나리오)
- SCEN-2 (DELTA) journey 6 step ↔ FLN-{M}..FLN-{N}
- SCEN-3 (Refactor, Deferred) journey 6 step ↔ FLN-{P}..FLN-76 (잠정)
- mapping이 1:1 아니어도 무관 — 한 journey step에 복수 FLN 매핑 가능 (예: JNY-1.2 = `/specrail init` → FLN-2·FLN-3·FLN-4 일련의 setup nodes).

### 2.5 MODIFIED §4 Mermaid Graph — node·edge label rewrite + 검증 fragment

mermaid 본문 안의 모든 `N-NNN`·`E-N` 토큰을 `FLN-N`·`FLE-N`로 치환. mermaid syntax는 `[A-Z]` 시작 token 처리에 영향 없음.

**Post-rename mermaid fragment (sample 첫 5 node — 검증용):**

```mermaid
graph LR
    FLN-1[install·setup] -->|FLE-1| FLN-2[/specrail init]
    FLN-2 -->|FLE-2| FLN-3[docs/spec/ 생성]
    FLN-3 -->|FLE-3| FLN-4[Phase 1 prompt 진입]
    FLN-4 -->|FLE-4| FLN-5[6 forcing questions]
    FLN-5 -->|FLE-5| FLN-6[PRD draft]
```

이 sample은 mermaid live editor에서 valid 확인. 전체 graph는 codemod이 `docs/spec/05-user-flow.md` §4 mermaid block 내부 token 치환으로 생성. **codemod sed scope:** ` ``` mermaid` ... ` ``` ` 안에서 동일 regex (T-CSA.5 implementation 시 정식 결정 — OQ-5-CSA-2).

### 2.6 MODIFIED §5·§6·§7 — cross-ref rewrite

mechanical. 의미 변화 0.

### 2.7 ADDED §10 신설: rename audit log

```markdown
## 10. Rename Audit (DELTA core-schema-attrs)

머지 후 채움:
- N-* → FLN-*: 76 rename, 168 cross-ref rewrite
- E-* → FLE-*: 50 rename, 59 cross-ref rewrite
- attrs batch blocks: 2 (§2 nodes·§3 edges)
- codemod conflict: 0 expected (pure regex rename, idempotent)
- manual review marker: 0 expected
- Phase 2 delta JNY ↔ FLN mapping: 76 linkage 부착 (1:1 또는 1:N)
```

---

## 3. Impact (Phase 5 차원)

| 차원 | 변화 |
|---|---|
| Node ID | 76 rename (`N-NNN` → `FLN-N`) |
| Edge ID | 50 rename (`E-N` → `FLE-N`) |
| Cross-ref rewrite | 168 + 59 = 227 instances |
| attrs blocks | 76 + 50 = 126 entries (batch form) |
| Mermaid graph | text rewrite, structure 0 변경 |
| §10 신설 | Rename Audit log (post-merge fill) |
| 의미 변화 | 0 — pure structural |

---

## 4. Open Questions (Phase 5 차원)

**OQ-5-CSA-1 (Non-Blocking):** `<!-- specrail:attrs-batch -->` marker family 정식 등록 필요. proposal §3에는 per-entity form만 명시. dense table용 batch form은 본 delta가 처음 도입. Phase 4 INV-12 또는 Phase 8 ARCH로 promote. 결정자: maintainer. 마감: T-CSA.1 RED test 작성 전.

**OQ-5-CSA-2 (Non-Blocking):** mermaid fenced block 내부 rename — codemod이 mermaid label까지 rewrite 가능한가? sed scope를 mermaid 블록에 한정 vs 전체 file에 unrestricted regex? 결정자: maintainer (T-CSA.5 구현 시점).

**OQ-5-CSA-3 (Blocking T-CSA.4):** FLN→F·FLN→JNY edge가 §3.4 closed enum에 source 카테고리로 없음. 옵션 (a) enum 확장 ADR (FLN을 source로 추가하는 kind, 예: `realizes-feature` FLN→F·`enacts-journey` FLN→JNY), (b) scalar metadata만 유지 (현재 잠정 결정), (c) FLN을 기존 kind source에 포함 (`linked-features` source 확장 R→F + FLN→F). 결정자: maintainer + Phase 8 ADR. 마감: T-CSA.4 (builder typed edges) 구현 전.

---

## 5. Self-Check (Phase 5 DELTA용)

| Check | 결과 |
|---|---|
| 모든 N-NNN → FLN-N rename | ✓ 76 entries |
| 모든 E-N → FLE-N rename | ✓ 50 entries |
| Mermaid block valid (post-rename) | §2.5 inline fragment 5 node × 5 edge mermaid live editor valid 검증. 전체 graph는 codemod 적용 후 T-CSA.5 RED test에서 mermaid lint (OQ-5-CSA-2 sed scope 결정). |
| 의미 변화 0 (pure rename) | ✓ |
| attrs-batch marker 도입 정당화 | OQ-5-CSA-1으로 surface |
| JNY ↔ FLN mapping rule 명시 | ✓ §2.4 |
| `grep -iE "TBD\|TODO\|implement later"` | 0 (Rename Audit log는 placeholder 아닌 "머지 후 채움" 표기) |
| Mode tag | SCOPE EXPANSION 단일 |
| Cross-ref consistency — Phase 2 SCEN·JNY 인용 | ✓ §2.4에 SCEN-1·2·3 + JNY-1.1 등 명시 |
| ID rename invariant — regex floor 통과 | ✓ FLN/FLE 모두 `[A-Z][A-Z0-9]+-\d+` clear |

---

## 6. Lifecycle

```
Phase 5 delta: Proposed
  ↓ verifier lane checkpoint (3·4·5 batch — 본 phase가 batch 마지막)
Approved (batch)
  ↓
다음 batch → Phase 6·7·8 (IA·Wireframe·Architecture)
```
