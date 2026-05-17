---
phase: 10
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["03-features.md (AC)", "04-domain-model.md (INV)", "09-non-functional-requirements.md (NFR)"]
---

# Test Strategy

**Mode:** HOLD SCOPE (inherited)
**Inputs:** Phase 3 AC-R1..R6, Phase 4 INV-1..6, Phase 9 NFR-PERF/SCAL/AVAIL/SEC/PRIV/A11Y/I18N
**Date:** 2026-05-17

## 1. Test Pyramid

```
        ┌──────┐
        │ E2E  │  ~10%  (8 핵심 시나리오)
        ├──────┤
        │ Integ│  ~20%  (route × service, adapter mocks)
        ├──────┤
        │ Unit │  ~70%  (core domain — 100% deterministic)
        └──────┘
```

- **Unit (core 만):** Vitest, in-memory. zero I/O. Target coverage 90%+.
- **Integration (server):** Vitest + Hono `app.request`. Adapter mock (memfs · fake-cli · in-memory registry). 80%+.
- **Integration (web):** Vitest + RTL + MSW. 70%+.
- **E2E:** Playwright, headless. 실 server + 임시 git repo fixture + mocked claude CLI (canned JSON shell script).
- **Performance bench:** `vitest bench`. regression gate.

## 2. AC ↔ TC Mapping

<!-- specrail:attrs id=TC-1 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R1-1]
linked-nfr: [NFR-PERF-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-2 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R1-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-3 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R1-3]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-4 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R1-4]
linked-nfr: [NFR-PERF-5]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-5 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R2-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-6 -->
```yaml
status: Approved
level: unit
linked-ac: [AC-R2-2]
linked-nfr: [NFR-PERF-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-7 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R2-3]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-8 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R2-4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-9 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R3-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-10 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R3-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-11 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R3-3]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-12 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R4-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-13 -->
```yaml
status: Approved
level: unit
linked-ac: [AC-R4-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-14 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R4-3]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-15 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R4-4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-16 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R4-5]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-17 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R5-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-18 -->
```yaml
status: Approved
level: unit
linked-ac: [AC-R5-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-19 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R5-3]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-20 -->
```yaml
status: Approved
level: e2e
linked-ac: [AC-R6-1]
linked-nfr: [NFR-PERF-4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-21 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R6-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-22 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R6-3]
```
<!-- /specrail:attrs -->

| TC | Level | Cover AC | Cover NFR | 설명 |
|---|---|---|---|---|
| TC-1 | e2e | AC-R1-1 | NFR-PERF-1 | dashboard 부팅 → P-CC-4 cold load ≤ 2s |
| TC-2 | e2e | AC-R1-2 | — | ID hover popover + click jump |
| TC-3 | e2e | AC-R1-3 | — | project switcher 200ms |
| TC-4 | integ | AC-R1-4 | NFR-PERF-5 | cmd+k fuzzy match ≤ 50ms |
| TC-5 | integ | AC-R2-1 | — | Refs tab in/out 정확도 |
| TC-6 | unit | AC-R2-2 | NFR-PERF-2 | core.graph.nhop(500) ≤ 200ms |
| TC-7 | e2e | AC-R2-3 | — | graph 노드 click → Refs + Open in phase |
| TC-8 | integ | AC-R2-4 | — | 200+ 노드 phase-collapsed fallback |
| TC-9 | integ | AC-R3-1 | — | orphan/dangling/status-mismatch/traceability 4종 검출 |
| TC-10 | e2e | AC-R3-2 | — | issue row 펼침 source-label + line + suggested patch |
| TC-11 | integ | AC-R3-3 | — | refresh async SSE 진행률 |
| TC-12 | e2e | AC-R4-1 | — | Run AI review → claude CLI spawn (mocked) + SSE token stream |
| TC-13 | unit | AC-R4-2 | — | patch JSON 파싱 zod validate |
| TC-14 | e2e | AC-R4-3 | — | inline rewrite selection 범위 patch preview |
| TC-15 | integ | AC-R4-4 | — | claude 미설치/exit !=0 분류 에러 |
| TC-16 | integ | AC-R4-5 | — | abort SIGTERM → SIGKILL |
| TC-17 | integ | AC-R5-1 | — | atomic write + mtime mismatch 409 |
| TC-18 | unit | AC-R5-2 | — | frontmatter zod validate inline error |
| TC-19 | integ | AC-R5-3 | — | navigate-away 미저장 dialog |
| TC-20 | e2e | AC-R6-1 | NFR-PERF-4 | 외부 vim save → SSE UI 갱신 ≤ 500ms |
| TC-21 | integ | AC-R6-2 | — | self-write flag skip duplicate fetch |
| TC-22 | integ | AC-R6-3 | — | SSE 끊김 → last-event-id catch-up |

## 3. INV ↔ TC Mapping (integration 강제)

<!-- specrail:attrs id=TC-23 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R5-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-24 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R5-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-25 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R4-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-26 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R6-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-27 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R5-1]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=TC-28 -->
```yaml
status: Approved
level: integration
linked-ac: [AC-R1-1]
```
<!-- /specrail:attrs -->

| TC | Cover INV | 설명 |
|---|---|---|
| TC-23 | INV-1 | fs.writeFile 직접 호출 검출 (eslint custom rule + grep) — 0 결과 검증 |
| TC-24 | INV-2 | mtime mismatch → 409 (TC-17 과 일부 중첩, INV 관점) |
| TC-25 | INV-3 | claudeCli.stream 의 cwd 가 projectRoot 일치 (모든 호출 경로) |
| TC-26 | INV-4 | watcher allowlist 만 — node_modules·.git 변경 시 fire 0 |
| TC-27 | INV-5 | CSRF 위조 → 403 (TC-SEC-2 와 정렬) |
| TC-28 | INV-6 | docs/spec/01-prd.md 없는 path → 등록 거부 |

## 4. Performance Test Scenarios

| PT ID | NFR | 시나리오 | 측정 |
|---|---|---|---|
| PT-1 | NFR-PERF-1 | P-CC-4 cold load (localhost, no cache) | Playwright trace p95 |
| PT-2 | NFR-PERF-2 | core.graph.layout(500 nodes) | vitest bench p95 |
| PT-3 | NFR-PERF-3 | core.frontmatter.parse(~10KB phase) | vitest bench p95 |
| PT-4 | NFR-PERF-4 | external save → SSE 수신 | Playwright timer |
| PT-5 | NFR-PERF-5 | cmd+k first paint | client perf API |

각 PT 는 PR 마다 실행, threshold 위반 시 fail.

## 5. Edge Case Catalog

<!-- specrail:attrs id=EDGE-1 -->
```yaml
status: Approved
linked-ac: [AC-R6-1, AC-R5-1]
repro-steps: "dashboard edit 중 vim 으로 외부 저장 → cmd+s → 409 expected"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-2 -->
```yaml
status: Approved
linked-ac: [AC-R5-1]
repro-steps: "단일 project 에 dashboard 2개 띄움 → 2번째는 lockfile 만나고 종료"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-3 -->
```yaml
status: Approved
linked-ac: [AC-R6-1]
repro-steps: "macOS 대소문자 무관 fs 에서 phase 파일 case rename 시 watcher 동작"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-4 -->
```yaml
status: Approved
linked-ac: [AC-R3-1, AC-R3-2]
repro-steps: "여러 spec dir 동시 작업 — multi-project — ID counter 충돌 0"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-5 -->
```yaml
status: Approved
linked-ac: [AC-R4-1, AC-R4-4]
repro-steps: "claude CLI 출력에 정상 patch + 잘못된 JSON 혼재 → 정상 patch 만 추출"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-6 -->
```yaml
status: Approved
linked-ac: [AC-R4-2, AC-R3-2]
repro-steps: "AI 가 동일 hunk 를 중복 제안 (review-scan + chat) — dedup"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-7 -->
```yaml
status: Approved
linked-ac: [AC-R6-1]
repro-steps: "git pull 으로 spec 파일 다수 동시 변경 → SSE event 폭주 → debounce 200ms"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-8 -->
```yaml
status: Approved
linked-ac: [AC-R1-2]
repro-steps: "mixed-script (ko 본문 + en ID + 한자 PRD) 렌더 + ID detect 정확도"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-9 -->
```yaml
status: Approved
linked-ac: [AC-R4-1]
repro-steps: "AI session 진행 중 사용자 project 전환 → 이전 session SIGTERM"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=EDGE-10 -->
```yaml
status: Approved
linked-ac: [AC-R5-1]
repro-steps: "디스크 가득 (ENOSPC) → atomic write 실패 → 사용자 친화 에러 (raw stderr 노출 X)"
```
<!-- /specrail:attrs -->

| EDGE | 영역 | 설명 |
|---|---|---|
| EDGE-1 | concurrency | dashboard edit + external save = 409 |
| EDGE-2 | concurrency | per-project lock (NFR-SCAL-3) |
| EDGE-3 | fs case | macOS HFS+ vs Linux case 차이 |
| EDGE-4 | multi-project | per-spec-dir ID 격리 |
| EDGE-5 | AI parse | mixed patch + invalid JSON |
| EDGE-6 | AI dedup | 동일 hunk 중복 제안 |
| EDGE-7 | watcher | git pull 폭주 → debounce |
| EDGE-8 | i18n | mixed-script body + ID detect |
| EDGE-9 | AI lifecycle | project 전환 시 streaming session 종료 |
| EDGE-10 | fs error | ENOSPC graceful error |

## 6. Flakiness Risk Register

| TC | Risk | 완화 |
|---|---|---|
| TC-1 (cold load) | localhost 부팅 시간 변동 | warm-up + 3 회 median |
| TC-12 (AI mock) | mocked CLI stdout timing | 결정적 fixture (canned JSON) |
| TC-20 (file watch) | OS 별 chokidar 이벤트 지연 | usePolling 옵션 fallback |
| PT-2 (graph bench) | CPU 변동 | CI runner 고정 + 5회 median |

## 7. Regression Policy

- **모든 PR 에 unit + integration 자동 실행** (CI matrix: Node 20/22, OS ubuntu/macos).
- **e2e + bench**: PR 마다 ubuntu 만 (cross-OS e2e 는 release 전).
- **Bench gate**: NFR-PERF-* threshold 5% regression → block.
- **Flaky retry**: 1회 자동 retry, 두 번째 실패 → fail. flaky 표시는 TC 의 `flaky: true` attrs.

## 8. Coverage Targets (Iron Law 강조)

| Layer | Target |
|---|---|
| core (unit) | line ≥ 90%, branch ≥ 85% |
| server (integration) | line ≥ 80% |
| web (unit) | line ≥ 70% |
| e2e | 8 must-pass 시나리오 (위 TC-1, 7, 10, 12, 14, 17 외 2개) |

## 9. Open Questions

<!-- specrail:attrs id=OQ-10-1 -->
```yaml
decider: maintainer
due: "Phase 13"
blocking: false
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-10-2 -->
```yaml
decider: maintainer
due: "Phase 11"
blocking: false
```
<!-- /specrail:attrs -->

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-10-1 | E2E 의 mocked claude CLI 와 실 claude CLI 둘 다 매주 1회 run? (실 CLI 비용·flaky) | maintainer | N |
| OQ-10-2 | OQ-9-1 (NFR-AVAIL-1 측정 메커니즘) 결의되면 health-ping test 도 TC 로 | maintainer | N |

## 10. 다음 phase 인풋

- **Phase 11 (Ops):** CI matrix (Node 20/22 × ubuntu/macos), bench result 보관 위치, flaky test triage 프로세스.
- **Phase 13 (Impl plan):** TC-1 ~ TC-22 + TC-23~6 + EDGE-1~10 + PT-1~5 을 atomic task 의 `red-test` 필드로 매핑.
