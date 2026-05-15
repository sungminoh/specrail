---
phase: 6
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint (APPROVE)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 5 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 5 delta (FLN ↔ JNY mapping)"
  - "docs/spec/06-information-architecture.md (current — 15 P-CC pages)"
  - "proposal.md §6 Phase 6 (P-WEB-* dashboard 페이지 본 delta scope 외 — 별 repo)"
target-version: "docs/spec/06-information-architecture.md (post-merge)"
batch: "Phase 6·7·8 verifier-checkpoint batch"
---

# Phase 6 DELTA: Information Architecture changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1~5 Approved.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode (re-confirmed at Phase 6) | **SCOPE EXPANSION** |
| Scope note | dashboard `P-WEB-*` 페이지(proposal §6 Phase 6에 outline)는 **본 delta scope 외** — 별 repo `specrail/dashboard`의 자체 Phase 6에서 작성. core repo는 P-CC-* (Claude Code surface)만 다룸. |
| 자체 리뷰 면책 | verifier batch checkpoint 예정. |

---

## 1. Why (Phase 6 specific)

1. **15 P-CC 페이지 attrs 부재** — dashboard "Phase Overview Cards" view가 page status·persona linkage 필요 (audit §3.1). 현 P-CC-* row는 `Page ID|이름|Phase 5 Node|Trigger|깊이` 5 column. attrs로 확장.
2. **ZN-CC-{NAME}-N zone ID 도입 준비** — Phase 6는 IA, Phase 7은 wireframe. ZN-* 실 enumeration은 Phase 7 wireframe delta에서. Phase 6에는 P-CC 별 `zones` attrs field를 *placeholder list*로 두고 Phase 7 머지 시 채움 (15 P-CC 모두 동일 `[ZN-CC-PAT-1..6]` 6-zone 상속). ID family 자체는 Phase 4 INV-13 정식 정의 시 등록 (OQ-6-CSA-1).

---

## 2. What Changes

### 2.1 MODIFIED P-CC-1~15 — codemod-generated attrs (documented contract)

#### 2.1.1 P-CC attrs template

```yaml
status: Approved
surface: cli                  # all P-CC: cli (terminal session)
trigger: <prose phrase>       # parameter (per page)
parent-section: SEC-{N}       # parameter (Phase 5 section mapping)
flow-node: FLN-{N}            # scalar metadata (NOT linked-* — closed enum 충돌 방지, Phase 5 패턴 일관)
features: [F-R{N}.{M}, ...]   # scalar metadata, plural — P-CC가 multi feature serve
zones: []                     # scalar metadata — Phase 7 wireframe ZN-CC-PAT-N 부여 후 채움
last-modified: 2026-05-15
```

> **Naming convention (Phase 5·6 일관):** P-CC·FLN entity는 §3.4 closed enum의 source 카테고리에 없음. 따라서 typed edge(`linked-*` prefix) 명명 거절 — scalar metadata로 통일. Phase 8 ADR 확장 결정 시 typed edge 승격 가능 (OQ-5-CSA-3과 동일 family).

#### 2.1.2 P-CC parameter table (15 pages, current `06-information-architecture.md:22-36`)

| Page | trigger | parent-section | flow-node | features |
|---|---|---|---|---|
| P-CC-1 | "GitHub URL 또는 Claude Code marketplace" | SEC-1 | FLN-2 | `[F-R6.1]` |
| P-CC-2 | "install 직후 자동 출력" | SEC-1 | FLN-6 | `[F-R6.2]` |
| P-CC-3 | "/specrail init 또는 trigger phrase" | SEC-2 | FLN-11 | `[F-R6.4, F-R5.1]` |
| P-CC-4 | "skill chain 자동 (13 phase 동일 layout)" | SEC-2 | FLN-14 | `[F-R1.1, F-R5.1]` |
| P-CC-5 | "git commit 시 자동" | SEC-2 | FLN-19 | `[F-R2.1, F-R2.3, F-R2.4]` |
| P-CC-6 | "사용자 approve 명령" | SEC-2 | FLN-22 | `[F-R5.3, F-R2.2]` |
| P-CC-7 | "/specrail change \"<topic>\"" | SEC-3 | FLN-32 | `[F-R4.1, F-R4.2, F-R4.3]` |
| P-CC-8 | "DELTA 진행 중 영향 phase 별" | SEC-3 | FLN-35 | `[F-R4.3]` |
| P-CC-9 | "자동 — Approved → Applied" | SEC-3 | FLN-39 | `[F-R4.3]` |
| P-CC-10 | "Phase 13 후 자동 또는 명령" | SEC-4 | FLN-42 | `[F-R8.1, F-R8.2]` |
| P-CC-11 | "task별 자동" | SEC-4 | FLN-46 | `[F-R8.3]` |
| P-CC-12 | "task별 자동" | SEC-4 | FLN-47 | `[F-R8.3]` |
| P-CC-13 | "자동 — implementation 완료" | SEC-4 | FLN-51 | `[F-R8.1]` |
| P-CC-14 | "install 첫 사용" | SEC-6 | FLN-71 | `[F-R13.x]` |
| P-CC-15 | "subagent 막힘 시" | SEC-4 | FLN-49 | `[F-R8.2]` |

> **FLN reference 정합성:** 위 FLN ID는 Phase 5 delta rename(N-NNN → FLN-N) 후 정합. Phase 5 oracle CSV(`migrations/2026-05-15-flow-rename.csv`) row의 `new_id` column이 본 표의 ground truth. 머지 순서: Phase 5 codemod 먼저 → Phase 6 codemod이 본 표 검증.

#### 2.1.3 머지 wrapper form 의무

각 P-CC heading 직후 canonical `<!-- specrail:attrs id=P-CC-N -->` ... `<!-- /specrail:attrs -->` wrapper로 부착 (proposal §3.1 컨벤션). bare YAML 금지 (verifier 후속 지적과 일관).

### 2.2 MODIFIED §1 Page Catalog table — column 추가

기존 5 column → 6 column (linked-features 추가). 또는 — column 6 추가가 가독성 깨면 attrs block이 그 정보 carry하므로 표는 그대로 두고 attrs로 위임. **결정: 표 그대로 + attrs로 carry** (proposal §3.4 register 분리 일관).

### 2.3 ADDED §11 신설: Zone ID convention reference

```markdown
## 11. Zone ID convention (DELTA core-schema-attrs)

Phase 7 wireframe delta가 W-CC-pattern (single wireframe inherited by all 15 P-CC) 안의 6 zone에 `ZN-CC-PAT-N` ID enumerate. 본 IA delta는 P-CC attrs `zones` field를 placeholder list로 두고, Phase 7 머지 시 모든 P-CC가 동일 `[ZN-CC-PAT-1..6]` 6-zone list 상속.

format: `ZN-CC-{NAME}-{N}` where NAME = uppercase 식별자 (현재 단일 `PAT` for W-CC-pattern; 미래 W-CC-* variation 추가 시 다른 uppercase alias). N = zone-order 1-based.

> **Naming rule (verifier 지적 해소):** ID 모든 segment는 uppercase (proposal §4.1 regex `ZN-[A-Z0-9-]+-\d+` 일관). lowercase 단어("pattern" 등)는 alias 형식 (`PAT`)으로 변환.

ID family 정식 등록: Phase 4 INV-13 또는 Phase 8 ARCH (OQ-6-CSA-1) — 본 delta는 convention만 명시, INV 등록은 별 phase.
```

### 2.4 MODIFIED §10 다음 phase 인풋 (append)

```markdown
**DELTA core-schema-attrs:**
- Phase 7 — W-CC-pattern의 6 zone에 ZN-CC-PAT-N enumeration + P-CC.zones field (모든 15 P-CC가 `[ZN-CC-PAT-1..6]` 6-zone 상속).
- Phase 8 — ARCH-{N} 신규 schema container + EXT-{N} 신규 public schema contract.
```

---

## 3. Impact (Phase 6 차원)

| 차원 | 변화 |
|---|---|
| Page count | 15 (불변, P-WEB-* 별 repo) |
| attrs blocks | 15 (codemod) |
| 신규 ID family | ZN-CC-PAT-N reference (실 enumeration은 Phase 7 — 6 zone) |
| §11 신설 | Zone convention reference |
| §10 append | 다음 phase 인풋에 Phase 7·8 expectation 추가 |
| Navigation strategy | 0 변경 |
| URL conventions | 0 변경 |

---

## 4. Open Questions (Phase 6 차원)

**OQ-6-CSA-1 (Blocking T-CSA.3):** `ZN-CC-{NAME}-N` (현재 `ZN-CC-PAT-1..6`) pattern을 어디서 정식 등록? Phase 4 INV-13 (audit 권장) vs Phase 8 ARCH spec? 결정자: maintainer. 마감: Phase 7 delta 시작 전 (잠정 resolution Phase 7 §11에 명시 — Phase 4 INV-13 등록 권장).

---

## 5. Self-Check (Phase 6 DELTA용)

| Check | 결과 |
|---|---|
| 15 P-CC attrs parameter table | ✓ 15 row (P-CC-1~15) |
| dashboard P-WEB-* scope 제외 | ✓ §0 명시 |
| Codemod oracle source (Phase 5 CSV) reference | ✓ §2.1.2 footnote |
| ID 충돌 check (live 06-IA spec에 ZN-* 없음) | ✓ `grep -E "ZN-" docs/spec/06-information-architecture.md` empty |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |
| Mode tag | SCOPE EXPANSION 단일 |
| Edge kind enum 위반 (`linked-*` prefix from P-CC source) | ✓ §2.1.1 template에서 `flow-node`·`features`·`zones` scalar 명명 — `linked-*` prefix 회피. Phase 5 패턴(`journey-step`·`feature`) 일관. closed enum 충돌 없음. |
| FLN-N reference 정합 | ✓ Phase 5 oracle CSV `new_id` column이 ground truth. 머지 순서: Phase 5 → Phase 6. |

---

## 6. Lifecycle

```
Phase 6 delta: Proposed
  ↓ verifier batch checkpoint (6·7·8)
Approved (batch)
  ↓
다음 → Phase 7 delta (Wireframe — ZN-CC-* enumeration)
```
