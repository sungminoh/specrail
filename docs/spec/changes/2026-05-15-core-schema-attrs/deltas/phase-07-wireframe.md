---
phase: 7
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint (APPROVE)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 6 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 6 delta (P-CC.zones placeholder + ZN-CC-{N}-{M} reference)"
  - "docs/spec/07-wireframe.md (single W-CC-pattern, 6 zones Z1~Z6, 8 elements E-CC-1~8)"
  - "proposal.md §6 Phase 7 (W-WEB-* dashboard wireframe 본 delta scope 외 — 별 repo)"
target-version: "docs/spec/07-wireframe.md (post-merge)"
batch: "Phase 6·7·8 verifier-checkpoint batch"
---

# Phase 7 DELTA: Wireframe changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1~6 Approved/in batch.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode (re-confirmed at Phase 7) | **SCOPE EXPANSION** |
| Scope note | dashboard `W-WEB-*` 패턴은 별 repo. core repo는 W-CC-pattern + variations만 다룸. |
| Phase 7 특수성 | single wireframe pattern (`W-CC-pattern`) with 15 P-CC inheritance — multi-wireframe phase보다 ZN enumeration이 단순. |
| 자체 리뷰 면책 | verifier batch checkpoint 예정. |

---

## 1. Why (Phase 7 specific)

1. **W-CC-pattern attrs 부재** — dashboard "wireframe viewer with zone hotspots" view 위해 zone enumeration의 machine-extractability 필요.
2. **Z1~Z6 → ZN-CC-PAT-1~6 ID formalization** — 기존 `Z1`·`Z2`...는 visual label이지 ID 아님. `ZN-CC-PAT-N` 으로 정식 ID 부여.
3. **E-CC-1~8 attrs 부착** — element catalog가 dashboard rendering 정보 source 격상.
4. **P-CC.zones field 채움** — Phase 6 delta §2.1.1이 `zones: []` placeholder. 본 phase에서 15 P-CC × 6 zones inheritance 명시.

---

## 2. What Changes

### 2.1 ADDED W-CC-pattern attrs block

```markdown
# W-CC-pattern: Claude Code 응답 표준 zone
```

<!-- specrail:attrs id=W-CC-pattern -->
```yaml
status: Approved
surface: cli
inherits-from: []     # 본 pattern이 base
inherited-by: [P-CC-1, P-CC-2, P-CC-3, P-CC-4, P-CC-5, P-CC-6, P-CC-7, P-CC-8, P-CC-9, P-CC-10, P-CC-11, P-CC-12, P-CC-13, P-CC-14, P-CC-15]  # scalar metadata
zone-count: 6
element-count: 8
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

> **`inherited-by` field:** scalar metadata, `linked-*` prefix 회피 (closed enum 충돌 방지, Phase 5·6 패턴 일관).

### 2.2 ADDED Zone IDs — Z1~Z6 → ZN-CC-PAT-1~6 rename + attrs

기존 `[Z1: Phase Header]`·`[Z2: Inputs Received]`...`[Z6: Next Step Prompt]` 표기는 visual label로 유지하되 옆에 ID 병기:

```text
┌────────────────────────────────────────────────────────┐
│ [Z1 · ZN-CC-PAT-1: Phase Header]                    │
...
```

각 zone에 attrs block (Layout block 직후 별 §"Zones" 절 신설):

```markdown
## Zones (DELTA core-schema-attrs)
```

<!-- specrail:attrs id=ZN-CC-PAT-1 -->
```yaml
status: Approved
page: W-CC-pattern
visible-to-state: [Phase.Draft, Phase.Proposed, Phase.Approved]   # SM-Phase-Lifecycle 인용
purpose: "Phase Header — phase 번호·이름·mode·status"
cta-target: null
mapped-element: E-CC-1
zone-order: 1
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

(ZN-CC-PAT-2~6 동형. 아래 §2.2.1 parameter table.)

#### 2.2.1 Zone parameter table

| Zone ID | visual label | purpose | mapped-element | cta-target |
|---|---|---|---|---|
| ZN-CC-PAT-1 | Z1 | Phase Header | E-CC-1 | — |
| ZN-CC-PAT-2 | Z2 | Inputs Received | E-CC-4 | — |
| ZN-CC-PAT-3 | Z3 | Output draft (markdown body) | E-CC-5 | — |
| ZN-CC-PAT-4 | Z4 | Self-Check 결과 | E-CC-6 | — |
| ZN-CC-PAT-5 | Z5 | Markdown 검토 가이드 (file path + GitHub/VS Code) | E-CC-7 | "open IDE / GitHub" |
| ZN-CC-PAT-6 | Z6 | Next Step Prompt (HARD-GATE) | E-CC-8 | "approve / 수정 요청" |

### 2.3 ADDED Element attrs — E-CC-1~8

각 E-CC heading + attrs block. Element catalog 표(`07-wireframe.md:65-78`)는 그대로 유지 (가독성), 표 직후 attrs batch block (Phase 5 marker family 재사용 — OQ-5-CSA-1 미해결 가운데 동일 marker 사용).

```markdown
## Element Spec (attrs)

<!-- specrail:attrs-batch entityKind=E-CC -->
- id: E-CC-1
  status: Approved
  kind: header
  source-data: "ENT-Phase.id, .name"
  parent-zone: ZN-CC-PAT-1
  last-modified: 2026-05-15
- id: E-CC-2
  status: Approved
  kind: indicator
  source-data: "ENT-Phase.mode (PRD §10)"
  parent-zone: ZN-CC-PAT-1
  last-modified: 2026-05-15
- id: E-CC-3
  status: Approved
  kind: status-indicator
  source-data: "SM-Phase + SM-Hook"
  parent-zone: ZN-CC-PAT-1
  last-modified: 2026-05-15
- id: E-CC-4
  status: Approved
  kind: list
  source-data: "이전 phase frontmatter parsed (F1.2)"
  parent-zone: ZN-CC-PAT-2
  last-modified: 2026-05-15
- id: E-CC-5
  status: Approved
  kind: markdown-body
  source-data: "LLM 생성 per phase"
  parent-zone: ZN-CC-PAT-3
  last-modified: 2026-05-15
- id: E-CC-6
  status: Approved
  kind: check-list
  source-data: "grep + frontmatter validation (F2.1, F2.3, F2.4)"
  parent-zone: ZN-CC-PAT-4
  last-modified: 2026-05-15
- id: E-CC-7
  status: Approved
  kind: prose
  source-data: "static (file path + GitHub/VS Code 안내)"
  parent-zone: ZN-CC-PAT-5
  last-modified: 2026-05-15
- id: E-CC-8
  status: Approved
  kind: gate-prompt
  source-data: "F5.4"
  parent-zone: ZN-CC-PAT-6
  last-modified: 2026-05-15
<!-- /specrail:attrs-batch -->
```

### 2.4 MODIFIED P-CC inheritance — 15 P-CC × zones 일괄 채움

Phase 6 delta §2.1.1 `zones: []` placeholder를 본 phase 머지 시 codemod이 다음으로 채움:

```yaml
zones: [ZN-CC-PAT-1, ZN-CC-PAT-2, ZN-CC-PAT-3, ZN-CC-PAT-4, ZN-CC-PAT-5, ZN-CC-PAT-6]
```

15 P-CC 모두 동일 6 zone 상속 (W-CC-pattern 단일 wireframe 기반). dashboard "wireframe viewer with hotspots"가 P-CC-N 클릭 시 6 zone 위 hotspot overlay.

### 2.5 ADDED §11 신설: Zone ID family registration (OQ-6-CSA-1 resolution proposal)

```markdown
## 11. Zone ID family

format: `ZN-CC-{wireframe-name}-{N}` where N = zone-order within that wireframe.

current registrations: `ZN-CC-PAT-1` through `ZN-CC-PAT-6` (W-CC-pattern, 6 zones).

inheritance: P-CC-* page는 W-CC-pattern을 inherit하므로 6 zones 모두 상속.

규칙: zone-order는 1-based, gap 금지. zone 추가 시 마지막 N+1로 append.
```

OQ-6-CSA-1(zone ID family 등록 위치) → Phase 4 INV-13 vs Phase 8 ARCH 결정 잠정 보류. 본 절은 *convention*만 명시, INV 등록은 별 phase. mark resolution-recommendation: **Phase 4 INV-13에 정식 등록 권장** (entity invariant 카테고리에 부합, ARCH는 system-level 추상도라 부적합).

---

## 3. Impact (Phase 7 차원)

| 차원 | 변화 |
|---|---|
| Wireframe count | 1 (W-CC-pattern, 불변, W-WEB-* 별 repo) |
| Zone IDs 신규 | 6 (ZN-CC-PAT-1~6) |
| Element attrs | 8 (E-CC-1~8 batch) |
| P-CC inheritance | 15 × 6 = 90 zones reference (P-CC.zones 채움) |
| §11 신설 | Zone ID convention |
| 의미 변화 | 0 (Z1~Z6 visual label 유지, ID 병기) |

---

## 4. Open Questions (Phase 7 차원)

**OQ-7-CSA-1 (Non-Blocking):** `inherited-by` (W-CC-pattern attrs) ↔ `parent-pattern` (P-CC attrs) bidirectional reference — 한쪽만 source-of-truth로 두고 dashboard reverse-index? 결정자: maintainer. 마감: T-CSA.5 codemod 구현 전. (현재 양쪽 명시는 redundant이지만 grep ergonomics에서 유리.)

**OQ-7-CSA-2 (Non-Blocking):** `<!-- specrail:attrs-batch -->` marker formal 등록 (OQ-5-CSA-1·Phase 7 추가 사용). 본 phase가 두 번째 사용 case — single-use OQ가 multi-use로 격상되었으므로 Phase 4 INV 정식화 우선순위 ↑.

---

## 5. Self-Check (Phase 7 DELTA용)

| Check | 결과 |
|---|---|
| W-CC-pattern attrs block + 6 zone + 8 element | ✓ §2.1·§2.2·§2.3 |
| ZN-CC-PAT-N regex floor (`[A-Z][A-Z0-9]+-\d+`) | ✓ `ZN` 2-char prefix satisfies floor |
| E-CC-N regex floor | **verifier 지적 해소:** `E-CC-N`·`P-CC-N`·`ZN-CC-*`는 현재 `ID_PATTERN_SOURCE`·`USER_NAMESPACE_PATTERN` 어디에도 매치 안 됨 (단문자 `E`·`P`는 2+ char floor 미달). audit doc의 user-namespace-match 인용은 부정확. **T-CSA.3가 명시적으로 `E-CC-\d+`·`P-CC-\d+`·`ZN-CC-[A-Z0-9-]+-\d+` 3 family를 `ID_PATTERN_SOURCE`에 등록 의무.** (Phase 3 delta §2.2.4의 R-CSA dependency와 동형.) |
| dashboard W-WEB-* scope 제외 | ✓ §0 명시 |
| `linked-*` prefix 사용 with non-enum source | 0 (`inherited-by`·`zones`·`mapped-element` 모두 scalar metadata) |
| Edge kind enum 위반 | 0 |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |
| Mode tag | SCOPE EXPANSION 단일 |
| Mermaid diagram (Phase 7 wireframe phase에 mandatory?) | wireframe phase는 layout text + state diagram이 충분 — Phase 7 skill body가 mandatory mermaid 미요구 (mermaid는 Phase 4·5·8 의무). pass. |
| Codemod oracle 의무 (Phase 6 P-CC.zones 채움) | ✓ §2.4 |
| ZN-CC-PAT-N · E-CC-N attrs 표시 | wrapper form `<!-- specrail:attrs id=X -->` 또는 `<!-- specrail:attrs-batch -->` (OQ-7-CSA-2 명시) |

---

## 6. Lifecycle

```
Phase 7 delta: Proposed
  ↓ verifier batch checkpoint (6·7·8)
Approved (batch)
  ↓
다음 → Phase 8 delta (Architecture — ARCH/EXT attrs + 신규 schema container)
```
