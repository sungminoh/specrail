---
phase: 2
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier mode (3-phase checkpoint)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 1 delta level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 1 delta §2.7 다음 phase 인풋"
  - "docs/spec/02-personas-journey.md (current)"
  - "proposal.md §6 Phase 2"
  - "docs/research/2026-05-15-csa-blocking-oq-decisions.md (OQ-CSA-8 PERSONA-N)"
target-version: "docs/spec/02-personas-journey.md (post-merge)"
---

# Phase 2 DELTA: Personas & Journey changes for `core-schema-attrs`

> Strategy: `../proposal.md` (Approved). Phase 1 delta: `phase-01-prd.md` (Approved).
> 본 file = Personas & Journey 변경분. Approved 후 `docs/spec/02-personas-journey.md`에 머지.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode (re-confirmed at Phase 2) | **SCOPE EXPANSION** — Phase 1 mode 상속. silent drift 없음. |
| Persona·journey 본문 보존 | Yes — semantic 내용 변경 0. **순수 ID 부여 + rename + attrs 부착** (structural migration). |
| 자체 리뷰 면책 | 작성자 = AI session. self-check 맹점 가능. |

---

## 1. Why (Phase 2 specific)

audit verdict + OQ-CSA-8 resolution이 강제하는 3 ID family 정식화:

1. **Primary Persona가 ID 없음** — 현 `02-personas-journey.md:14`의 Builder는 prose only. dashboard "feature-persona linkage" view 불가 (audit §Phase 2). → `PERSONA-1` 부여.
2. **Edge-1·Edge-2·Edge-3** (`02-personas-journey.md:47, 51, 55`) — `Edge-1` 형식은 `USER_NAMESPACE_PATTERN` 2+ uppercase floor 통과는 하나 (E-d-g-e 4 char) regex 통과 후 `parseSpecId`가 다른 family에서 의도 안 한 매치 발생 가능. audit이 `PERSONA-EDGE-N` 명시 권장 (line 508). → rename.
3. **시나리오 `S1`/`S2`/`S3`** — `parseSpecId` (src/spec/id.ts:33) Spec-tier 3-part 요구 → 현재 silently 무시 (audit §1.5). → `SCEN-1/2/3` rename (OQ-CSA-2 resolution과 family는 다르지만 명명 원칙 동일).
4. **Journey step IDs 부재** — `Step-by-Step` 표(line 67·112·136)의 step row가 ID 없음 → dashboard "step-by-step viewer" 데이터 불가능. → `JNY-{scen}.{step}` 부여.
5. **PAIN- ID 형식 불일치** — `PAIN-1..7`은 정상, `PAIN-DELTA-scope`/`PAIN-fundamental`/`PAIN-base`는 `[A-Z][A-Z0-9]+-\d+` 패턴 위반 (suffix가 digit 아님) → silently 무시. → 숫자 ID로 normalize + 원 이름은 `nickname` attrs field에 보존.

---

## 2. What Changes

### 2.1 ADDED Personas — ID formalization

#### PERSONA-1: Builder (기존 Primary Persona Card)

본문 변경 없음. heading 직후 attrs block만 부착.

```markdown
## 1. Primary Persona Card

<!-- specrail:attrs id=PERSONA-1 -->
```
```yaml
alias: Builder
role: "Claude Code 사용자 (solo founder · small team lead · advanced student · 사이드 프로젝트 professional)"
primary-pain: PAIN-3
tech-fluency: 9
daily-context: "데스크톱 작업 (집·사무실·카페) + markdown 검토 (GitHub UI·VS Code preview) + 모바일 메모"
status: Approved
since: 2026-05-10
last-modified: 2026-05-15
```
```markdown
<!-- /specrail:attrs -->

### 기본
(기존 prose 그대로 유지)
```

### 2.2 MODIFIED Personas — Edge-N rename to PERSONA-EDGE-N

3 instances (`02-personas-journey.md:47, 51, 55`):

| Old | New |
|---|---|
| `### Edge-1: Non-developer maker ...` | `### PERSONA-EDGE-1: Non-developer maker ...` |
| `### Edge-2: Multiple parallel projects ...` | `### PERSONA-EDGE-2: Multiple parallel projects ...` |
| `### Edge-3: Brownfield maintainer ...` | `### PERSONA-EDGE-3: Brownfield maintainer ...` |

각 heading 직후 attrs block:

```yaml
# PERSONA-EDGE-1
alias: Non-developer maker
role: "디자이너·PM이 Claude Code로 vibe coding"
primary-pain: PAIN-fundamental  # 후술 normalize 후 PAIN-9
status: Approved
in-scope: yes
last-modified: 2026-05-15
```

```yaml
# PERSONA-EDGE-2
alias: Multi-project parallel user
role: "한 사람이 여러 product 동시 진행"
primary-pain: PAIN-6
status: Deferred (향후 cycle)
in-scope: no
last-modified: 2026-05-15
```

```yaml
# PERSONA-EDGE-3
alias: Brownfield maintainer
role: "기존 레거시 spec 역설계 + 보수 사용자"
primary-pain: PAIN-7
status: Deferred (S3 P1 — 향후 cycle 후보)
in-scope: no
last-modified: 2026-05-15
```

### 2.3 MODIFIED Scenarios — S1/S2/S3 rename to SCEN-1/2/3

| 위치 | Old | New |
|---|---|---|
| §3 heading | `## 3. Journey Map: 시나리오 1 — Greenfield` | `## 3. Journey Map: SCEN-1 — Greenfield` |
| §4 heading | `## 4. Journey Map: 시나리오 2 — DELTA (결제 추가 예시)` | `## 4. Journey Map: SCEN-2 — DELTA (결제 추가 예시)` |
| §5 heading | `## 5. Journey Map: 시나리오 3 — Refactor ...` | `## 5. Journey Map: SCEN-3 — Refactor (P1 — 향후 cycle 후보)` |
| §6 Pain Priority 표 `어느 시나리오` 컬럼 | `S1, S2` etc. | `SCEN-1, SCEN-2` etc. |
| §7 차단 단계 | `- S1 차단: Step N. PAIN-X 해결 필수.` | `- SCEN-1 차단: Step N. PAIN-X 해결 필수.` |

각 SCEN heading 직후 attrs block. 예:

```yaml
# SCEN-1
name: Greenfield
personas: [PERSONA-1]
triggers: "사용자가 새 product spec을 처음부터 시작"
outcome: "13 phase 완주 + docs/spec/ produced"
status: Approved
in-scope: yes
priority: P0
last-modified: 2026-05-15
```

(SCEN-2·SCEN-3 동형. SCEN-3는 `status: Deferred`.)

### 2.4 ADDED Journey Step IDs — JNY-{scen}.{step}

각 Step-by-Step 표의 row에 첫 column ID 추가.

**Before** (§3 line 69-78):
```markdown
| # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
|---|---|---|---|---|---|
| 1 | install·setup | ... | ... | ... | PAIN-base |
| 2 | /specrail init | ... | ... | ... | PAIN-1 |
| 3 | Phase 1 ... | ... | ... | ... | PAIN-fundamental |
...
```

**After:**
```markdown
| # | Step ID | Step | Persona 행동 | 생각 | 감정 | Pain ID |
|---|---|---|---|---|---|---|
| 1 | JNY-1.1 | install·setup | ... | ... | ... | PAIN-10 |
| 2 | JNY-1.2 | /specrail init | ... | ... | ... | PAIN-1 |
| 3 | JNY-1.3 | Phase 1 ... | ... | ... | ... | PAIN-9 |
...
```

표 헤더에 `<!-- specrail:def-list -->` HTML comment 부착 (기존 marker family 재사용 — `src/graph/builder.ts:66` 인식).

JNY ID는 dotted form `JNY-{N}.{M}` — proposal §4 `JNY-N` 단순형보다 scenario-step 2-tier 정밀성이 dashboard step-viewer에 더 유용. **Pattern 확장 요청:** `JNY-\d+\.\d+` (Phase 4 INV에서 정식 정의). Phase 3 schema 표 (proposal §5) `JNY-N` row를 `JNY-{scen}.{step}` 으로 후속 phase에서 정정.

SCEN-1·SCEN-2·SCEN-3 × 6 step ≈ 18 JNY ID. SCEN-3는 잠정 (status=Deferred 상속).

### 2.5 MODIFIED Pain Items — irregular ID normalize

`02-personas-journey.md:155-164` Pain Priority 표 5 컬럼 → 7 컬럼 + attrs block per row.

| Old | New | nickname (보존) |
|---|---|---|
| `PAIN-DELTA-scope` | `PAIN-8` | DELTA-scope |
| `PAIN-fundamental` | `PAIN-9` | fundamental |
| `PAIN-base` | `PAIN-10` | base |

Pain Priority 표 header 변경:

```markdown
| Pain ID | 설명 | 빈도 | 영향도 | 우선 | 어느 시나리오 |
```
→
```markdown
| Pain ID | 설명 | 빈도 | 영향도 | 우선 | 어느 시나리오 | nickname |
```

각 row attrs block은 다음 형식 (예: PAIN-1):
```yaml
# PAIN-1
severity: high
probability: high  # 기존 markdown 사용자 전원
priority: P0
scenarios: [SCEN-1, SCEN-2]
status: Approved
last-modified: 2026-05-15
```

(PAIN-2..7 동형. PAIN-8·9·10는 `nickname` field 추가.)

### 2.6 MODIFIED §8 다음 phase 인풋 (append)

```markdown
**DELTA core-schema-attrs:**
- Phase 3 (Features) — R-CSA 신규 + AC-R-CSA-{m}. 모든 R/F row attrs block.
- Phase 4 (Domain) — JNY pattern 정식 정의 (`JNY-\d+\.\d+`). PERSONA·SCEN·JNY·PAIN entity 정의.
- Phase 5 (User Flow) — JNY와 FLN의 관계 (Journey step ↔ Flow node mapping).
```

### 2.7 ADDED §10 신설: Migration audit (Phase 2 차원)

```markdown
## 10. Migration Audit (DELTA core-schema-attrs)

Migration codemod (T-CSA.5) Phase 2 적용 결과 — 머지 시 채움:
- Personas ID 부여: PERSONA-1 + PERSONA-EDGE-1..3 (4 entities)
- Scenarios rename: S1→SCEN-1·S2→SCEN-2·S3→SCEN-3 (3 entities)
- Journey steps: 18 JNY-* IDs 신규 (SCEN-1·SCEN-2 각 6 · SCEN-3 잠정 6)
- Pain rename: PAIN-DELTA-scope/fundamental/base → PAIN-8/9/10 + nickname 보존
- Cross-ref 자동 rewrite: §6 Pain Priority 표 "어느 시나리오" 컬럼, §7 차단 단계, §8 다음 phase 인풋
- Codemod conflict: 0 expected (Phase 2 본문은 ID·표 컬럼 추가만, 의미 변경 없음)
- Manual review marker: 0 expected
```

---

## 3. Impact (Phase 2 차원)

| 차원 | 변화 |
|---|---|
| Persona 본문 | 0 변경 (의미 보존). ID·attrs만 부착. |
| Edge persona | rename 3건 + attrs. status 명시 (Approved/Deferred). |
| Scenario | rename 3건 + attrs. SCEN-3는 Deferred 표시. |
| Journey step | 신규 ID 18개. step 본문 0 변경. |
| Pain Priority | rename 3건 + attrs 10건. 의미 0 변경. |
| Pain count | 10 (불변. 정규화만). |
| Critical Step·Magic moment | 0 변경. |
| Emotion curve mermaid | 0 변경. |
| §8 다음 phase 인풋 | append. |
| §10 신설 | Migration Audit (머지 후 채움). |

---

## 4. Open Questions (Phase 2 차원)

신규 0건. proposal §10에서 처리.

**Phase 2 관찰 1건 (Non-Blocking):**
- **OQ-2-CSA-1 (Non-Blocking):** `JNY-{scen}.{step}` dotted form은 proposal §4 simple `JNY-N`보다 expressive. Phase 4 entity 정의에서 명시 결정. T-CSA.3·T-CSA.4에 영향 미미. 결정자: maintainer. 마감: Phase 4 delta. 본 delta 머지를 막지 않음.

---

## 5. Self-Check (Phase 2 DELTA용)

| Check | 결과 |
|---|---|
| Persona 1명만 base (PERSONA-1 + edge 3 = 정상) | ✓ |
| 카테고리 단어 (사용자들·개발자들 등) | 0 (본 delta는 ID 부착만, prose 변경 없음) |
| 시나리오 SCEN-1·2·3 attrs block status field | ✓ (Approved / Approved / Deferred) |
| Journey step ID 부여 — SCEN-1·SCEN-2 6 step씩 | 12 + SCEN-3 잠정 6 = 18 |
| PAIN attrs (severity·probability·priority·scenarios) | 10 rows |
| Emotion curve mermaid 보존 | ✓ (변경 없음) |
| Critical Step (make-or-break·magic moment) 보존 | ✓ |
| `grep -iE "TBD\|TODO\|implement later"` (실 placeholder) | 0 |
| Mode tag | `SCOPE EXPANSION` 단일 |
| §10 Migration Audit prefill | "머지 시 채움" 명시, placeholder 아님 |
| dogfood — 자체 schema 사용 | ✓ §2.1 PERSONA-1 attrs block이 본 delta 안 example |
| Cross-ref consistency | §6 Pain Priority의 "어느 시나리오" 컬럼이 SCEN-1·2·3로 일관 rewrite (예시 명시) |

---

## 6. Lifecycle

```
Phase 2 delta: Proposed (현재)
  ↓ HARD-GATE
Approved
  ↓
다음 → Phase 3 delta (Features: R-CSA + AC-R-CSA-*, 모든 R/F row attrs)
```

**Approver action:** "Approve Phase 2 delta" 발화 또는 frontmatter `status: Approved` 전환.
