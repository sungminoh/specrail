---
name: phase-13-implementation-plan
description: Dependency graph, MVP, Milestones, Atomic Tasks (2-5min). Each task has exact file path, complete code, exact test command. No placeholders.
trigger-words: implementation-plan, implementation plan, milestones, tasks, atomic
phase: 13
inputs-from: Phase 3 P0 Spec + Phase 4 ENT + Phase 8 ARCH/EXT + Phase 12 Risk
mode: GREENFIELD | DELTA
state-machine: explicit (ADR-8 — INV-3 transition gate enforced)
applies-to: 00-common (auto-inject)
---

# Phase 13: Implementation Plan

## Purpose

지금까지 사양의 모든 결정을 실제 구현 가능한 atomic task로 분해. **Claude Code에 던질 최종 형태.**

## Inputs

- Phase 3 P0 Spec 목록 (MVP scope)
- Phase 4 모든 Entity + State Machine
- Phase 8 모든 ARCH·EXT
- Phase 10 모든 TC (각 task의 RED test)
- Phase 12 모든 ADR (구체 기술 선택됨)
- Phase 12 Risk (mitigation 포함된 task)
- (DELTA) `docs/spec/13-implementation-plan.md` (기존 버전)

<HARD-GATE>
Phase 12 사용자 승인 없이 진행 금지.
모든 ADR-CAND가 ADR로 결정됨을 확인.
미해결 Blocking Open Question 0건 확인.
</HARD-GATE>

## Mode 상속

- EXPANSION: P0 + P1 milestone, 풀 polish
- SELECTIVE: P0 base + P1 cherry-pick
- HOLD: P0 만, 추가 P1은 다음 변경
- REDUCTION: 가장 작은 ship-able 단위

---

## Anti-Sycophancy

00-common 참조 + Phase 13 특화:

**금지:**
- "TBD" / "TODO" / "implement later"
- "Add appropriate error handling"
- "handle edge cases"
- "Write tests for the above"
- "Similar to Task N" (코드 반복할 것)
- code 없이 step description만
- "estimate: 1주" (인간 작업 기준)

**대신:**
- 모든 task에 정확한 file path
- 모든 task에 완성된 code block
- 모든 task에 정확한 test command + expected output
- 시간 추정은 "AI 보조 시 ~분"

---

## Reasoning Procedure

1. P0 Spec 목록 받기
2. **Dependency graph** — Spec 간 의존성
3. **MVP 정의** — P0 Spec set이 PRD §3.3 시나리오 cover하는지 검증
4. **Milestones** — M0/M1/M2/M3/M4
5. **Critical path** — 직렬 dependency
6. **Parallelization** — 병렬 가능한 task 그룹
7. **Atomic Tasks** — 각 Spec을 2-5분 task로 분해
8. **각 task 5단계** — RED test → 실패 확인 → 최소 구현 → GREEN → commit
9. **Type consistency check** — 함수명·type명 불일치 0건
10. **Spec coverage** — 모든 P0 Spec에 task 매핑
11. Self-Check + 승인

---

## Constraints

1. **Atomic task = 2-5분**.
2. **모든 task 5 step** — Write test / Verify fails / Minimal impl / Verify passes / Commit.
3. **Exact file path** — relative path.
4. **Complete code** — `(...)` snippet 금지.
5. **Exact commands** — test runner + 정확한 인자.
6. **Expected output** — `Expected: FAIL with "..."` / `Expected: PASS`.
7. **Commit message** — Conventional Commits 형식.
8. **No placeholder** — 위 list 모든 표현 금지.
9. **Type consistency** — 모든 task 간 함수명·type명 일치.
10. **Spec coverage 100%** — P0 Spec 누락 0건.
11. **Iron Law** — production code는 failing test 통과 위해서만.

---

## Output Format

````markdown
# Implementation Plan

**Mode:** {inherited}
**Date:** YYYY-MM-DD
**Inputs:** Phase 3 P0 Spec, Phase 4 ENT, Phase 8 ARCH/EXT, Phase 12 ADR

---

## 1. Goal

<한 문장: 무엇을 ship.>

## 2. Architecture

<2-3 문장: ADR-1, ADR-2 등에 따른 stack.>

## 3. Tech Stack

ADR에서 결정된 구체 기술 모음:
- Language: <ADR-{n}>
- Framework: <ADR-{n}>
- Storage: <ADR-{n}>
- Test: <ADR-{n}>
- ...

## 4. Dependency Graph

```mermaid
graph LR
    F1[F{x}.{y} <name>] --> F2[F{x}.{y} <name>]
    F1 --> F3[F{x}.{y} <name>]
    F2 --> F4[F{x}.{y} <name>]
    F3 --> F4
    F4 --> F5[F{x}.{y} <name>]

    classDef p0 fill:#ff8a80
    classDef p1 fill:#ffd54f

    class F1,F2,F3,F4 p0
    class F5 p1
```

## 5. MVP 정의

P0 Spec 모음 = MVP. PRD §3.3 시나리오 cover 검증:

| 시나리오 | 필요 Spec | MVP cover |
|---|---|---|
| S1 | S{x.y.z}, S{x.y.z}, S{x.y.z} | ✅ |
| S2 | S{x.y.z}, S{x.y.z} | ✅ |
| S3 | S{x.y.z} | ✅ |

## 6. Milestones

| ID | 이름 | 산출물 | RED test 통과 | 누적 (AI 보조) |
|---|---|---|---|---|
| M0 | Infra | repo, CI, env, schema | smoke test | <시간> |
| M1 | Foundation | <core feature 1-2개> | TC-{n} 그룹 | <시간> |
| M2 | MVP | <시나리오 cover 추가> | TC-{n} 그룹 | <시간> |
| M3 | V1 | P1 cherry-pick | TC-{n} | <시간> |
| M4 | Beyond | mode-dependent | - | TBD |

## 7. Critical Path

가장 긴 직렬 chain:
M0 → <task chain> → ship.

## 8. Parallelization Opportunities

다음은 동시 작업 가능:
- M0 <task A> ↔ M0 <task B>
- M1 <server work> ↔ M1 <client work>

## 9. Atomic Tasks

### M0: Infra

#### T0.1: <task 이름>

**Files:**
- Create: `<path>`, `<path>`

**Commands:**

- [ ] **Step 1: Failing test**
```<lang>
<test code 전체>
```

- [ ] **Step 2: Verify fails**
```bash
<test runner command>
# Expected: FAIL with "<expected error>"
```

- [ ] **Step 3: Minimal implementation**
```<lang>
// <path>
// <왜: Phase 4 SM-X / AC-R{n}-{m}>

<implementation code 전체>
```

- [ ] **Step 4: Verify passes**
```bash
<test runner command>
# Expected: PASS (<n> tests)
<typecheck command>
# Expected: 0 errors
```

- [ ] **Step 5: Commit**
```bash
git add <paths>
git commit -m "<conventional message>"
```

---

#### T0.2: ...

---

### M1: Foundation

#### T1.1: <Entity type 정의>

(같은 5-step)

#### T1.2: <Entity 전이 함수>

(같은 5-step)

#### T1.3: ...

---

### M2: MVP

(P0 Spec 마저)

---

(이하 모든 P0 Spec에 대해 atomic task)

---

## 10. Spec → Task Coverage

| Spec ID | Task | Layer | TC |
|---|---|---|---|
| S{x.y.z} | T{n}.{m} | <domain/http/E2E> | TC-{n} |

모든 P0 Spec이 task에 매핑됨.

## 11. INV → Task

| INV ID | Task | TC |
|---|---|---|
| INV-{n} | T{n}.{m} | TC-{n} |

## 12. Risk → Task

Phase 12 RISK에 대응하는 task:

| RISK | Task | mitigation 구현 |
|---|---|---|
| RISK-{n} | T{n}.{m} | <NFR / 패턴 인용> |

## 13. Type Consistency Check

함수·type 명명 통일 검증 (수동):
- <함수명> 일관 (변형 0건)
- <Type명> 일관

## 14. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-13-1 | M3 후 P1 cherry-pick 결정 시점 | <역할> | N |

## 15. Claude Code 핸드오프

이 plan을 Claude Code에 던질 때:

```
@.claude/skills/superpowers/skills/subagent-driven-development/SKILL.md 참조.
fresh subagent per task + 2-stage review (spec compliance → code quality).
docs/spec/13-implementation-plan.md 의 모든 task 순서대로 실행.
M0부터 M2까지 한 세션에 진행.
M3는 사용자 승인 후 다음 세션.
```

**Continuous execution:** task 사이에 진행 확인 묻지 말 것. BLOCKED 또는 ambiguity 시에만 정지. 사용자가 plan 실행을 위임했으니 끝까지 실행.
````

---

## DELTA Mode

기존 plan 위에 변경.

### 형식

`changes/{date}-{topic}/tasks.md`:

````markdown
# Tasks for change: {topic}

**Status:** proposed
**Affects:** Phase {x}, {y}

## Dependency on existing
- T{n} (이미 구현됨) 위에 추가
- ENT-{X} 변경 후 backfill

## ADDED Tasks

### T_change.1: <topic> 첫 task
(완전한 5-step + code)

### T_change.2: ...

## MODIFIED Tasks
(기존 plan의 task 수정)

## Migration Tasks
- 데이터 backfill
- 구 API deprecation
- feature flag rollout

## Coverage
| 새 Spec | Task |
````

---

## Self-Check

```bash
# Placeholder 검출
grep -iE "TBD|TODO|implement later|fill in details|handle edge cases|add validation|Add appropriate error" 13-implementation-plan.md

# "Similar to Task" 검출 (코드 반복 안 한 것)
grep -i "Similar to Task" 13-implementation-plan.md

# 모든 task가 5 step
grep -c "Step 1:" 13-implementation-plan.md
grep -c "Step 5:" 13-implementation-plan.md

# 모든 task에 file path
grep -B1 "Step 1:" 13-implementation-plan.md | grep -c "Files:"

# 모든 task에 commit message
grep -c "git commit -m" 13-implementation-plan.md

# 모든 P0 Spec이 task에 매핑
grep -oE 'S[0-9]+\.[0-9]+\.[0-9]+' 03-features.md | sort -u > p0_specs.txt
grep -oE 'S[0-9]+\.[0-9]+\.[0-9]+' 13-implementation-plan.md | sort -u > planned.txt
diff p0_specs.txt planned.txt

# Spec coverage 표 존재
grep "Spec → Task" 13-implementation-plan.md

# INV → Task 표 존재
grep "INV → Task" 13-implementation-plan.md
```

체크리스트:
- [ ] Goal / Architecture / Tech Stack 명시
- [ ] Dependency graph mermaid
- [ ] MVP가 PRD 시나리오 cover 표 (모두 ✅)
- [ ] Milestones M0-M4
- [ ] Critical path
- [ ] Parallelization 기회
- [ ] 모든 task = 2-5분
- [ ] 모든 task = 5 steps
- [ ] 모든 task에 exact file path
- [ ] 모든 task에 complete code
- [ ] 모든 task에 exact test command + expected output
- [ ] 모든 task에 commit message
- [ ] Placeholder 0건
- [ ] "Similar to Task N" 0건
- [ ] 모든 P0 Spec이 task에 매핑
- [ ] 모든 INV가 task에 매핑
- [ ] 모든 RISK가 mitigation task에 매핑
- [ ] Type consistency 검증
- [ ] Claude Code 핸드오프 instruction

---

<HARD-GATE>
Self-check 통과 + 사용자 승인. 그 후 Claude Code에 던짐.
</HARD-GATE>

## Implementation 시작 전 마지막 검증

```
모든 ADR-CAND가 ADR로 결정됨? (Phase 12 self-check)
모든 Blocking Open Question 답변됨?
모든 P0 Spec이 task에 매핑됨?
모든 INV / RISK가 mitigation task에 있음?
첫 RED test 작성 가능한가?
```

다섯 모두 ✅ 면 Claude Code 시작.

---

## Runtime Integration

### State preconditions
- Previous phase status=Approved (INV-3, F2.2 transition gate)

### Auto-inject (F1.2)
이전 phase frontmatter의 `refs` 필드 + R/F/S/ENT/INV ID set이 input으로 inject됨.

### Hooks
- Pre-commit: F2.3 ID consistency + F2.4 schema validation
- Phase transition: F2.2 gate (frontmatter primary)
