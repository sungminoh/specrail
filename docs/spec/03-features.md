<!-- v4-plugin-refinement (T2.5c, architect 옵션 B): self-check bash blocks → ARCH-5 schema validator + ARCH-3 hooks 자동 강제. HARD-GATE 수동 승인 step → ADR-8 state machine 자동 enforce. 상대 경로 file 참조 → plugin runtime의 docs/spec/ resolver. v3 원본 prompt는 git tag v3-archive 참조. -->

---
name: phase-3-features
description: Functional Specification. Requirement → Feature → Specification 3-tier with AC, Permission Matrix.
inputs-from: PRD §3 Role, §5 환경, §6 Non-Goals + Phase 2 Pain Priority
trigger-words: features, FS, requirements, acceptance criteria
mode: GREENFIELD | DELTA
---

# Phase 3: Features (Functional Specification)

## Purpose

시스템이 "무엇을" 할 수 있어야 하는지 3계층으로 사양화. 매니패스트 모델 차용.

```
Requirement (R)         — 비즈니스 / 사용자 목표 단위
  ↓
  Feature (F)           — 사용자 가치 단위
    ↓
    Specification (S)   — 구현 가능한 단일 행동
```

## Inputs

- PRD §3 Role
- PRD §5 환경 / 카테고리
- PRD §6 Non-Goals
- Phase 2 §6 Pain Priority 표
- Phase 2 §7 차단 단계
- (DELTA) `current/03-features.md`

<HARD-GATE>
Phase 2 사용자 승인 없이 진행 금지.
</HARD-GATE>

## Mode 상속

- EXPANSION: 추가 Feature surface, 각 expansion은 individual approval
- SELECTIVE: PRD 시나리오 cover하는 R/F만 base. expansion 후보 cherry-pick
- HOLD: PRD 시나리오 cover만. expansion 없음
- REDUCTION: 가장 차단 큰 PAIN만 cover하는 minimum F set

---

## Anti-Sycophancy

00-common 참조 + Phase 3 특화:

**금지:**
- "이런 기능도 추가하면 좋아요"
- "사용자가 이걸 원할 수 있어요"
- "확장성을 위해..."

**대신:**
- 모든 F는 PAIN ID 또는 시나리오 인용 강제
- 정당화 없는 F → 거부 ("어떤 PAIN을 푸는가?" 질문 → 못 답하면 cut)
- AC 모호 → 구체화 강제

---

## Reasoning Procedure

1. PRD §3.3 시나리오 + Phase 2 §6 Pain Priority 받기
2. **Layer 1 검색** — 같은 카테고리 product의 표준 R/F 셋. (예: 어떤 카테고리든 conventional features 존재)
3. R(Requirement) 추출 — 비즈니스 / 사용자 목표 단위
4. 각 R 아래 F(Feature) — 사용자 가치 단위
5. 각 F 아래 S(Specification) — 단일 행동
6. AC를 Requirement 수준에서만 정의 (Feature·Spec 단위 AC 금지 — 중복)
7. Roles는 Feature 수준에서만 정의 (Spec 단위 Role 금지). Single-user product면 Role 섹션 생략.
8. Permission Matrix 생성 (multi-role product인 경우)
9. Importance + Status 모든 단위에 부여
10. Self-Check + 승인

---

## Constraints

1. **3-tier 엄격** — R/F/S 외 다른 계층 금지.
2. **AC는 R 단위만** — F·S 단위 AC 만들면 중복·충돌.
3. **Role은 F 단위만** — S 단위 Role은 너무 미세.
4. **Spec은 단일 행동** — 두 개 동작이면 두 Spec.
5. **모든 F는 PAIN/시나리오 인용** — 정당화 없는 기능 추가 금지.
6. **Importance 4단계** — P0(MVP) / P1(중요) / P2(나중) / P3(언젠가).
7. **Status 4단계** — Draft / Approved / Implementing / Done.
8. **AC는 GIVEN/WHEN/THEN** — testable 형식 강제.
9. **Permission Matrix 필수 (multi-role product)** — Role × Feature.
10. **No Placeholders** — "필요시 검증" 같은 vague AC 금지.

---

## Output Format

````markdown
# Functional Specification

**Mode:** {inherited}
**Inputs:** PRD §3 Role/§5/§6, Phase 2 §6/§7
**Date:** YYYY-MM-DD

## 0. Roles (PRD §3에서 인용)

multi-role product:
| Role ID | 이름 | 권한 요약 |
|---|---|---|
| ROLE-1 | <역할 1> | ... |
| ROLE-2 | <역할 2> | ... |
| ROLE-3 | <역할 3> | ... |

single-user product: "단일 사용자, role 구분 없음" 명시 후 Permission Matrix 섹션 생략.

## R1: <Requirement 제목>

**Description:** <비즈니스 / 사용자 목표 1-2줄>
**해결하는 PAIN:** PAIN-{n}, PAIN-{m}
**해결하는 시나리오:** S1
**Importance:** P0
**Status:** Draft

### Acceptance Criteria (Requirement 수준)

- **AC-R1-1:** GIVEN <전제 상태>, WHEN <행동>, THEN <기대 결과>.
- **AC-R1-2:** GIVEN ..., WHEN ..., THEN ...
- **AC-R1-3:** GIVEN <엣지 조건>, WHEN ..., THEN <적절한 처리>.

### F1.1: <Feature 제목>

**Description:** <사용자 가치 단위 1-2줄>
**Roles:** ROLE-1, ROLE-2 (single-user면 생략)
**Importance:** P0
**Status:** Draft

#### S1.1.1: <Specification 제목>

**Description:** <단일 행동 1줄>
**Importance:** P0
**Status:** Draft

#### S1.1.2: <Specification 제목>

...

### F1.2: <Feature 제목>

...

## R2: <Requirement 제목>

...

## Permission Matrix (multi-role product)

| Feature | ROLE-1 | ROLE-2 | ROLE-3 |
|---|---|---|---|
| F1.1 | ✅ | ✅ | ❌ |
| F1.2 | ✅ | ✅ | ❌ |
| F2.1 | ✅ | 자기 것만 | ❌ |
| F2.2 | ✅ | ✅ | 읽기 |

## Importance × Status 분포

| | Draft | Approved | Implementing | Done |
|---|---|---|---|---|
| P0 | n | 0 | 0 | 0 |
| P1 | n | 0 | 0 | 0 |
| P2 | n | 0 | 0 | 0 |
| P3 | n | 0 | 0 | 0 |

(MVP가 P0 = 모든 시나리오 cover하는지 확인)

## Pain → Spec 매핑 (역추적)

| Pain ID | 해결 Spec | 차단 시나리오 |
|---|---|---|
| PAIN-1 | S{x.y.z}, S{x.y.z} | S1 |
| PAIN-2 | S{x.y.z} | S1, S2 |

## Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-3-1 | <Feature를 MVP에 포함할지> | <역할> | Y |

## 다음 phase 인풋

Phase 4 (Domain Model)에 넘김:
- 모든 R/F/S 목록
- Spec Description의 명사들 (Entity 후보)

Phase 5 (User Flow)에 넘김:
- Spec ID + 이름 (Node 매핑용)

Phase 8 (System Architecture)에 넘김:
- R/F (Container 매핑용)

Phase 10 (Test Strategy)에 넘김:
- 모든 AC (TC 매핑용)

Phase 13 (Implementation)에 넘김:
- P0 Spec 목록 (MVP)
````

---

## DELTA Mode

기존 R/F/S 위에 변경.

### 형식

`changes/{date}-{topic}/deltas/03-features-delta.md`:

````markdown
## ADDED Requirements

### R{n+1}: <new>
- 모든 형식 동일 (AC, F, S)

## MODIFIED Requirements

### R{existing}
- AC 추가: AC-R{n}-N (위에 새로)
- F{existing} (existing): Importance P1 → P0
- Reason: <왜>

## ADDED Features

### F{R}.{F}: <new>
- 어느 existing R 아래에
- AC, Roles, Importance, Status

## ADDED Specifications

### S{R}.{F}.{S}: <new>
- 어느 existing F 아래에

## REMOVED

### S{n}: <removed>
- Reason: <왜>
- Migration: <기존 데이터·기능을 어떻게 처리>

## Permission Matrix Δ

| Feature | Role | Before | After |

## Pain Δ
새 PAIN 또는 해소된 PAIN 명시.
````

DELTA에서도 `current/03-features.md` 그대로 두고 deltas/만 추가. 사용자 승인 후 머지.

---

## Self-Check

```bash
# Spec ID 형식 검증
grep -E "^#### S[0-9]+\.[0-9]+\.[0-9]+" 03-features.md | wc -l

# AC가 Feature/Spec 수준에 있으면 잘못
grep -B2 "Acceptance Criteria" 03-features.md | grep -E "^### F|^#### S"

# Role이 Spec 수준에 있으면 잘못
grep -B2 "Roles:" 03-features.md | grep "^#### S"

# Vague AC 검출
grep -iE "필요시|경우에 따라|적절히|상황에 맞게" 03-features.md

# AC가 GIVEN/WHEN/THEN인가
grep -c "GIVEN" 03-features.md
grep -c "WHEN" 03-features.md
grep -c "THEN" 03-features.md
# 세 숫자가 같아야 함

# Permission Matrix 존재 (multi-role product)
grep "Permission Matrix" 03-features.md

# 모든 F가 PAIN 또는 S{n} 인용
grep -A5 "^### F" 03-features.md | grep -cE "PAIN-|S[0-9]+"
```

체크리스트:
- [ ] R/F/S 3-tier 엄격
- [ ] AC는 R 단위만
- [ ] Role은 F 단위만 (single-user면 생략)
- [ ] 모든 AC가 GIVEN/WHEN/THEN
- [ ] Permission Matrix 채워짐 (multi-role)
- [ ] 모든 F가 PAIN ID 또는 시나리오 인용
- [ ] Importance × Status 분포 확인
- [ ] P0 = MVP scope = PRD 시나리오 cover
- [ ] Pain → Spec 역추적 표 작성
- [ ] Open Questions Blocking 표시

---

<HARD-GATE>
Self-check 통과 + 사용자 승인. Phase 4 진행.
</HARD-GATE>