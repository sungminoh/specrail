---
phase: 10
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint (fix iteration 2 — TC renumber TC-78~87)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 9 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 3 delta R-CSA AC-R-CSA-1~7"
  - "Phase 9 delta NFR-CSA-PERF-1~3"
  - "docs/spec/10-test-strategy.md (current — 5 TC, 25 EDGE)"
  - "proposal.md §6 Phase 10"
target-version: "docs/spec/10-test-strategy.md (post-merge)"
batch: "Phase 9·10·11 verifier-checkpoint batch"
---

# Phase 10 DELTA: Test Strategy changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1~9 Approved/in batch.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode | **SCOPE EXPANSION** |
| Iron Law 강화 (skill body §1) | RED → GREEN → REFACTOR. 본 phase 신규 TC는 모두 RED-first (T-CSA.1~14 RED test 명시). |
| 자체 리뷰 면책 | verifier batch checkpoint 예정. |

---

## 1. Why (Phase 10 specific)

R-CSA의 AC 7개 + NFR-CSA 7개를 TC·EDGE로 마감. T-CSA.* 14 task가 모두 TC reference로 RED-first 강제.

---

## 2. What Changes

### 2.1 ADDED TC-78~87 (10 신규 TC — 9 originally + TC-87 for NFR-CSA-PRIV-1 coverage gap, verifier catch)

| TC ID | Level | Subject | Linked AC | Linked NFR | Linked T |
|---|---|---|---|---|---|
| TC-78 | unit | attrs parser — valid block · invalid YAML · orphan id · duplicate id | AC-R-CSA-2 | NFR-CSA-PERF-1 | T-CSA.1 |
| TC-79 | unit | ajv schema validator — required field·unknown kind·closed-enum violation | AC-R-CSA-2, AC-R-CSA-4 | NFR-CSA-PERF-2 | T-CSA.2 |
| TC-80 | integ | typed edge builder — emit from `linked-*` field · kind preserved · source-target invariant | — | — | T-CSA.4 |
| TC-81 | integ | codemod idempotency — re-run delta = 0 byte · rewrites N/E/S · attrs scaffolding | AC-R-CSA-7 | NFR-CSA-PERF-3 | T-CSA.5 |
| TC-82 | integ | codemod conflict marker — emit `<!-- specrail:attrs-review-required -->` for yaml-conflict·ambiguous-id-mapping·partial-cross-ref | AC-R-CSA-5 | — | T-CSA.5 |
| TC-83 | integ | lint attrs-completeness — required field missing → WARN/ERROR per version | AC-R-CSA-1, AC-R-CSA-6 | — | T-CSA.8 |
| TC-84 | integ | lint attrs-placement — heading-immediate invariant | AC-R-CSA-3 | — | T-CSA.8 |
| TC-85 | integ | state machine transition gate — attrs presence enforced at v0.4.0+ | AC-R-CSA-1 | — | T-CSA.9 |
| TC-86 | e2e | `specrail migrate` + `specrail audit` full chain on dogfood spec 13 phase | AC-R-CSA-1~7 | NFR-CSA-PERF-1, NFR-CSA-A11Y-1 | T-CSA.5, T-CSA.6, T-CSA.10 |
| TC-87 | unit | telemetry `schema-version` payload PII-detector — semver number-only, no string PII | — | NFR-CSA-PRIV-1 | T-CSA.13 |

attrs block per TC:

<!-- specrail:attrs id=TC-78 -->
```yaml
status: Approved
level: unit
linked-ac: [AC-R-CSA-2]
linked-nfr: [NFR-CSA-PERF-1]
flaky: false
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

(TC-79~86 동형 — codemod scaffolding from §2.1 표.)

### 2.2 ADDED EDGE-26~37 (12 신규 EDGE)

| EDGE ID | Subject | Linked AC | Repro |
|---|---|---|---|
| EDGE-26 | attrs id 와 heading id 불일치 | AC-R-CSA-2 | attrs `id=R3` + heading `## R5` |
| EDGE-27 | attrs YAML 안 byte order mark (BOM) | AC-R-CSA-2 | UTF-8 BOM 포함 fenced YAML |
| EDGE-28 | attrs block이 다른 attrs block 안에 nested | AC-R-CSA-3 | malformed nested marker |
| EDGE-29 | linked-* field에 self-reference (R3 → R3) | AC-R-CSA-4 | cyclic edge |
| EDGE-30 | linked-* field에 deleted entity reference | AC-R-CSA-4 | dangling cross-ref |
| EDGE-31 | codemod 실행 중 file mtime 변경 (concurrent edit) | AC-R-CSA-7 | race condition |
| EDGE-32 | review-required marker 안 ` reason=" "` (empty reason) | AC-R-CSA-5 | empty quote |
| EDGE-33 | YAML field name typo (`solv-pains` instead of `solves-pains`) | AC-R-CSA-4 | typo |
| EDGE-34 | attrs YAML indentation 4-space vs 2-space mix | AC-R-CSA-2 | indent inconsistency |
| EDGE-35 | schema-version mismatch — v0.2.0 spec read by v0.5.0 validator | AC-R-CSA-1, AC-R-CSA-6 | version skew |
| EDGE-36 | codemod이 mermaid fenced block 내부 ID rename — false-positive (mermaid label text) | — | OQ-5-CSA-2 |
| EDGE-37 | attrs-batch entry id 중복 (FLN-3 두 번) | AC-R-CSA-2 | duplicate batch row |

attrs block per EDGE 동형 — `linked-ac` field 인용.

### 2.3 MODIFIED §3 INV ↔ TC Mapping (append)

```markdown
**DELTA core-schema-attrs:**
- INV-3 (확장 — attrs presence) → TC-85
- INV-11 (edge kind closed enum) → TC-79
- INV-12 (review-required marker always ERROR) → TC-82, TC-83
```

### 2.4 MODIFIED 기존 5 TC + 25 EDGE — codemod attrs

#### 2.4.1 TC-tier attrs template

```yaml
status: Approved
level: <unit|integ|e2e>
linked-ac: [...]
linked-nfr: [...]      # optional
flaky: false
last-modified: 2026-05-15
```

codemod이 §2 AC ↔ TC mapping 표 + §4 Edge Case Catalog 표를 oracle로 attrs block scaffolding. row-based source-of-truth (Phase 9 동형 approach).

---

## 3. Impact (Phase 10 차원)

| 차원 | 변화 |
|---|---|
| 신규 TC | 10 (TC-78~87) |
| 신규 EDGE | 12 (EDGE-26~37) |
| 기존 TC attrs | 5 (codemod) |
| 기존 EDGE attrs | 25 (codemod) |
| §3 INV ↔ TC mapping | 3 신규 row append |
| AC ↔ TC coverage | R-CSA의 AC-R-CSA-1~7 모두 ≥ 1 TC mapping |
| NFR ↔ TC coverage | NFR-CSA-PERF-1·2·3·A11Y-1·**PRIV-1** 모두 TC mapping (TC-87 verifier catch로 추가). AVAIL-1·SEC-1은 외부 측정 (Phase 9 measure-method 명시) |

---

## 4. Open Questions (Phase 10 차원)

**OQ-10-CSA-1 (Non-Blocking):** TC-86 (`specrail migrate` + `specrail audit` full chain e2e)이 dogfood spec 13 phase × 모든 attrs 부착 후 실행 — test environment에서 `docs/spec/` 전체 copy해서 codemod 실행 → assertion. CI runtime cost 추정 필요. 결정자: maintainer. 마감: T-CSA.12 (E2E setup) 시점.

---

## 5. Self-Check (Phase 10 DELTA용)

| Check | 결과 |
|---|---|
| 신규 TC 9개 모두 AC linked | ✓ §2.1 표 |
| 신규 EDGE 12개 모두 AC 또는 OQ linked | ✓ §2.2 표 (EDGE-36은 OQ-5-CSA-2 referenced) |
| AC-R-CSA-1~7 모두 TC ≥ 1 mapping | AC-1: TC-83, TC-85, TC-86 / AC-2: TC-78, TC-79, EDGE-26~28, 34 / AC-3: TC-84 / AC-4: TC-79, EDGE-29, 30, 33 / AC-5: TC-82, EDGE-32 / AC-6: TC-83, EDGE-35 / AC-7: TC-81, EDGE-31 — ✓ |
| TC GIVEN/WHEN/THEN ACT 형식 (INV-5)| 본 delta 표는 *summary*. 정식 GIVEN/WHEN/THEN는 머지 시 §2 표에 expand — 본 delta 검증 대상 아님 |
| ID 충돌 — TC-78~86 + TC-87, EDGE-26~37 live spec 미존재 | ✓ live spec TC-1~77 + EDGE-1~25만 (verifier catch: 처음 TC-6~14 잘못 할당 → TC-78~86으로 재할당) |
| Edge kind enum compliance (`linked-ac` required, `linked-nfr` optional scalar metadata) | ✓ proposal §5 TC-N row 패치 후 (verifier 지적) `linked-nfr` 명시 등재 |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |
| Mode tag | SCOPE EXPANSION 단일 |
| Iron Law 강조 | ✓ §0 |

---

## 6. Lifecycle

```
Phase 10 delta: Proposed
  ↓ verifier batch checkpoint (9·10·11)
Approved (batch)
  ↓
다음 → Phase 11 delta (Operations)
```
