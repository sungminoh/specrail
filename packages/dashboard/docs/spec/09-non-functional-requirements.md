---
phase: 9
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["01-prd.md §4 KPI", "08-system-architecture.md (ARCH/EXT)"]
---

# Non-Functional Requirements

**Mode:** HOLD SCOPE (inherited)
**Inputs:** PRD §4 KPI-1..5, Phase 8 ARCH-1..8 / EXT-1..4
**Date:** 2026-05-17

## 1. Performance (Perf)

<!-- specrail:attrs id=NFR-PERF-1 -->
```yaml
status: Approved
target: "≤2"
unit: second
measure-method: "Playwright trace, P-CC-4 cold load, network throttled fast 3g 아님 — localhost"
violates-action: "release block"
linked-arch: [ARCH-1, ARCH-2]
linked-r: [R1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-2 -->
```yaml
status: Approved
target: "≤200"
unit: millisecond
measure-method: "Vitest bench: core.graph.layout(500 nodes) p95"
violates-action: "release block"
linked-arch: [ARCH-4]
linked-r: [R2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-3 -->
```yaml
status: Approved
target: "≤50"
unit: millisecond
measure-method: "Vitest bench: core.frontmatter.parse(typical phase) p95"
violates-action: "release block"
linked-arch: [ARCH-4, ARCH-5]
linked-r: [R1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-4 -->
```yaml
status: Approved
target: "≤500"
unit: millisecond
measure-method: "외부 fs save → SSE file.changed 수신까지 e2e timer"
violates-action: "release block"
linked-arch: [ARCH-5, ARCH-2]
linked-r: [R6]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-5 -->
```yaml
status: Approved
target: "≤50"
unit: millisecond
measure-method: "cmd+k 입력 → 결과 first paint timer"
violates-action: "warn (block at 100ms)"
linked-arch: [ARCH-1]
linked-r: [R1]
```
<!-- /specrail:attrs -->

| ID | 지표 | 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-PERF-1 | Phase view cold load p95 | second | ≤ 2 (KPI-5) | Playwright trace localhost | release block |
| NFR-PERF-2 | Graph layout p95 (500 nodes) | ms | ≤ 200 | Vitest bench | release block |
| NFR-PERF-3 | Frontmatter parse p95 (avg phase) | ms | ≤ 50 | Vitest bench | release block |
| NFR-PERF-4 | External edit → SSE 반영 e2e | ms | ≤ 500 | Playwright timer | release block |
| NFR-PERF-5 | cmd+k 첫 결과 paint | ms | ≤ 50 | client perf API | warn (block 100) |

## 2. Scalability (Scal)

<!-- specrail:attrs id=NFR-SCAL-1 -->
```yaml
status: Approved
target: "5"
unit: count
measure-method: "registry projects.length 시뮬 + 매 project 13 phase + 평균 80 ID — load test"
violates-action: "warn (sub-NFR-PERF-1 보장 못 함)"
linked-arch: [ARCH-3, ARCH-7]
linked-r: [R1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SCAL-2 -->
```yaml
status: Approved
target: "500"
unit: count
measure-method: "graph view 500 노드 + 1000 edge → NFR-PERF-2 충족 확인"
violates-action: "fallback phase-collapsed (S2.2.3)"
linked-arch: [ARCH-4]
linked-r: [R2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SCAL-3 -->
```yaml
status: Approved
target: "1"
unit: count
measure-method: "동일 cwd 에 2번째 dashboard 인스턴스 spawn → lockfile 검출 후 종료"
violates-action: "error 안내 + exit"
linked-arch: [ARCH-3, ARCH-8]
linked-r: []
```
<!-- /specrail:attrs -->

| ID | 지표 | 단위 | 목표 | 측정 | 위반 시 |
|---|---|---|---|---|---|
| NFR-SCAL-1 | Multi-project 동시 등록 (스위치 가능) | count | ≥ 5 동시 등록·동시 watcher | load test | warn |
| NFR-SCAL-2 | Phase 당 spec ID 처리 | count | ≥ 500 nodes / 1000 edges | graph bench | phase-level fallback |
| NFR-SCAL-3 | 동일 project 다중 dashboard 인스턴스 | count | 1 (per-project lockfile) | lock 시뮬 | exit gracefully |

## 3. Availability (Avail)

<!-- specrail:attrs id=NFR-AVAIL-1 -->
```yaml
status: Approved
target: "≥99"
unit: percent
measure-method: "8주 daily usage 자체 추적: dashboard 띄운 시간 중 user request 실패 비율"
violates-action: "issue 조사"
linked-arch: [ARCH-3]
linked-r: []
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-2 -->
```yaml
status: Approved
target: "≤30"
unit: minute
measure-method: "claude CLI timeout setting; reachable 30min 비응답 시 SIGTERM"
violates-action: "session.status=Error + UI notify"
linked-arch: [ARCH-6]
linked-ext: [EXT-1]
linked-r: [R4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-3 -->
```yaml
status: Approved
target: "≤5"
unit: second
measure-method: "SSE 끊김 인지 후 재연결 시도 시작 timer"
violates-action: "client UI 'reconnecting' 무한 표시 (가드)"
linked-arch: [ARCH-1, ARCH-2]
linked-r: [R6]
```
<!-- /specrail:attrs -->

| ID | 지표 | 단위 | 목표 | 측정 | 위반 시 |
|---|---|---|---|---|---|
| NFR-AVAIL-1 | Local server uptime during user session | % | ≥ 99 | self-track | issue 조사 |
| NFR-AVAIL-2 | claude CLI timeout | min | ≤ 30 (default, configurable) | execa timeout | session error |
| NFR-AVAIL-3 | SSE reconnect window | s | ≤ 5 | client timer | UI guard |

## 4. Security (Sec) — STRIDE 검토

<!-- specrail:attrs id=NFR-SEC-1 -->
```yaml
status: Approved
target: "0"
unit: count
measure-method: "127.0.0.1 only bind 검증 (Playwright + bind-test); 외부 IP 요청 → 차단 검증"
violates-action: "release block"
linked-arch: [ARCH-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-2 -->
```yaml
status: Approved
target: "100"
unit: percent
measure-method: "모든 mutation 라우트 unit test: CSRF 누락 → 403"
violates-action: "release block (INV-CSRF-1)"
linked-arch: [ARCH-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-3 -->
```yaml
status: Approved
target: "0"
unit: count
measure-method: "path traversal fuzzing (../../etc/passwd 등 100 case); allowlist 외 read/write → 거부"
violates-action: "release block"
linked-arch: [ARCH-3, ARCH-5]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-4 -->
```yaml
status: Approved
target: "0"
unit: count
measure-method: "execa({shell:false}) 강제, eslint-no-shell-true rule; shell injection fuzz"
violates-action: "release block"
linked-arch: [ARCH-6]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-5 -->
```yaml
status: Approved
target: "0"
unit: count
measure-method: "secret scanner CI step (gitleaks 등); env-paths 디렉토리 plain text 검토"
violates-action: "release block"
linked-arch: [ARCH-7, ARCH-8]
```
<!-- /specrail:attrs -->

| ID | 지표 / 위협 | STRIDE | 단위 | 목표 | 측정 | 위반 시 |
|---|---|---|---|---|---|---|
| NFR-SEC-1 | Bind to 127.0.0.1 only (Info disclosure) | I | count of external listener | 0 | bind-test | block |
| NFR-SEC-2 | CSRF coverage on mutations (Tampering) | T | % routes covered | 100 | unit test | block |
| NFR-SEC-3 | Path traversal blocked (Tampering, I) | T,I | count of escape | 0 | fuzz 100 cases | block |
| NFR-SEC-4 | Shell injection prevention (EoP) | E | count of shell:true | 0 | eslint + fuzz | block |
| NFR-SEC-5 | Secret leakage (Info disclosure) | I | count of hardcoded secrets | 0 | gitleaks CI | block |

**Remaining STRIDE coverage:**
- **Spoofing (S):** local-only single-user, no auth needed. NFR-SEC-1 (bind) + browser same-origin 가 대체. residual risk: 사용자 PC 의 다른 user account — accept (typical dev tool).
- **Repudiation (R):** N/A (single-user, no shared audit).
- **Denial of Service (D):** local process, OS resource bound. NFR-AVAIL-2 (timeout) 이 part. accept residual.

## 5. Privacy (Priv)

<!-- specrail:attrs id=NFR-PRIV-1 -->
```yaml
status: Approved
target: "0"
unit: count
measure-method: "network 트래픽 모니터링: dashboard process 가 EXT-4 (npm) 외 외부 호출 0"
violates-action: "release block — privacy 위배"
linked-arch: [ARCH-2, ARCH-6]
linked-ext: [EXT-1, EXT-4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PRIV-2 -->
```yaml
status: Approved
target: "0"
unit: count
measure-method: "spec body 가 claude CLI 외 외부로 전송되는 사례 검토; CLI 는 사용자 본인 인증 컨텍스트라 PRIV-1 와 동일"
violates-action: "block"
linked-arch: [ARCH-6]
linked-ext: [EXT-1]
```
<!-- /specrail:attrs -->

| ID | 지표 | 단위 | 목표 | 측정 | 위반 시 |
|---|---|---|---|---|---|
| NFR-PRIV-1 | 외부 telemetry 전송 | count | 0 (opt-in 도 없음 — v1) | network monitor | block |
| NFR-PRIV-2 | Spec 본문이 claude CLI 외 외부 전송 | count | 0 | code review + e2e | block |

## 6. Accessibility (A11Y)

<!-- specrail:attrs id=NFR-A11Y-1 -->
```yaml
status: Approved
target: "AA"
unit: WCAG-level
measure-method: "axe-core CI step; key flows: P-CC-4, P-CC-6 통과"
violates-action: "warn (v2 expand to AAA)"
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-A11Y-2 -->
```yaml
status: Approved
target: "100"
unit: percent
measure-method: "모든 인터랙티브 요소 Tab navigation 가능; 단축키 (g p / g g / g i / cmd+k / cmd+s) 동작 verify"
violates-action: "release block"
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-A11Y-3 -->
```yaml
status: Approved
target: "4.5"
unit: contrast-ratio
measure-method: "DESIGN.md (design-consultation 산출) 의 color token 이 axe-core contrast 통과"
violates-action: "design 재요청"
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

| ID | 지표 | 단위 | 목표 | 측정 | 위반 시 |
|---|---|---|---|---|---|
| NFR-A11Y-1 | WCAG 2.1 level | level | AA (key flows) | axe-core | warn |
| NFR-A11Y-2 | Keyboard navigation | % | 100 | manual + e2e | block |
| NFR-A11Y-3 | Contrast ratio (text vs background) | ratio | ≥ 4.5 (normal text) | axe | design 재요청 |

## 7. i18n / l10n

<!-- specrail:attrs id=NFR-I18N-1 -->
```yaml
status: Approved
target: "2"
unit: count
measure-method: "UI 문자열은 ko-KR + en-US 키 매핑 가능 구조 (v1 hardcode ko, v2 영문 추가 여지)"
violates-action: "v1 release 영향 없음 (warn 만)"
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-I18N-2 -->
```yaml
status: Approved
target: "100"
unit: percent
measure-method: "spec 본문 mixed ko/en 정상 렌더 (CJK + Latin font fallback)"
violates-action: "block"
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

| ID | 지표 | 단위 | 목표 | 측정 | 위반 시 |
|---|---|---|---|---|---|
| NFR-I18N-1 | UI 언어 지원 | count | v1: 1 (ko-KR), 구조는 2 lang 확장 가능 | code review | warn |
| NFR-I18N-2 | Mixed-script 본문 (ko/en/code) 렌더 | % | 100 | snapshot test | block |

## 8. Open Questions

<!-- specrail:attrs id=OQ-9-1 -->
```yaml
decider: maintainer
due: "Phase 11"
blocking: true
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-9-2 -->
```yaml
decider: maintainer
due: "Phase 11"
blocking: false
```
<!-- /specrail:attrs -->

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-9-1 | NFR-AVAIL-1 의 99% 자체 측정 메커니즘 — 별도 health-ping 도입 vs 사용자 reported issue 기반 | maintainer | Y |
| OQ-9-2 | OQ-1-4 결의: KPI-4 (외부 사용자 3명) 측정 — opt-in telemetry vs GitHub star/issue. Privacy NFR-PRIV-1 와 충돌 → 측정 안 함 (사용자 자율 신고)? | maintainer | N |

## 9. 다음 phase 인풋

- **Phase 10 (Test):** NFR-PERF-2/3 가 Vitest bench 로, NFR-PERF-4 가 Playwright timer 로, NFR-SEC-2/3/4 가 unit/fuzz test 로 매핑.
- **Phase 11 (Ops):** NFR-AVAIL-1 자체 측정 메커니즘, log rotation, env-paths runbook.
- **Phase 12 (ADR):** NFR-A11Y-3 의 contrast ratio 는 DESIGN.md 결정 후 reconcile.
