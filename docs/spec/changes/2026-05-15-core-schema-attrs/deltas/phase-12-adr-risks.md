---
phase: 12
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — final batch verifier (ADR-14 INV-7 fix applied)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 11 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 8 delta §2.7 ADR-CAND-13/14/15"
  - "Phase 1 delta §12 Schema commitment + §13 Repo layout"
  - "proposal.md §11 RISK-CSA"
  - "docs/spec/12-adr-risks.md (current — ADR-1~11, RISK-1~10)"
target-version: "docs/spec/12-adr-risks.md (post-merge)"
batch: "Phase 12·13 final batch"
---

# Phase 12 DELTA: ADR + Risks changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1~11 Approved/in batch.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode | **SCOPE EXPANSION** |
| Innovation token | 본 phase는 5 신규 ADR. proposal §0 commitment "0/3 consumed" 유지 검증: ADR 자체는 token 소비 metric 아님 (boring industry-standard tech: JSON Schema·YAML·HTML comment marker family·closed enum·multi-repo split). |
| 자체 리뷰 면책 | verifier batch checkpoint 예정. |

---

## 1. Why (Phase 12 specific)

3 영역 누적 결정 정식화:

1. **Phase 8 ADR-CAND-13·14·15** — 3 candidate를 정식 ADR로 승격 (ADR-12·13·14).
2. **Phase 1 §12·§13 commitment** — schema commitment + repo layout이 architectural decision 차원 — 정식 ADR로 (ADR-15).
3. **Edge kind closed enum freeze** — proposal §3.4 + OQ-CSA-5 architect resolution은 이미 결정. Phase 12에서 정식 ADR (ADR-16).

Plus RISK 7건 (proposal §11) 정식 RISK-CSA-1~7 등재.

---

## 2. What Changes — ADRs

### 2.1 ADR-12: Attrs schema as architectural contract (formalizes ADR-CAND-13)

```markdown
### ADR-12: Attrs schema as architectural contract

**Status:** Accepted
**Date:** 2026-05-15
**Supersedes:** —
**Context:** specrail/core가 자기 spec markdown 안 first-class entity의 *attribute layer*를 machine-extractable contract로 export해야 함 (audit `docs/research/2026-05-15-markdown-audit.md` 45-55% gap). 별 repo `specrail/dashboard`·third-party tool이 이 contract에 의존.
**Decision:** `<!-- specrail:attrs id=X -->` + fenced YAML per-entity attribute block을 plugin 1급 산출물로 채택. `schemas/attrs.schema.json` (JSON Schema 2020-12) public artifact.
**Consequences:**
- + 모든 first-class entity의 attribute layer가 machine-extractable.
- + dashboard·third-party가 stable contract에 의존 가능.
- + lint·validator·state machine으로 attrs presence enforce 가능.
- − 사용자 spec 작성 cost: per-entity attrs block 작성 (codemod scaffolding으로 mitigation).
- − schema-version evolution policy 필요 (ADR-13).
**Alternatives considered:**
- HOLD SCOPE 마이그레이션 (~15h, schema only) — 거절. data contract·migration tool·skill teach 빠지면 사용자 spec 품질이 plugin-uncontrolled.
- Open vocabulary (no closed enum) — 거절 (ADR-16 separate decision).
- Frontmatter only (no per-entity blocks) — 거절. phase당 30+ entity, frontmatter는 1 block per file.
```

<!-- specrail:attrs id=ADR-12 -->
```yaml
status: Approved
decision: "attrs schema as architectural contract"
consequences: "machine-extractable attribute layer · dashboard·third-party stable contract · attrs presence enforceable"
supersedes: []
superseded-by: []
alternatives-considered: ["HOLD SCOPE schema-only", "Open vocabulary", "Frontmatter only"]
linked-r: [R-CSA]
linked-arch: [ARCH-13, ARCH-14, ARCH-15]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.2 ADR-13: Schema-version policy (formalizes ADR-CAND-14)

```markdown
### ADR-13: Schema-version policy

**Status:** Accepted
**Date:** 2026-05-15
**Context:** `schemas/attrs.schema.json`은 시간에 따라 진화. Consumer (dashboard·third-party)와 producer (specrail/core)의 version 호환성 필요.
**Decision:** semver — schema-version v1.0 = **first published schema release at plugin 0.2.0** (0.1.0 ships no schema per OQ-CSA-7; M-CSA shipping in 0.2.0 cuts schema v1.0). Minor bump (v1.0 → v1.1) = closed enum 추가 (backward-compat). Major bump (v1.0 → v2.0) = breaking change (field rename, kind 제거).
**Consequences:**
- + Consumer가 명시 version 선언으로 안정성 보장.
- + Telemetry (OPS-5 schema-version key, Phase 11 delta)가 사용자 spec version 추적.
- − Major bump 시 codemod 의무 — sender·receiver 양쪽.
**Alternatives:** Date-stamped versioning (거절: semver가 industry-standard). Calver (거절: schema 변경 빈도가 calendar 단위 안 됨).
```

<!-- specrail:attrs id=ADR-13 -->
```yaml
status: Approved
decision: "semver schema-version, v1.0 frozen at plugin 0.1.0"
consequences: "consumer stability · telemetry track · major bump = codemod"
supersedes: []
superseded-by: []
alternatives-considered: ["Date-stamped versioning", "Calver"]
linked-r: [R-CSA]
linked-arch: [ARCH-14]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.3 ADR-14: Marker family formalization (formalizes ADR-CAND-15)

```markdown
### ADR-14: Marker family formalization

**Status:** Accepted
**Date:** 2026-05-15
**Context:** Plugin은 다음 HTML-comment marker family 사용:
- `<!-- specrail:attrs id=X -->` (per-entity attrs)
- `<!-- specrail:attrs-batch entityKind=X -->` (batch attrs for dense tables — Phase 5·7 신설)
- `<!-- specrail:attrs-review-required reason="..." -->` (codemod conflict marker)
- `<!-- specrail:deftable -->` · `<!-- specrail:def-list -->` · `<!-- specrail:ignore-start/end -->` (기존)
**Decision:** Marker family를 Phase 4 INV-14 (신규)로 등재. 추가 marker form 도입은 ADR 필수.
**Consequences:** Parser·validator가 marker form set을 닫힌 enum으로 인식 → false-positive 제거. 새 marker 도입 ADR 절차 명시.
**Alternatives:**
- *Open marker family (any `specrail:*`)* — 거절: parser ambiguity. 새 marker가 silent drift로 도입되면 validator switch case 누락 발생. 동의어 drift risk(`specrail:attribute`·`specrail:attr-block`·...).
- *Per-file frontmatter array for all entity attrs (no per-entity HTML marker)* — 거절: frontmatter는 1 block per file이라 phase당 30+ entity scaling 안 됨. entity↔attrs locality 깨짐(audit `:182` 패턴 재현). grep ergonomics(`grep -A` heading-immediate)도 손실.
```

<!-- specrail:attrs id=ADR-14 -->
```yaml
status: Approved
decision: "Marker family는 INV-14 (Phase 4) 등재 closed family"
consequences: "parser·validator closed enum · 추가 ADR 의무"
supersedes: []
superseded-by: []
alternatives-considered: ["Open marker family", "Per-file frontmatter array"]
linked-r: [R-CSA]
linked-arch: [ARCH-13]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.4 ADR-15: Multi-repo split (specrail/core + specrail/dashboard)

```markdown
### ADR-15: Multi-repo split — specrail/core + specrail/dashboard

**Status:** Accepted
**Date:** 2026-05-15
**Context:** PRD §10 (2026-05-12) "Local web dashboard는 별 cycle" 결정의 구체화 — 별 cycle = 별 repo. Dashboard product-grade webapp(manyfast.io class)은 core plugin의 lifecycle·release 사이클과 다름.
**Decision:** `specrail/core` (이 repo, npm `specrail`)와 `specrail/dashboard` (별 repo, optional companion) 2 repo 운영. Core는 attrs schema public contract (EXT-6) 통해 dashboard에 데이터 제공.
**Consequences:**
- + Core shipping 일정이 dashboard 작업에 영향 받지 않음.
- + Dashboard가 자기 13-phase pass로 dogfood 가능 (별 product).
- + Core repo size·CI cost minimal.
- − Schema contract evolution이 두 repo 동기화 필요 (ADR-13 schema-version policy mitigation).
**Alternatives:** Mono-repo (apps/dashboard sub-workspace) — 거절. dashboard product-grade로 커지면 build·CI·릴리스가 plugin core 가벼움 짓누름. Companion tool (no spec) — 거절. dashboard도 spec discipline 가치.
```

<!-- specrail:attrs id=ADR-15 -->
```yaml
status: Approved
decision: "multi-repo: specrail/core + specrail/dashboard"
consequences: "core shipping 독립 · dashboard 자기 dogfood · 두 repo schema 동기화 필요"
supersedes: []
superseded-by: []
alternatives-considered: ["mono-repo apps/dashboard", "companion tool no-spec"]
linked-r: [R-CSA]
linked-ext: [EXT-6]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.5 ADR-16: Edge kind closed enum freeze (formalizes OQ-CSA-5)

```markdown
### ADR-16: Edge kind closed enum frozen at v1.0

**Status:** Accepted
**Date:** 2026-05-15
**Context:** proposal §3.4 8 typed edge kind (`solves`·`linked-features`·`parent`·`tested-by`·`covers-ac`·`mitigates`·`linked-arch`·`depends-on`). architect first-principles 분석 (`docs/research/2026-05-15-csa-blocking-oq-decisions.md` OQ-CSA-5)이 closed enum 추천.
**Decision:** v1.0에서 8 kind frozen. unknown kind = validator ERROR. 추가는 minor schema-version bump + 본 ADR family에 신규 ADR (예: ADR-17, ADR-18).
**Consequences:**
- + dashboard switch statement 8 case로 끝남.
- + 사용자 spec에서 동의어 drift 방지 (`solves-pain`·`addresses-pain` 같은).
- + closed enum + schema-version evolution 양립.
- − 9번째 kind 필요 시 ADR 절차 cost.
**Alternatives:** Open vocabulary + lint curation — 거절. 동의어 drift inevitable (audit 시연). Frozen forever no-version-bump — 거절. 6개월 안 wall hit risk.
```

<!-- specrail:attrs id=ADR-16 -->
```yaml
status: Approved
decision: "8 edge kinds frozen at v1.0, schema-version bump for additions"
consequences: "dashboard switch 8 case · drift 방지 · 9th kind ADR cost"
supersedes: []
superseded-by: []
alternatives-considered: ["Open vocabulary + lint", "Frozen forever"]
linked-r: [R-CSA]
linked-arch: [ARCH-14]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.6 MODIFIED 기존 ADR-1~11 — codemod attrs

ADR-tier attrs template:

```yaml
status: Approved
decision: <existing prose summary>
consequences: <existing prose summary>
supersedes: []
superseded-by: []
alternatives-considered: [...]
linked-r: [...]
linked-arch: [...]
last-modified: 2026-05-15
```

codemod이 §A Part A의 11 ADR을 oracle로 attrs scaffolding (row-based, Phase 9·10·11 동형 approach).

---

## 3. What Changes — RISKs

### 3.1 ADDED RISK-CSA-1~7 (proposal §11 formalization)

| ID | Severity | Prob | Description | Mitigation |
|---|---|---|---|---|
| RISK-CSA-1 | H | M | 기존 13 spec file migration 의미 보존 실패 (잘못된 attrs auto-fill) | T-CSA.6 manual review · idempotent codemod · git diff review · `status: legacy` 보수적 자동 채움 |
| RISK-CSA-2 | M | M | 사용자 hand-written spec이 attrs 없이 v0.5.0 upgrade 시 break | dual-parse window 3 minor · migrate codemod 제공 · CHANGELOG 명시 |
| RISK-CSA-3 | M | L | typed edge enum이 dashboard view와 mismatch | OQ-CSA-5 → ADR-16 frozen · schema-version 도입으로 평행 진화 |
| RISK-CSA-4 | M | L | `<!-- specrail:attrs -->` marker가 markdown renderer에서 깨짐 | 기존 동형 marker(`deftable`·`def-list`) 동작 중 — empirical 안전. Phase 9 A6 검증 |
| RISK-CSA-5 | L | M | YAML indentation 실수 → silent parse 오류 | ajv strict mode + line-precise error + lint pre-commit |
| RISK-CSA-6 | H | L | Innovation token 과사용 — boring-by-default 위반? | attrs schema = JSON Schema + YAML — 둘 다 boring industry standard. innovation token 0/3 hold. ADR-12 명시 |
| RISK-CSA-7 | M | M | SCOPE EXPANSION 30-40h 추정 underestimate (실 40-60h 가능) | M-CSA은 core milestone 후 ordered — shipping schedule 보호 |

attrs block per RISK-CSA:

<!-- specrail:attrs id=RISK-CSA-1 -->
```yaml
severity: high
probability: medium
mitigation: "T-CSA.6 manual review · idempotent codemod · git diff review · status:legacy 보수적 자동 채움"
linked-arch: [ARCH-15]
linked-nfr: [NFR-CSA-PERF-3]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

(RISK-CSA-2~7 동형 — codemod scaffolding from §3.1 표.)

### 3.2 MODIFIED 기존 RISK-1~10 — codemod attrs

RISK-tier attrs template:

```yaml
severity: <L|M|H>
probability: <L|M|H>
mitigation: <existing prose>
linked-arch: [...]
linked-nfr: [...]
last-modified: 2026-05-15
```

codemod이 §B Part B의 10 RISK 표를 oracle로 attrs scaffolding.

---

## 4. Impact (Phase 12 차원)

| 차원 | 변화 |
|---|---|
| 신규 ADR | 5 (ADR-12~16) |
| 기존 ADR attrs | 11 (codemod) |
| 신규 RISK | 7 (RISK-CSA-1~7) |
| 기존 RISK attrs | 10 (codemod) |
| Innovation token | 0/3 hold (RISK-CSA-6 명시) |

---

## 5. Open Questions (Phase 12 차원)

신규 0건. proposal·earlier phase OQ 모두 resolution 단계.

---

## 6. Self-Check (Phase 12 DELTA용)

| Check | 결과 |
|---|---|
| ADR-12~16 ID 충돌 | ✓ live ADR-1~11만 (`grep -oE "ADR-[0-9]+" 12-adr-risks.md | sort -V -u` empirical) |
| RISK-CSA-1~7 ID 충돌 | ✓ live RISK-1~10만. CSA suffix로 distinct |
| 각 ADR `decision`·`consequences`·`alternatives-considered` 필수 field (proposal §5) | ✓ |
| INV-7 (ADR alternatives ≥ 2 + 거절 이유) compliance | ✓ 5 ADR 모두 ≥ 2 alternatives + 명시 거절 이유 (verifier 후속 catch — ADR-14에 두 번째 alternative `Per-file frontmatter array` 추가) |
| `linked-arch`·`linked-r`·`linked-nfr` proposal §5 ADR-* / RISK-* row optional | ✓ |
| Innovation token check | ✓ ADR-12·14·15·16 모두 industry-standard (JSON Schema, HTML comment, multi-repo, closed enum). ADR-13 semver — boring. 0/3 hold |
| Mode tag | SCOPE EXPANSION 단일 |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |

---

## 7. Lifecycle

```
Phase 12 delta: Proposed
  ↓ verifier batch checkpoint (12·13 final)
Approved (final batch)
  ↓
다음 → Phase 13 delta + tasks.md
```
