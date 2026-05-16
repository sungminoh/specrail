---
phase: 1
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com)
mode: SCOPE EXPANSION
inherited-mode: yes (proposal-level commit re-confirmed at Phase 1)
date: 2026-05-15
inputs:
  - "proposal.md §6 Phase 1"
  - "docs/research/2026-05-15-markdown-audit.md"
  - "docs/research/2026-05-15-csa-blocking-oq-decisions.md"
  - "docs/spec/01-prd.md (Version 1.1)"
target-version: "docs/spec/01-prd.md Version 1.2 (post-merge)"
---

# Phase 1 DELTA: PRD changes for `core-schema-attrs`

> Strategy doc: `../proposal.md` (Approved 2026-05-15).
> 본 file = PRD에만 적용되는 변경분. Approved 후 `docs/spec/01-prd.md` v1.2로 머지.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode (re-confirmed at Phase 1) | **SCOPE EXPANSION** — proposal mode 상속, silent drift 없음 |
| Phase 0 Reframing | **Skipped** (phase-01 SKILL.md Escape Hatch — "사용자가 이미 검증된 plan 줬을 때만"). 본 변경은 audit + Blocking OQ first-principles 분석 통과한 schema migration. 6 forcing questions는 new-product framing용. |
| 자체 리뷰 면책 | 작성자 = 동일 AI session. self-check 맹점 가능. 별 reviewer lane(verifier·critic) 권장. |
| Section ref 정정 | proposal §6 "Phase 1 — MODIFIED §10"은 *오류* — 현 01-prd.md §10은 "Mode 결정 근거"이고, dashboard line은 §6 (Non-Goals). 본 delta가 정정. |

---

## 1. Why (Phase 1 specific)

PRD가 capability `core-schema-attrs`를 dogfood하려면:

1. **§6 Non-Goals — dashboard line 의미 명확화.** "별 cycle"은 본 plugin 안에서 미해석 → 사용자 혼동 + 이전 spec-visualizer proposal 같은 잘못된 reverse 시도 유발. "별 cycle = 별 repo `specrail/dashboard`"로 명시 재해석. PRD §10(2026-05-12) Mode 결정 보존.
2. **§7 KPI — schema dogfood.** attrs block을 KPI row에 직접 부착해 본 plugin spec이 자기 schema를 첫 사용자.
3. **§7 KPI — 신규 KPI-7 추가.** schema attrs coverage를 측정 가능한 KPI로 등재 (audit verdict "45-55%" → 추적가능한 지표화).
4. **§12 신설 — Schema commitment.** attrs block 의무 + v0.5.0 ERROR cut 시점을 PRD 차원에 못 박음. 향후 phase·plugin code가 인용할 anchor.
5. **§13 신설 — Repo layout.** specrail/core + specrail/dashboard (companion, optional) 명시.

---

## 2. What Changes

### 2.1 MODIFIED §6 Non-Goals

**Before** (`01-prd.md:90`):
```markdown
- ❌ **Local web dashboard** — 별 cycle. plugin의 frontmatter schema는 미래 dashboard 호환 design만 보장.
```

**After:**
```markdown
- ❌ **Local web dashboard product 자체** — 별 repo `specrail/dashboard` (companion, optional). plugin은 frontmatter + `<!-- specrail:attrs -->` schema·`schemas/attrs.schema.json` 공개 contract로 data source 역할만. dashboard 코드·UX·릴리스는 본 repo scope 외. PRD §10 (2026-05-12) Mode 결정 보존 — "별 cycle"의 구체화일 뿐 reverse 아님.
```

### 2.2 MODIFIED §7 KPI 표 — 모든 row에 attrs block 부착 + KPI-7 추가

**Before** (`01-prd.md:101-107`): plain table only.

**After:** 각 KPI row 직후 attrs block (dogfood §3.4 schema). 신규 KPI-7 추가.

```markdown
| KPI-1 | plugin install 후 첫 spec 완주율 | % | 80% | 출시 6개월 |
```
<!-- specrail:attrs id=KPI-1 -->
```yaml
target: 80
unit: percent
measure-when: 출시 6개월
linked-r: [R6]
status: Approved
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

```markdown
| KPI-2 | 환각 ID 발생 (정의 안 된 ID 인용) | per session | 0 | hook 통과 시 자동 0 |
```
<!-- specrail:attrs id=KPI-2 -->
```yaml
target: 0
unit: per-session
measure-when: hook 통과 시 자동
linked-r: [R2]
status: Approved
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

(KPI-3·4·6 동형 — `01-prd.md:104-106` 각 row에 attrs block 부착. 머지 시 codemod scaffolding.)

**ADDED KPI-7 (신규):**
```markdown
| KPI-7 | First-class entity의 attrs block coverage | % | 100% (post-migration) · ≥80% (사용자 in-progress spec) | hook (per phase status=Approved transition) |
```
<!-- specrail:attrs id=KPI-7 -->
```yaml
target: 100
target-secondary: 80
unit: percent
measure-when: phase status=Approved transition (state machine gate)
linked-r: [R-CSA]  # Phase 3에서 신규 R 할당 예정
linked-arch: []     # Phase 8에서 채움
status: Approved
last-modified: 2026-05-15
note: "audit verdict 45-55%를 measurable KPI로 promote. 100% post-migration은 maintainer dogfood spec 기준. 80% secondary는 외부 사용자 in-progress spec 기준."
```
<!-- /specrail:attrs -->

### 2.3 MODIFIED §8 Assumptions — A6 추가

```markdown
| A6 | fenced YAML in markdown HTML-comment block(`<!-- specrail:attrs -->` family)이 GitHub·VS Code·Obsidian 등 주류 markdown renderer에서 렌더 결과·copy/paste 동작 깨지지 않음 | manual smoke test on 5 renderers (T-CSA.1 RED test) | Med |
```

### 2.4 ADDED §12 Schema Commitment (신설 절)

```markdown
## 12. Schema Commitment

본 plugin의 모든 first-class entity (R·F·S·ENT·INV·NFR·ARCH·EXT·OPS·ADR·RISK·TC·EDGE·OQ·KPI·T·PERSONA·SCEN·JNY·ZN·P-CC)는 정의 heading 직후 `<!-- specrail:attrs id=X -->` + fenced YAML attrs block을 갖는다.

- **Release ordering (OQ-CSA-7 Resolved 2026-05-15):** **0.1.0 = M0~M11 ships first (current code state, attrs schema 미포함).** M-CSA schema migration = **0.2.0**. RISK-CSA-7 ordering 일관. 이전 "v0.1.0 = 본 release" 표현은 spec-aspiration이었고, ship 시점 결정은 별도 — OQ-CSA-7 resolution이 정정.
- **Lifecycle (post-0.2.0):** v0.2.0~v0.4.0 lint WARN (with `specrail migrate --fix` 제안). v0.5.0부터 ERROR. (legacy `S\d` → `SCEN-N` dual-parse window와 동기화.)
- **공개 contract:** `schemas/attrs.schema.json` (JSON Schema draft 2020-12) — npm `specrail` + GitHub raw URL 양쪽 published. 별 repo `specrail/dashboard`·third-party tool이 이 schema에 의존.
- **Edge kind enum:** closed 8 kinds (`solves`·`linked-features`·`parent`·`tested-by`·`covers-ac`·`mitigates`·`linked-arch`·`depends-on`), frozen at v0.1.0. 추가는 ADR 경유 minor schema-version bump.
- **Codemod 미해결 conflict:** `<!-- specrail:attrs-review-required reason="..." -->` marker → WARN window 무관 lint ERROR. 해소는 attrs 보정 + marker 제거 또는 `specrail audit --accept-codemod-conflict`.
- **Surface 강제:** phase status=Approved 전환에 모든 first-class entity의 attrs presence 요구 (HARD-GATE 강화, INV-3 확장).

Capability detail: `docs/spec/changes/2026-05-15-core-schema-attrs/proposal.md`. Schema 자체: `schemas/attrs.schema.json` (post-merge).
```

### 2.5 ADDED §13 Repo Layout (신설 절)

```markdown
## 13. Repo Layout

| Repo | 역할 | Surface | npm package |
|---|---|---|---|
| **`specrail/core`** (이 repo) | 13-phase spec discipline plugin · skills + hooks + builders · attrs schema 공개 contract | Claude Code session (terminal text) | `specrail` |
| **`specrail/dashboard`** (별 repo, optional, companion) | product-grade webapp visualizer — manyfast.io class — atom/molecule design system + cross-ref graph + flow viewer + diff. core repo의 attrs schema에 종속. 자기 자신을 별 cycle로 13-phase 사양화. | Local Next.js (post-`specrail/dashboard` ship) | not-yet-published (dashboard repo 시작 시 명명 — OQ-CSA-9 참조) |

PRD §10 Mode 결정(2026-05-12 dashboard 별 cycle)은 그대로. 본 §13은 "별 cycle"의 구체화 — repo 분리로 lifecycle·릴리스 독립.

dashboard repo가 core schema 변경에 어떻게 sync — npm vs git submodule vs raw GH URL — = OQ-CSA-9 (non-blocking, dashboard repo 시작 시 결정).
```

### 2.6 MODIFIED §10 Mode 결정 근거 (append)

**Append:**
```markdown
**DELTA `core-schema-attrs` (2026-05-15):** Mode **SCOPE EXPANSION** — proposal §1.3 근거 상속 (+25h로 schema 도입·data contract·migration tool·skill teach·validator·telemetry까지 통합 → plugin core를 product 단계 격상). silent drift 없음. Phase 1 level re-confirm.
```

### 2.7 MODIFIED §11 다음 phase 인풋 (append)

**Append:**
```markdown
**DELTA core-schema-attrs 입력 (Phase 2~13 누적):**
- Phase 2: PERSONA-1 (Builder) ID family 정식화 · SCEN-1·SCEN-2·SCEN-3 (기존 S1·S2·S3 rename) · JNY-N journey step ID 부여
- Phase 3: R-CSA (신규 requirement: "all first-class entities carry attrs blocks") + AC-R-CSA-*
- Phase 4: ENT-AttrsBlock · ENT-EdgeKind · INV-{N} (attrs presence on Approved phase)
- Phase 5: FLN-N·FLE-N rename + attrs blocks
- Phase 6~7: ZN-*-N zone ID 부여 + attrs
- Phase 8: ARCH-{N} attrs schema container · EXT-{N} schema-version contract
- Phase 9: NFR-VIZ-* (audit doc 인용 schema coverage perf NFR)
- Phase 10: TC-{N} for attrs parser·codemod·typed edge builder
- Phase 11: OPS-{N} schema-version telemetry endpoint
- Phase 12: ADR-{N} attrs schema as architectural contract · RISK-CSA-*
- Phase 13: M-CSA milestone T-CSA.1~16 (proposal §8)
```

---

## 3. Impact (Phase 1 차원)

| 차원 | 변화 |
|---|---|
| Persona | Phase 2에서 ID화 (PERSONA-1). Phase 1 §3.1 prose 그대로. |
| Role | 변경 없음 — single-user 유지. |
| Non-Goals | §6 dashboard line 의미 명확화 (reverse 아님). 다른 Non-Goal 변경 없음. |
| KPI | KPI-7 신규. KPI-1·2·3·4·6 row에 attrs block. KPI-5 (dashboard cycle 이동) 그대로. |
| Assumptions | A6 신규 (renderer compat). |
| Open Questions | OQ-1-1~5 그대로. proposal §10 Non-Blocking OQ (OQ-CSA-4·6·7·9)는 PRD scope에 영향 없음. |
| 다음 phase | 13 phase 전부 affected (proposal §6 outline). 본 delta는 Phase 1만 정식 산출. |

---

## 4. Open Questions (Phase 1 차원, 신규 없음)

이 delta는 신규 Phase 1 OQ 발생시키지 않음. proposal §10의 Non-Blocking OQ 중 Phase 1 영향 가능 항목:

- **OQ-CSA-7 (semver 0.1.0 vs 0.2.0):** **Resolved 2026-05-15** — 0.1.0 = M0~M11 only (현 code), 0.2.0 = M-CSA. PRD §12 wording 정정 적용.
- **OQ-CSA-9 (dashboard schema fetch 방식):** §13 Repo Layout에 footnote로 reference. dashboard repo 시작 시 결정. **Blocking? N.**

Phase 1 delta 머지를 위한 추가 OQ resolution은 불필요.

---

## 5. Self-Check (Phase 1 DELTA용)

| Check | 결과 |
|---|---|
| §6 dashboard line wording이 PRD §10 (2026-05-12) Mode 결정과 모순 없음 | ✓ "별 cycle = 별 repo" 명시 — reverse 아니라 구체화 |
| §12·§13 신설 절이 기존 §1~§11 numbering과 충돌 없음 | ✓ 현 01-prd.md §11이 마지막. §12·§13으로 append |
| §7 KPI row attrs block이 §3.4 edge kind enum 위반 없음 | ✓ `linked-r` field는 `linked-features` register와 일관 (plural-noun YAML field) |
| §8 A6 검증 방법 명시 | ✓ "manual smoke test on 5 renderers (T-CSA.1 RED test)" |
| `grep -E "여러 (가지|방법|관점)|고려해볼|살펴볼"` (약한 표현) | 0 (검증 hook으로 별도 실행) |
| `grep -iE "TBD\|TODO\|implement later\|handle edge cases"` (placeholder) | 0 |
| Mode tag 단일 | `SCOPE EXPANSION` 단일 표기 (re-confirmed) |
| Non-Goals 5+ | §6 그대로 유지 (count unchanged at 5+) |
| Persona 카테고리 아닌 1명 | §3.1 Builder 그대로 (Phase 2에서 PERSONA-1 ID화) |
| First-Principles Insight | §4.3 그대로 유지 (DELTA가 §4 본문 안 건드림) |
| KPI 측정 단위·목표·시점 | KPI-7 명시 — target 100 percent post-migration, unit percent, measure-when phase status transition; verified by Phase 4 INV-3 (state machine gate) |
| Open Questions Blocking 표시 | §4에서 OQ-CSA-7·9 명시 Blocking=N |
| 자기 자신을 schema로 dogfood | ✓ KPI-7 row attrs block이 본 delta 안에서 실제 example로 작동 |

---

## 6. Lifecycle

```
Phase 1 delta: Proposed (현재)
  ↓ HARD-GATE (사용자 명시 Approve)
Approved
  ↓
다음 → Phase 2 delta prompt (deltas/phase-02-personas-journey.md)
```

`docs/spec/01-prd.md` v1.2 머지는 모든 13 phase delta Approved + tasks.md Approved 이후 (proposal lifecycle Implementing → Applied 단계).

**Approver action:** "Approve Phase 1 delta" 명시 발화 또는 본 file frontmatter `status: Approved` 변경.
