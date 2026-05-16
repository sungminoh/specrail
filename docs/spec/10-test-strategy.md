---
phase: 10
status: Approved
---

# Test Strategy

**Mode:** HOLD SCOPE
**Inputs:** Phase 3 AC (R1·R2·R4·R5·R6·R7·R8·R13), Phase 4 INV-1~9, Phase 9 측정가능 NFR
**Date:** 2026-05-10

> **Iron Law:** 모든 production code는 failing test 통과 위해서만 존재. RED → GREEN → REFACTOR.

## 1. Test Pyramid

```text
        ┌──────────┐
        │   E2E    │  10%
        ├──────────┤
        │  Integ   │  20%
        ├──────────┤
        │   Unit   │  70%
        └──────────┘
```

| 종류 | 비율 | 대상 | 도구 (ADR-CAND-{n}) |
|---|---|---|---|
| Unit | 70% | ID auto-gen, schema validator, graph builder, hook script logic, telemetry serializer | depends on ADR-CAND-3 (hook lang) |
| Integration | 20% | Skill chain (Phase N→N+1), hook + git, telemetry queue + endpoint, frontmatter parse 일관 | 동일 |
| E2E | 10% | S1 Greenfield 13 phase 풀, S2 DELTA, 사용자 시나리오 path | depends on Claude Code skill test framework |

근거: skill·hook·builder는 작은 unit으로 격리 가능 (markdown parse·counter·schema check). E2E는 LLM 응답 stochastic이라 비싸고 flaky — 핵심 시나리오만.

## 2. AC ↔ TC Mapping

각 AC 최소 1 TC.

| AC ID | TC ID | TC 이름 | Layer |
|---|---|---|---|
| AC-R1-1 | TC-1 | Phase N+1 skill 호출 시 Phase N frontmatter ID auto-inject | Integ |
| AC-R1-2 | TC-2 | 정의 안 된 ID 인용 시 plugin 차단 + valid list 표시 | Unit (Resolver) |
| AC-R1-3 | TC-3 | ID 정의 시점 plugin auto-generation unique 보장 | Unit (IDGen) |
| AC-R2-1 | TC-4 | Pre-commit hook이 self-check 자동 실행 + fail 시 commit 차단 | Integ (hook + git) |
| AC-R2-2 | TC-5 | Phase transition gate — Phase N status≠Approved 시 N+1 호출 거부 | Unit (Skill) |
| AC-R2-3 | TC-6 | Frontmatter schema 위반 시 hook이 violation 표시 + 차단 | Integ (hook) |
| AC-R4-1 | TC-7 | `change` 명령 시 plugin이 영향 phase list 출력 + proposal auto-draft | Integ (Skill + Graph) |
| AC-R4-2 | TC-8 | 변경된 ID set의 transitive downstream 영향 phase 모두 식별 | Unit (Graph) |
| AC-R5-1 | TC-9 | Phase 1 진입 시 6 forcing questions ONE-AT-A-TIME (Smart Routing 적용) | Integ (Skill + LLM) |
| AC-R5-2 | TC-10 | Vague answer 입력 시 forcing pushback 출력 (5 패턴 매칭) | Integ (LLM-dependent) |
| AC-R5-3 | TC-11 | 모든 phase가 00-common 원칙 자동 상속 (Anti-Sycophancy 등) | Unit (Skill metadata) |
| AC-R6-1 | TC-12 | 단일 명령으로 plugin install 성공 (의존성·setup 자동) | E2E |
| AC-R6-2 | TC-13 | 첫 trigger 시 docs/spec 자동 생성 + Phase 1 skill 호출 | E2E |
| AC-R6-3 | TC-14 | Plugin 첫 setup 시 git repo 감지 + pre-commit hook 자동 install (사용자 confirm 후) | Integ |
| AC-R7-1 | TC-15 | Plugin 메인 prompt에 B2B 표현 검색 0건 | Static |
| AC-R7-2 | TC-16 | Plugin 메인 prompt에 단일 도메인 entity inline 0건 | Static |
| AC-R7-3 | TC-17 | specrail 작업 자체에서 legacy example 참조 0건 (chicken-and-egg 방지) | Static (history check) |
| AC-R8-1 | TC-18 | Phase 13 Approved 시 implementation skill chain — atomic task별 fresh subagent | Integ |
| AC-R8-2 | TC-19 | Subagent 2-stage review (spec compliance + quality) | Integ |
| AC-R8-3 | TC-20 | BLOCKED·ambiguity 시 main session에 escalate (자동 진행 X) | Integ |
| AC-R13-1 | TC-21 | Plugin install 첫 사용 시 telemetry opt-in 질문 default no | Unit |
| AC-R13-2 | TC-22 | Opt-in true 시 익명 metric 전송 (사용자 ID·spec 내용 0건) | Integ + INV-8 |
| AC-R13-3 | TC-23 | Opt-out 명령 anytime 즉시 전송 중단 + 데이터 삭제 요청 가능 | Integ |

## 3. INV ↔ TC Mapping

| INV ID | TC ID | 이름 | Layer |
|---|---|---|---|
| INV-1 | TC-30 | Spec ID는 Project 내 unique — 중복 시 grep으로 검출 | Unit (IDGen) |
| INV-2 | TC-31 | 인용 ID는 정의 set 안 — diff alarm | Integ (hook + Graph) |
| INV-3 | TC-32 | Phase N+1 진입 시 Phase N=Approved 강제 — gate 차단 | Unit (Skill) |
| INV-4 | TC-33 | P0 Spec set이 PRD §3.3 시나리오 cover — Phase 13 self-check matrix | E2E (Phase 13 skill) |
| INV-5 | TC-34 | AC는 R-tier만 GIVEN/WHEN/THEN — schema check | Unit (Schema) |
| INV-6 | TC-35 | 모든 Change에 affectedPhases ≥ 1 — auto-extract 보장 | Unit (Graph) |
| INV-7 | TC-36 | ADR alternatives ≥ 2 + 거절 이유 — Phase 12 self-check | Static |
| INV-8 | TC-37 | TelemetryEvent에 spec 내용·user ID 0건 — schema enforce | Integ (Telem + Schema) |
| INV-9 | TC-38 | TelemetryConsent default OptedOut — install flow | E2E |

## 4. Edge Case Catalog

`EDGE-{n}` ID.

### 시간 / 시간대
| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-1 | Telemetry timestamp UTC vs 사용자 local TZ — 변환 일관 | TC-40 |
| EDGE-2 | Change 시간 정렬 (timeline timeline 시 ISO 8601 비교) | TC-41 |
| EDGE-3 | Skill invocation 자정 경계 (date roll-over) | TC-42 |

### 동시성 / Race
| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-4 | 한 사용자가 multi-project 동시 작업 — ID counter 충돌 X (per-project) | TC-43 |
| EDGE-5 | 동시 commit (terminal 2개) — hook race condition | TC-44 |
| EDGE-6 | Telemetry queue concurrent write | TC-45 |

### i18n / 인코딩
| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-7 | 한국어 spec + 영어 prompt mix | TC-46 |
| EDGE-8 | Emoji·한자·매우 긴 unicode in spec | TC-47 |
| EDGE-9 | 매우 긴 입력 (NFR-SCAL-1 한계 50KB) — LLM context 한계 직전 | TC-48 |
| EDGE-10 | NFC vs NFD 정규화 (macOS file system NFD) | TC-49 |

### Auth Boundary / Hook bypass
| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-11 | 사용자 `--no-verify` commit (hook bypass) — telemetry detection | TC-50 |
| EDGE-13 | `.specrail-cache/` 변조 → invalidate + rebuild | TC-52 |

<!-- specrail:ignore-start -->

(아래는 server-side validation — plugin이 직접 verify 불가, endpoint 책임)

| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-12 | Telemetry token validation (서버 측, plugin 위조 방지) | TC-51 |

<!-- specrail:ignore-end -->

### Empty / Boundary
| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-14 | docs/spec 빈 디렉토리 (Phase 1 시작 직전) | TC-53 |
| EDGE-15 | 0 ID (첫 phase 첫 spec) — auto-gen "R1" 보장 | TC-54 |
| EDGE-16 | NFR-SCAL-2 한계 5000 ID — 그래프 빌드 timeout 내 | TC-55 |
| EDGE-17 | DELTA 영향 phase 0개 (변경이 spec에 영향 0) — graceful 거부 | TC-56 |
| EDGE-18 | Frontmatter 빈 ({}) — schema validator 거부 + helpful message | TC-57 |

### Network / External
| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-20 | Telemetry endpoint 다운 — local queue 보존, 재전송 (NFR-AVAIL-5) | TC-59 |
| EDGE-23 | Subagent timeout (Phase 13 implementation) — escalation (AC-R8-3) | TC-62 |

<!-- specrail:ignore-start -->

(아래는 LLM API · git hosting · terminal session 측 — plugin verify 불가)

| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-19 | LLM API timeout (NFR-AVAIL-3) — graceful retry 또는 사용자에 알림 | TC-58 |
| EDGE-21 | Git Hosting 다운 — local git 작동 (NFR-AVAIL-4) | TC-60 |
| EDGE-22 | Claude Code 갑작스런 종료 (사용자 ctrl-C) — skill state 일관 | TC-61 |

<!-- specrail:ignore-end -->

### Hook 무결성
| EDGE ID | Edge | TC ID |
|---|---|---|
| EDGE-24 | Hook script 변조 (사용자 또는 malicious) — pre-commit 자체가 lint·sign 검증 | TC-63 (NFR-SEC-12) |
| EDGE-25 | Hook 무한 loop (변조됨) — git timeout 10s 강제 abort | TC-64 (NFR-SEC-11) |

## 5. Performance Test Scenarios

| NFR ID | TC ID | 시나리오 |
|---|---|---|
| NFR-PERF-1 | TC-70 | Skill invocation 100회 평균 — `<500ms` |
| NFR-PERF-2 | TC-71 | LLM 응답 평균 (Phase 1 PRD 작성, 표준 prompt) — `<60s` |
| NFR-PERF-3 | TC-72 | Pre-commit hook 실행 (300 ID 가진 spec) — `<3s` |
| NFR-PERF-4 | TC-73 | Graph cold build (1000 ID, 13 phase) — `<2s` |
| NFR-PERF-5 | TC-74 | Graph incremental rebuild (1 file change) — `<300ms` |
| NFR-PERF-6 | TC-75 | Schema validation (한 phase frontmatter, ~20 fields) — `<100ms` |
| NFR-PERF-7 | TC-76 | E2E 13 phase 사용자 시간 (실 사용자 self-report) — `<6h` |
| NFR-SCAL-2 | TC-77 | 5000 ID load test — graph build degradation 측정 |

## 6. Test Ambition Check

핵심 R 5개에 대해:

| R | 2am Friday test | Hostile QA test | Chaos test |
|---|---|---|---|
| R1 (Structured I/O) | TC-1·2·3 통과 | 환각 ID 의도 작성 — Resolver block 작동? | LLM이 random ID 생성 시 IDGen이 reject |
| R2 (Hook validation) | TC-4·5·6 통과 | `--no-verify` bypass — telemetry detection | hook script timeout (변조 시) |
| R4 (DELTA 자동 식별) | TC-7·8 통과 | 변경이 8 phase 동시 영향 — transitive 정확? | Graph 큰 project (5000 ID) |
| R5 (Phase 강제 + Forcing) | TC-9·10·11 통과 | 사용자 vague 답변 고집 — push 작동? | LLM이 forcing 무시 시 reframe |
| R8 (Implementation) | TC-18·19·20 통과 | 사용자 코드가 spec과 mismatch — review fail? | Subagent 무한 loop |

## 7. Regression Policy

- 모든 사용자 보고 issue → regression TC 추가 (TC-{n}-regression)
- Hook fail 사례 → 정확히 그 시나리오 TC
- 환각 ID 발견 시 → 해당 ID 패턴 regression
- Phase별 산출물 변경 (메인 prompt update) → self-application example regression (specrail 작업 자체가 example이라 자기 검증)

## 8. Test Framework Detection

현재 greenfield. 그러나 ADR-CAND-3 (hook script lang) 결정 후:

```bash
# Hook script lang에 따라:
# bash → bats (Bash Automated Testing System)
# Node.js → Jest 또는 Vitest
# Python → pytest

# Skill test (Claude Code SDK 의존)
# → Claude Code 자체 skill test framework (A1 가정 spike 결과)

# Markdown parser test
# → 라이브러리 (ADR-CAND-4) 자체 test 차용
```

(Phase 12 ADR 결정 후 정식 framework 선정.)

## 9. Flakiness Risk Flags

| TC | 위험 |
|---|---|
| TC-9·10 (LLM 응답 내용) | LLM stochastic — keyword 검증 (정확 매치 X), 5회 평균 |
| TC-71 (LLM perf) | LLM API 측 variance — p50/p95/p99 측정, 절대값 X |
| TC-58·59 (network) | 외부 의존 — mock으로 unit·integ, 실 endpoint는 staging만 |
| TC-44 (concurrent commit) | Race condition reproducibility 어려움 — 격리 + retry logic |
| TC-76 (E2E 사용자 시간) | 실 사용자 self-report — small N + 시뮬 |

## 10. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-10-1 | Skill test framework — Claude Code 자체 vs LLM API mock | maintainer | A1 spike 후 |
| OQ-10-2 | E2E test 환경 — CI에 LLM API 실 호출 vs cassette playback | maintainer | Phase 11 |
| OQ-10-3 | Perf test data 큰 project (5000 ID) 어떻게 생성 — 자동 생성 fixture | maintainer | Phase 13 |
| OQ-10-4 | TC-50 telemetry 기반 hook bypass detection 정밀도 — false positive 우려 | maintainer | Phase 11 |

## 11. 다음 phase 인풋

Phase 11 (Operations)에:
- Perf test scenario → production monitoring 후보 (NFR-PERF로 alert)
- Chaos test → production 측 simulation (LLM 다운 시 사용자 경험)
- 사용자 telemetry → KPI dashboard

Phase 13 (Implementation)에:
- 모든 TC ID + 시나리오 — 각 task에 RED test
- TC priority order: TC-30·31 (INV-1·2) → TC-1~3 (R1) → TC-4~6 (R2) → 등

---

## Appendix: TC + EDGE attrs (M-CSA — schema v1.0)

Per `skills/_common/principles.md` §"Attrs Blocks Are Mandatory". TC and EDGE entities are table-defined; attrs blocks aggregate here. level defaults to `unit` (per-TC classification deferred to 0.3.0 codemod that parses §1 Test Pyramid). linked-ac left empty for bulk pass — per-row AC linkage from §2 AC↔TC Mapping table is 0.3.0 codemod work.

<!-- specrail:attrs id=TC-1 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-2 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-3 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-4 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-5 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-6 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-7 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-8 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-9 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-10 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-11 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-12 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-13 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-14 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-15 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-16 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-17 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-18 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-19 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-20 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-21 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-22 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-23 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-30 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-31 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-32 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-33 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-34 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-35 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-36 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-37 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-38 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-40 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-41 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-42 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-43 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-44 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-45 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-46 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-47 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-48 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-49 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-50 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-51 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-52 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-53 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-54 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-55 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-56 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-57 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-58 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-59 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-60 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-61 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-62 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-63 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-64 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-70 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-71 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-72 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-73 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-74 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-75 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-76 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-77 -->
```yaml
status: Approved
level: unit
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-1 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-2 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-3 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-4 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-5 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-6 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-7 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-8 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-9 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-10 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-11 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-12 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-13 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-14 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-15 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-16 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-17 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-18 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-19 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-20 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-21 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-22 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-23 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-24 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-25 -->
```yaml
status: Approved
linked-ac: []
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->
