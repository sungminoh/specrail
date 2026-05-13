# Planning Pipeline v4

> 13-phase spec discipline harness for Claude Code — structured I/O + hook validation + 도구로 강제

**Status: v0.0.1-alpha (in-process production code 완성, 외부 통합 0건).**

249 unit/integration tests PASS. TypeScript strict 0 errors. 단:
- Claude Code marketplace 실 install 미검증 (A1 spike PASSED-PARTIAL — `inputs-from` field 작동 확인 필요)
- Plausible endpoint 실 연결 0 (client logic만 — `send` mock injection)
- 실 사용자 사용 사례 0 (본인 dogfood만 — KPI-1·KPI-2·KPI-6 측정 0)
- npm publish 0 / marketplace 등록 0

본 alpha의 의미: code-side spec compliance 완료 + 외부 통합 가능 상태. 실 사용 가능까지 ~12-20h 추가 작업 (alpha 사용자 1-2명·external endpoint·marketplace registry).

v3 markdown 사용 중 "사용자 양심·기억 의존" 약점을 hook + state machine으로 자동 강제하는 Claude Code plugin.

## What it does

1. `/plan-pipeline init` — docs/spec/ 자동 생성 + Phase 1 forcing questions 시작
2. Phase 1~13 순차 진행 — 각 phase status=Approved일 때만 다음 phase 진입 (INV-3 자동 강제)
3. Pre-commit hook — 환각 ID (INV-2) 자동 차단, frontmatter schema 자동 검증
4. DELTA mode — `/plan-pipeline change "<topic>"` 시 영향 phase 자동 식별 (graph)
5. Phase 13 후 implementation — fresh subagent + 2-stage review (Superpowers 패턴)

## Install

### Claude Code 사용자 (권장)

```bash
claude code skill install @plan-pipeline/v4
# 또는 GitHub: claude code skill install <repo-url>
```

설치 후 첫 trigger:
```
/plan-pipeline init
```

### Non-Claude Code 사용자 (fallback)

v4.0은 Claude Code skill spec 기반. CC 외 사용자는 v3 markdown prompt를 직접 사용:

```bash
git clone <repo> v3-fallback
cd v3-fallback
git checkout v3-archive
# docs/spec/00-13.md를 LLM에 직접 paste
```

v3 markdown은 사용자가 직접 self-check grep 실행 + HARD-GATE 수동 확인 필요 (v4는 자동).

## Requirements

- Node.js 20+ (plugin 실행)
- Git (hook 자동 install)
- Claude Code subscriber (skill 사용 시)

## State source-of-truth (ADR-8)

Phase 진행 상태는 frontmatter `status` 필드가 authoritative source:

```yaml
---
phase: 5
status: Approved   # ← 이 값이 truth
---
```

`.plan-pipeline-cache/state.json`은 derived. 사용자가 frontmatter 수동 편집 시 hook이 cache rebuild.

## Hook chain (기존 hook 보존, INV-10)

기존 `.git/hooks/pre-commit` 있으면:
1. v4가 기존 hook을 `pre-commit.user-original`로 backup
2. 새 `pre-commit`이 backup 먼저 실행 → 그 후 v4 검증 실행
3. husky/lefthook 감지 시 v4는 자체 hook 작성 안 함 (사용자가 husky config에 line 추가 가이드)

## Telemetry (opt-in, default off — INV-9)

설치 시 명시 yes/no 질문. 익명 metric (PhaseStarted/PhaseApproved/HookBlock)만 전송. 사용자 spec 내용·식별자 0건 (INV-8).

Opt-out anytime: `/plan-pipeline opt-out`

## Troubleshooting

- **Windows hook 실행 안 됨:** Git for Windows의 Git Bash 사용 권장. WSL 사용자는 plugin이 Linux로 동작.
- **Node 미설치:** [nodejs.org](https://nodejs.org) 또는 nvm·fnm으로 Node 20+ install. plugin install 명령 안내 따름.
- **한국어 spec 깨짐:** 보고해주세요 (issue tracker). NFR-I18N-1 한국어 우선 검증 완료 (T0.9 spike).

## v3 → v4 migration (OQ-13-4)

**v4.0은 greenfield only.** 기존 v3 spec 보유 사용자는 v3 markdown 그대로 유지 (별 cycle에서 작업 계속). v4로 마이그레이션 도구는 v4.1 후보 (S3 Refactor와 함께).

## Architecture

- **Skills (ARCH-2):** 13 phase skill + orchestrator (`skills/manifest.json`)
- **Hooks (ARCH-3):** pre-commit chain (schema validate + ID consistency)
- **Graph Builder (ARCH-4):** unified+remark AST parse → 정의·인용 ID graph
- **Schema Validator (ARCH-5):** ajv-based frontmatter validate
- **ID Auto-gen (ARCH-6):** sequential counter, persistent
- **Telemetry Client (ARCH-7):** Plausible (EU region, GDPR auto)

자세한 spec: `docs/spec/examples/` (v4 plugin self-application)

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

PR welcome. v3 prompt 약점 발견 시 issue로 보고 — v4 plugin이 그것을 자동 강제로 처리하는 게 가치 핵심.
