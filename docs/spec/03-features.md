---
phase: 3
status: Approved
---

# Functional Specification

**Mode:** HOLD SCOPE (retroactive — PRD §10 변경 2026-05-12)
**Inputs:** PRD §3·§5·§6, Phase 2 §6 Pain Priority, §7 차단 단계
**Date:** 2026-05-10 (DELTA 2026-05-12: R13 KPI 인용 정정 + R6 AC-R6-3 기존 hook 보존 정책)

## 0. Roles

**Single-user.** Plugin은 한 사용자 환경에 install. Permission Matrix 생략.

(사용자가 만드는 spec 내부 multi-role은 별개.)

---

## R1: Structured I/O between phases

<!-- specrail:attrs id=R1 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-1, PAIN-2]
linked-features: [F1.1, F1.2, F1.3, F1.4]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** 각 phase 산출물의 ID·status·refs를 frontmatter로 structured. 다음 phase skill이 자동 input으로 받음. 환각 ID 0건.

**해결하는 PAIN:** PAIN-1 (환각 ID), PAIN-2 (사용자 기억 의존)
**해결하는 시나리오:** S1, S2
**Importance:** P0
**Status:** Approved

### Acceptance Criteria

- **AC-R1-1:** GIVEN Phase N 산출물 frontmatter에 정의된 ID set, WHEN Phase N+1 skill 호출, THEN plugin이 정의된 ID를 input으로 자동 inject (사용자 수동 인용 X).
- **AC-R1-2:** GIVEN Phase N+1 산출물 작성 중, WHEN 사용자/LLM이 정의 안 된 ID 인용 시도, THEN plugin이 차단 + "valid IDs: [list]" 표시.
- **AC-R1-3:** GIVEN ID 정의 시점, WHEN ID 부여, THEN plugin이 unique ID 자동 generation (사용자가 자유 작명 X — 충돌 방지).

### F1.1: Frontmatter schema per phase
<!-- specrail:attrs id=F1.1 -->
```yaml
status: Approved
parent-r: R1
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->
13개 phase 별 YAML frontmatter schema 정의. ID·status·refs 표준화.

### F1.2: Input auto-inject
<!-- specrail:attrs id=F1.2 -->
```yaml
status: Approved
parent-r: R1
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->
다음 phase skill 호출 시 이전 phase frontmatter parse → input.

### F1.3: ID auto-generation
<!-- specrail:attrs id=F1.3 -->
```yaml
status: Approved
parent-r: R1
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->
정의 시점에 plugin이 unique ID 할당 (R1·F1.1·S1.1.1·ENT-Foo 등).

### F1.4: ID resolver (selectable list)
<!-- specrail:attrs id=F1.4 -->
```yaml
status: Approved
parent-r: R1
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->
인용 시점에 사용자/LLM이 valid ID list에서만 선택. 자유 입력 X.

---

## R2: Hook validation

<!-- specrail:attrs id=R2 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-3, PAIN-5]
linked-features: [F2.1, F2.2, F2.3, F2.4]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** Self-check이 hook으로 자동 강제. 사용자가 grep 잊어도 commit 차단. HARD-GATE이 plugin tool로 enforce — 양심 의존 0.

**해결하는 PAIN:** PAIN-3 (HARD-GATE 양심), PAIN-5 (self-check 잊음)
**해결하는 시나리오:** S1, S2
**Importance:** P0
**Status:** Approved

### AC

- **AC-R2-1:** GIVEN 산출물 변경, WHEN git commit, THEN pre-commit hook이 self-check 자동 실행 + fail 시 commit 차단.
- **AC-R2-2:** GIVEN Phase N status ≠ Approved, WHEN Phase N+1 skill 호출 시도, THEN plugin이 호출 거부 + "Phase N 승인 필요" 출력.
- **AC-R2-3:** GIVEN frontmatter schema 위반, WHEN commit 시도, THEN hook이 violation 표시 + 차단.

### F2.1: Pre-commit hook (self-check 자동)
<!-- specrail:attrs id=F2.1 -->
```yaml
status: Approved
parent-r: R2
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F2.2: Phase transition gate (skill tool에서 enforce)
<!-- specrail:attrs id=F2.2 -->
```yaml
status: Approved
parent-r: R2
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F2.3: ID consistency hook (정의 vs 인용 diff)
<!-- specrail:attrs id=F2.3 -->
```yaml
status: Approved
parent-r: R2
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F2.4: Frontmatter schema validation hook
<!-- specrail:attrs id=F2.4 -->
```yaml
status: Approved
parent-r: R2
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

---

## R3: 로컬 웹 대시보드 — DEFERRED (별 cycle)

<!-- specrail:attrs id=R3 -->
```yaml
status: Deferred
importance: P1
owner: PERSONA-1
solves-pains: [PAIN-4]
last-modified: 2026-05-16
note: "Deferred to separate repo (specrail/dashboard) per ADR-15"
```
<!-- /specrail:attrs -->

**Status:** Deferred (별 cycle)
**Reason:** Boil the Lake 정확한 응용 — 단일 product 한 cycle. Dashboard는 별 cycle. plugin의 frontmatter schema는 미래 dashboard read 호환 design 보장.

**현재 PAIN-4 (검토 cumbersome) 부분 mitigate:**
- R1 structured frontmatter — 인용·정의 명시
- Phase 5 dependency graph mermaid (markdown 안) — GitHub·VS Code preview에서 자동 render
- R5 phase 진행이 명확 — "어디까지 했나" 의문 감소

(R3 detail은 향후 PRD에서 정의. 이전 작성한 F3.1~F3.5, AC-R3-1~5는 향후 cycle reference로 archive.)

---

## R4: 영향 phase 자동 식별 (DELTA mode)

<!-- specrail:attrs id=R4 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-8]
linked-features: [F4.1, F4.2, F4.3]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** 변경 요청 시 plugin이 ID dependency graph로 영향 phase 자동 추출. 사용자 수동 판단 X.

**해결하는 PAIN:** PAIN-DELTA-scope
**해결하는 시나리오:** S2
**Importance:** P0
**Status:** Approved

### AC

- **AC-R4-1:** GIVEN 변경 요청 (예: "add payment"), WHEN `/specrail change` 명령, THEN plugin이 영향 phase list 출력 + ADDED/MODIFIED/REMOVED proposal 자동 draft.
- **AC-R4-2:** GIVEN 변경된 ID set, WHEN downstream 분석, THEN 그 ID에 직간접 의존하는 phase 모두 식별 (transitively).

### F4.1: ID dependency graph 빌드
<!-- specrail:attrs id=F4.1 -->
```yaml
status: Approved
parent-r: R4
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F4.2: Downstream 자동 추출 (transitive)
<!-- specrail:attrs id=F4.2 -->
```yaml
status: Approved
parent-r: R4
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F4.3: Proposal 자동 draft (skill로)
<!-- specrail:attrs id=F4.3 -->
```yaml
status: Approved
parent-r: R4
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

---

## R5: Phase 진행 강제 + Forcing questions

<!-- specrail:attrs id=R5 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-9]
linked-features: [F5.1, F5.2, F5.3, F5.4]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** 13 phase 순차 진행 + Phase 0 reframing. plugin이 도구로 강제.

**해결하는 PAIN:** PAIN-fundamental (Forcing 도망)
**해결하는 시나리오:** S1, S2
**Importance:** P0
**Status:** Approved

### AC

- **AC-R5-1:** GIVEN raw idea, WHEN Phase 1 skill 호출, THEN 6 forcing questions ONE-AT-A-TIME (Smart Routing 적용).
- **AC-R5-2:** GIVEN vague answer (예: "젊은 사용자들"), WHEN LLM 받음, THEN forcing pushback 출력 (5 패턴).
- **AC-R5-3:** GIVEN 모든 phase, WHEN skill 작동, THEN 00-common 원칙 (Anti-Sycophancy·HARD-GATE·No Placeholders) 자동 상속.

### F5.1: 13 skill orchestration
<!-- specrail:attrs id=F5.1 -->
```yaml
status: Approved
parent-r: R5
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F5.2: 6 forcing questions skill (Phase 0)
<!-- specrail:attrs id=F5.2 -->
```yaml
status: Approved
parent-r: R5
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F5.3: AskUserQuestion ONE-AT-A-TIME enforce
<!-- specrail:attrs id=F5.3 -->
```yaml
status: Approved
parent-r: R5
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F5.4: 00-common 자동 상속 mechanism
<!-- specrail:attrs id=F5.4 -->
```yaml
status: Approved
parent-r: R5
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

---

## R6: 단일 명령 install·setup

<!-- specrail:attrs id=R6 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-10]
linked-features: [F6.1, F6.2, F6.4]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** Plugin install 마찰 최소. 첫 trigger 시 docs/spec 자동 생성, hook 자동 install.

**해결하는 PAIN:** PAIN-base
**해결하는 시나리오:** S1
**Importance:** P0
**Status:** Approved

### AC

- **AC-R6-1:** GIVEN Claude Code 환경, WHEN plugin install 명령, THEN 단일 명령으로 설치 (의존성·setup script 자동).
- **AC-R6-2:** GIVEN 첫 plugin trigger, WHEN docs/spec 부재, THEN 자동 생성 + Phase 1 skill 호출.
- **AC-R6-3:** GIVEN git repo + 기존 pre-commit hook 존재 가능 (husky·lefthook·plain script), WHEN plugin 첫 setup, THEN (a) 기존 hook 감지 (`.husky/`, `lefthook.yml`, `.git/hooks/pre-commit` plain), (b) **chain 방식** install — specrail hook이 기존 hook을 먼저 호출 후 자체 검증 실행, (c) 사용자 명시 confirm 후 적용. 기존 hook 덮어쓰기 절대 금지 — INV 등급 보호.

### F6.1: Claude Code plugin install (1 명령)
<!-- specrail:attrs id=F6.1 -->
```yaml
status: Approved
parent-r: R6
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F6.2: 첫 trigger 시 자동 bootstrap
<!-- specrail:attrs id=F6.2 -->
```yaml
status: Approved
parent-r: R6
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F6.3: ~~대시보드 server 자동 spawn~~ → Deferred (별 cycle — R3와 함께)

### F6.4: Hook 자동 install (git 감지)
<!-- specrail:attrs id=F6.4 -->
```yaml
status: Approved
parent-r: R6
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

---

## R7: 도메인 무관성

<!-- specrail:attrs id=R7 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
linked-features: [F7.1, F7.2]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** 메인 prompt 도메인 무관 placeholder. self-application example로 dogfood (specrail 자체).

**해결하는 PAIN:** 도메인 bias 산출물 왜곡
**해결하는 시나리오:** S1, S2, S3
**Importance:** P0
**Status:** Approved

### AC

- **AC-R7-1:** GIVEN plugin 메인 prompt, WHEN B2B specific 표현 검색, THEN 0건.
- **AC-R7-2:** GIVEN plugin 메인 prompt, WHEN 단일 도메인 entity inline, THEN 0건.
- **AC-R7-3:** GIVEN self-application example (specrail 작업 자체), WHEN 작업 진행, THEN legacy example 참조 X (chicken-and-egg 방지).

### F7.1: 메인 14 prompt (skill 형태로)
<!-- specrail:attrs id=F7.1 -->
```yaml
status: Approved
parent-r: R7
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F7.2: specrail 자체가 example (작업 산출물이 곧 example)
<!-- specrail:attrs id=F7.2 -->
```yaml
status: Approved
parent-r: R7
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

---

## R8: Implementation 핸드오프

<!-- specrail:attrs id=R8 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
linked-features: [F8.1, F8.2, F8.3, F8.4]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** Phase 13 승인 후 atomic task를 Superpowers 패턴 subagent로 자동 실행. 2-stage review.

**해결하는 PAIN:** (구현 단계 — Phase 13 후)
**해결하는 시나리오:** S1, S2
**Importance:** P0
**Status:** Approved

### AC

- **AC-R8-1:** GIVEN Phase 13 status=Approved, WHEN 사용자 implementation 명령, THEN plugin이 atomic task 별 fresh subagent 호출.
- **AC-R8-2:** GIVEN 각 task 종료, WHEN review, THEN 2-stage (spec compliance + code quality).
- **AC-R8-3:** GIVEN BLOCKED 또는 ambiguity, WHEN subagent 만남, THEN main session에 escalate (자동 진행 X).

### F8.1: Phase 13 → Implementation skill chain
<!-- specrail:attrs id=F8.1 -->
```yaml
status: Approved
parent-r: R8
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F8.2: Atomic task별 fresh subagent (Superpowers)
<!-- specrail:attrs id=F8.2 -->
```yaml
status: Approved
parent-r: R8
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F8.3: 2-stage review (compliance + quality)
<!-- specrail:attrs id=F8.3 -->
```yaml
status: Approved
parent-r: R8
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F8.4: BLOCKED escalation
<!-- specrail:attrs id=F8.4 -->
```yaml
status: Approved
parent-r: R8
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

---

## R13: Telemetry opt-in (e6 cherry-pick)

<!-- specrail:attrs id=R13 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
linked-features: [F13.1, F13.2, F13.3]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

**Description:** 사용자 동의 시 plugin 사용 metric 익명 수집. PRD KPI-6 측정 mechanism + KPI-1 완주율 부분 데이터 (PhaseStarted vs PhaseApproved 비율). Privacy first — opt-in only, default off. (KPI-5 dashboard 사용 빈도는 dashboard cycle로 이동됨.)

**해결하는 PAIN:** (KPI 측정 부재 — product 운영. 사용자 PAIN 아님 — maintainer 필요)
**해결하는 시나리오:** 모든 (background)
**Importance:** P0
**Status:** Approved

### AC

- **AC-R13-1:** GIVEN plugin install 첫 사용, WHEN telemetry opt-in 질문, THEN 명시 yes/no 선택 (default no).
- **AC-R13-2:** GIVEN opt-in true, WHEN plugin 사용, THEN 익명 metric 전송 (사용자 ID·spec 내용 제외).
- **AC-R13-3:** GIVEN 사용자, WHEN opt-out 명령 anytime, THEN 즉시 전송 중단 + 기존 데이터 삭제 요청 가능.

### F13.1: Install 시 opt-in 질문 (default off)
<!-- specrail:attrs id=F13.1 -->
```yaml
status: Approved
parent-r: R13
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F13.2: 익명 metric 전송 (사용자/spec 정보 제외, 단순 phase 실행 카운트·시간만)
<!-- specrail:attrs id=F13.2 -->
```yaml
status: Approved
parent-r: R13
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

### F13.3: Opt-out anytime + 데이터 삭제 요청
<!-- specrail:attrs id=F13.3 -->
```yaml
status: Approved
parent-r: R13
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

---

## Importance × Status 분포

| | Draft | Approved | Implementing | Done | Deferred |
|---|---|---|---|---|---|
| P0 | 8 (R1·R2·R4·R5·R6·R7·R8·R13) | 0 | 0 | 0 | 1 (R3 → 향후 cycle) |
| P1 | 0 | 0 | 0 | 0 | 0 |
| P2 | 0 | 0 | 0 | 0 | 1 (F3.5 → 향후 cycle) |
| P3 | 0 | 0 | 0 | 0 | 0 |

## Pain → Spec 매핑

| Pain ID | 해결 Spec | 차단 시나리오 | 현재 cover |
|---|---|---|---|
| PAIN-1 환각 ID | R1 (모든 F·S) | S1, S2 | Full |
| PAIN-2 기억 의존 | R1 (F1.2, F1.4) | S1, S2 | Full (R1) — dashboard 보강은 향후 cycle |
| PAIN-3 HARD-GATE 양심 | R2 (F2.2) | S1, S2 | Full |
| PAIN-4 검토 cumbersome | R1 structured + Phase 5 mermaid + GitHub/VS Code preview | S1, S2 | **Partial** — 인터랙티브 검토는 향후 dashboard cycle |
| PAIN-5 self-check 잊음 | R2 (F2.1, F2.3, F2.4) | S1, S2 | Full |
| PAIN-DELTA-scope | R4 (모든) | S2 | Full |
| PAIN-fundamental Forcing 도망 | R5 (F5.2, F5.3) | S1 | Full |
| PAIN-base install 마찰 | R6 (모든) | S1 | Full |
| PAIN-6 다중 project (Edge-2) | (dashboard cycle) | (Edge-2) | Deferred |
| PAIN-7 brownfield (Edge-3) | (향후 cycle 후보) | S3 | Deferred |

## EXPANSION 후보 (Mode HOLD로 변경 — 모두 Deferred)

PRD §10 Mode가 EXPANSION → HOLD 변경됨 (Boil the Lake 정확한 응용). 본 cycle은 harness 견고하게. 모든 expansion 후보는 별 cycle.

| 후보 ID | 후보 | Status |
|---|---|---|
| e1 | AI 자동 review (다른 LLM second opinion) | Deferred (향후 cycle) |
| e2 | DELTA timeline visualization | Deferred → R3 (대시보드)에 흡수, 향후 cycle |
| e3 | 다중 LLM provider | Rejected — PRD §6 Non-Goal과 충돌 |
| e4 | Edge-1 (non-dev) primary 승격 | Deferred (향후 cycle) — Phase 1 PRD revisit 필요 |
| e5 | 다중 project tab (Edge-2) | Deferred (향후 cycle) — dashboard와 함께 |
| e6 | Telemetry opt-in (KPI 측정) | **채택** — R13 base 유지 |

## Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-3-1 | EXPANSION 후보 e1-e6 cherry-pick — base R 추가 여부 | maintainer | N (Phase 4 진입 전 결정 권장) |
| OQ-3-2 | F3.5 (frontmatter editing UI) P2 vs P1 | maintainer | Phase 7 |
| OQ-3-3 | F8.4 BLOCKED escalation 형식 (interrupt vs queue) | maintainer | Phase 8 |

## 다음 phase 인풋

Phase 4 (Domain Model)에:
- 모든 R/F/S 목록 (R1·R2·R4·R5·R6·R7·R8·R13 — R3 deferred)
- Spec Description 명사: Phase·Spec·AC·Hook·DependencyGraph·Skill·Subagent·Frontmatter·Schema·ID·TelemetryConsent
- Aggregate root 후보: Phase·DependencyGraph·Project·Change

Phase 5 (User Flow): Spec ID + 이름 (SEC dashboard 제거)
Phase 8 (Architecture): R/F (container 매핑 — skill·hook·CLI·telemetry endpoint)
Phase 10 (Test Strategy): 모든 AC (R13 privacy AC 강조)
Phase 13 (Implementation): P0 Spec (R3 제외)
