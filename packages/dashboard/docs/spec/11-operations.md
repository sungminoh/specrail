---
phase: 11
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["08-system-architecture.md", "09-non-functional-requirements.md", "10-test-strategy.md"]
---

# Operations

**Mode:** HOLD SCOPE (inherited)
**Inputs:** Phase 8 ARCH/EXT, Phase 9 NFR-AVAIL/SEC/PRIV, Phase 10 PT
**Date:** 2026-05-17

> **본 cycle 의 특수성:** 이 시스템은 **OSS local self-host** — 사용자 머신에서 직접 도는 single binary. "Prod" 는 사용자 PC. 따라서 multi-region·blue-green·error-budget·on-call 같은 hosted SaaS 개념이 대부분 N/A. 본 Phase 11 은 그 컨텍스트에 맞춰 재해석:
> - Environments = 사용자 OS 매트릭스
> - Deploy = npm publish + `npx` 첫 실행
> - Observability = local 로그 + CLI 진단
> - Alert = 사용자가 본인 dashboard 의 에러 인지 (UI banner) + GitHub issue
> - Backup·DR = 사용자 git + filesystem (책임 위임 명시)

## 1. Environments

| Env | 목적 | 데이터 | 외부 EXT | 누가 접근 |
|---|---|---|---|---|
| Dev | maintainer 로컬 개발 | fixture (test repo) | mock claude CLI (canned JSON) | maintainer |
| CI | GitHub Actions Node 20/22 × ubuntu/macos | fixture | mock claude CLI | CI runner |
| Beta (manual) | maintainer 본인 daily usage 로 dogfood | live (자기 specrail repo) | live claude CLI | maintainer |
| User PC | 외부 사용자가 `npx @specrail/dashboard` | live (그 repo) | live claude CLI | 그 사용자 본인 |

**중앙 prod 환경 없음.** 모든 사용자 PC 가 곧 prod. 데이터 cross-env 0 (각 사용자 머신 격리).

## 2. Deploy Strategy

<!-- specrail:attrs id=OPS-1 -->
```yaml
status: Approved
env: ci
linked-r: []
linked-nfr: []
```
<!-- /specrail:attrs -->

**OPS-1 — Release deploy (npm publish):**
- Tag push (`v0.1.0`) → GitHub Actions:
  1. `npm ci` + typecheck + unit + integration + e2e (mock CLI) + bench gate
  2. `npm run build` (esbuild server bundle + vite web build)
  3. `npm pack` artifact upload (manual verify before publish)
  4. `npm publish --access public --provenance`
- 실패 시: tag 유지 + GitHub release 만 만들고 publish 안 함 (manual fix 후 재 push v0.1.1).

<!-- specrail:attrs id=OPS-2 -->
```yaml
status: Approved
env: prod
linked-r: []
linked-nfr: [NFR-AVAIL-3]
```
<!-- /specrail:attrs -->

**OPS-2 — User runtime (npx 첫 실행):**
- `/specrail dashboard` slash command → `npx -y @specrail/dashboard@^0.x --project <cwd>`
- 첫 실행: npm registry 에서 download (~수십초). 이후 캐시 (~/.npm/_npx).
- 캐시된 후속 실행: < 2s spawn.
- Fallback: 사용자가 직접 `npx @specrail/dashboard --project ./` 호출 (slash command 없이도).

**No rolling/blue-green/canary** — 단일 사용자, restart 가 deploy.

## 3. Observability

<!-- specrail:attrs id=OPS-3 -->
```yaml
status: Approved
env: prod
linked-arch: [ARCH-3]
linked-nfr: [NFR-AVAIL-1, NFR-PRIV-1]
note: "Logs only — metrics·traces 는 외부 telemetry 와 충돌, 별 cycle"
```
<!-- /specrail:attrs -->

**OPS-3 — Logs (only axis in v1):**
- 위치: `<env-paths>/logs/specrail-dashboard.log`.
- 형식: JSON line `{ ts, level, requestId?, sessionId?, message, error? }`.
- Level: error / warn / info / debug. Default info, `--log-level=debug` flag.
- Rotation: 자체 (날짜별 file, 30 일 retention, 외부 vendor 없음).
- **PII 마스킹:** project rootPath 의 사용자 home (`/Users/X`, `/home/X`) → `<home>`. spec body 내용은 로그에 안 씀 (NFR-PRIV-1/2 준수). claude CLI 의 stdin·stdout 도 로그 X (debug level 에서만 truncated 200 chars).

**Metrics·Traces 부재 사유:** central 수집 인프라 = 외부 service = NFR-PRIV-1 위반 위험. v1 은 사용자가 직접 로그 보고. v2 의 opt-in telemetry 별 cycle (PRD KPI-4).

<!-- specrail:attrs id=OPS-4 -->
```yaml
status: Approved
env: prod
linked-arch: [ARCH-3]
linked-nfr: [NFR-AVAIL-1]
```
<!-- /specrail:attrs -->

**OPS-4 — In-app diagnostic:**
- `specrail-dashboard --doctor` 명령: env-paths location 출력 + registry validate + claude CLI 호출 가능 검증 + last 50 log lines.
- 사용자가 GitHub issue 올릴 때 `--doctor` 출력 첨부 가이드.

## 4. Alert Policy

본 cycle 의 "Alert" 는 hosted SaaS 의 PagerDuty 가 아니라 **사용자 본인 인지** 모델:

| Trigger | Severity | Channel | Response |
|---|---|---|---|
| Patch accept 시 atomic write 실패 (NFR-SEC-3 / EXT-2 ENOSPC 등) | high | UI banner + 로그 ERROR | 사용자가 dialog 안내 따라 retry/diagnose |
| Claude CLI exit !=0 또는 timeout (NFR-AVAIL-2) | medium | UI session card + 로그 WARN | 사용자가 stderr 80줄 확인 후 재시도 또는 GitHub issue |
| SSE 끊김 (NFR-AVAIL-3) | low | UI top bar indicator | 5s 자동 재연결 |
| Registry 손상 (parse 실패) | high | startup error + 로그 ERROR | exit 후 사용자 `--doctor` 실행 |
| Per-project lockfile 충돌 (NFR-SCAL-3) | medium | CLI stderr 안내 + exit | 사용자가 기존 인스턴스 확인 |
| Plugin/dashboard 버전 incompat | medium | UI banner | sub-`/specrail dashboard --version` 가이드 |

**No on-call.** maintainer 는 GitHub issue 통해서만 알게 됨. SLO 명시 없음 (OSS volunteer model).

## 5. Backup & DR

<!-- specrail:attrs id=OPS-5 -->
```yaml
status: Approved
env: prod
linked-arch: [ARCH-5, ARCH-7, ARCH-8]
linked-nfr: [NFR-PRIV-1]
note: "사용자 책임 명시 — DR 은 git + OS file backup 위임"
```
<!-- /specrail:attrs -->

**OPS-5 — Backup / DR responsibility matrix:**

| 데이터 | 책임 | rationale |
|---|---|---|
| Spec 본문 (docs/spec/*.md) | **사용자 (git)** | source of truth = git. dashboard 가 atomic write + INV-2 mtime guard 로 safe write 보장. corruption 시 사용자가 `git restore`. |
| Registry (registry.json) | 사용자 OS backup | env-paths 위치 (재생성 가능 — Add project 다시) |
| AI Sessions (SQLite) | 사용자 OS backup + lazy re-derivable | 잃어도 다음 prompt 가 재구축. critical 아님 |
| Patches cache | 사용자 OS backup | 잃어도 issue inbox 가 재생성 |
| Logs | 사용자 OS backup | 90 일 후 자동 삭제 |

**No central backup, no replication.** RPO/RTO 는 사용자 git habit·OS Time Machine 등에 의존. dashboard 는 "data 를 잃지 않게" — atomic write + mtime conflict 만 책임.

**복구 runbook:** `<env-paths>` 디렉토리 통째로 삭제 → dashboard restart → registry 빈 상태 → Add project 재 등록 → AI session 만 사라짐 (spec 본문은 안전).

## 6. Feature Flags

본 v1: **none.**
- Dashboard 는 단일 cohort (사용자 본인). A/B/cohort 무의미.
- Future cycle (DELTA UI · multi-LLM · hosted) 도입 시 ENV var 기반 1-bit flag 충분.

## 7. Cost Model (3 시나리오)

본 cycle 은 **사용자 부담 = 자기 PC 자원 + 자기 Claude Code 구독.** maintainer cost = npm publish 무료 + GitHub Actions free tier.

| 시나리오 | 사용자 측 | maintainer 측 |
|---|---|---|
| Small (1 user, daily light) | CPU ~negligible, RAM ~150MB, claude API ~10 prompts/day (구독 안의) | 0 |
| Base (5 users, daily moderate) | CPU low, RAM ~200MB, claude ~30 prompts/day | 0 |
| Large (50 users, daily heavy) | (각자) CPU moderate, RAM ~300MB, claude ~100 prompts/day | npm bandwidth 무료 tier 안. GitHub Actions 분 사용량 PR/release 빈도 비례 (현 시점 free tier 충분) |

**Cost 충돌 시:** dashboard 가 RAM 200MB 넘으면 (NFR-SCAL-1 multi-project 5개 시), profile + optimize. 사용자에게 cost 의 절대값 부담 X (0 fee, only PC 자원).

## 8. Runbook 후보

| Runbook ID | 상황 | 위치 |
|---|---|---|
| RB-1 | Atomic write 실패 (ENOSPC) | `docs/runbook/disk-full.md` (release 후 채움) |
| RB-2 | Claude CLI 미설치 | inline UI 가이드 (RB 불요) |
| RB-3 | SQLite session 손상 | `docs/runbook/sqlite-corrupt.md` — `<env-paths>/projects/<id>/sessions.sqlite` 삭제 후 restart |
| RB-4 | Per-project lockfile 충돌 | `docs/runbook/lockfile.md` — `<projectRoot>/.specrail-cache/dashboard.lock` 정리 |
| RB-5 | npm publish 실패 (CI) | `docs/runbook/release.md` — manual `npm pack` + 검증 |
| RB-6 | 사용자 GitHub issue triage | `docs/runbook/issue-triage.md` — `--doctor` 출력 요청 |
| RB-7 | OSS PR / contributor onboarding | `docs/runbook/contributor.md` — clone + npm install + npm test |

## 9. Resolved OQs (이전 phase)

- **OQ-1-4** (KPI-4 외부 사용자 측정 → opt-in telemetry vs github): **GitHub star/issue/discussion 기반 self-measure.** NFR-PRIV-1 (외부 telemetry 0) 와 정합. 8주 단위 maintainer 수동 집계.
- **OQ-8-2** (OS fs case-sensitivity): macOS 의 default APFS 는 case-insensitive — phase 파일명은 lowercase + 숫자 prefix 강제 (`01-prd.md`). 이미 plugin init 이 이 형식으로 생성 → 충돌 시점 없음.
- **OQ-8-3** (multi-project 동시 SSE): per-project EventSource 1개 + project switcher 시 close 후 new open. multiplexing 안 함 (구현 단순).
- **OQ-9-1** (NFR-AVAIL-1 99% 측정): **사용자 self-report 기반 incident** (GitHub issue label `availability`). 자동 health-ping 없음 (NFR-PRIV-1 보호).
- **OQ-9-2** (KPI-4 측정 mechanism): 위 OQ-1-4 와 동일 결정.
- **OQ-10-2** (health-ping test): 자동 ping 안 함 결정 → TC 추가 없음.

## 10. Open Questions

<!-- specrail:attrs id=OQ-11-1 -->
```yaml
decider: maintainer
due: "Phase 13"
blocking: false
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-11-2 -->
```yaml
decider: maintainer
due: "Phase 12"
blocking: true
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-11-3 -->
```yaml
decider: maintainer
due: "Phase 13"
blocking: false
```
<!-- /specrail:attrs -->

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-11-1 | RB-1~7 runbook 들을 v0.1 release 와 함께 write vs post-release | maintainer | N |
| OQ-11-2 | OS 별 lockfile 메커니즘 (proper-lockfile 라이브러리 vs 자체 mtime touch) — Phase 12 ADR 후보 | maintainer | Y |
| OQ-11-3 | `--doctor` 출력에 환경 변수·OS 정보 포함 범위 (PII 마스킹 vs 진단 유용성) | maintainer | N |

## 11. 다음 phase 인풋

- **Phase 12 (ADR):** lockfile 메커니즘 (OQ-11-2), ADR-CAND-1~6 결정.
- **Phase 13 (Impl plan):** OPS-1 (release CI) + OPS-3 (logger setup) + RB-1~7 작성을 atomic task 로.
