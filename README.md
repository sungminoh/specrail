# specrail

> 13-phase spec discipline harness for Claude Code — structured I/O + hook validation + 도구로 강제

## Status

- v0.0.1-alpha (in-process)
- 500+ tests passing, 17/22 EDGE coverage
- npm publish: workflow ready, awaiting NPM_TOKEN secret
- Plausible telemetry: adapter ready, opt-in via .env
- CC marketplace: registration docs in [docs/MARKETPLACE.md](docs/MARKETPLACE.md)

단:
- Claude Code marketplace 실 install 미검증 (A1 spike PASSED-PARTIAL — `inputs-from` field 작동 확인 필요)
- Plausible endpoint 실 연결 0 (client logic만 — `send` mock injection)
- 실 사용자 사용 사례 0 (본인 dogfood만 — KPI-1·KPI-2·KPI-6 측정 0)
- npm publish 0 / marketplace 등록 0

LLM-assisted planning에서 "사용자 양심·기억 의존"으로 발생하는 phase skip·환각 ID를 hook + state machine으로 자동 강제하는 Claude Code plugin.

## What it does

1. `/specrail init` — docs/spec/ 자동 생성 + Phase 1 forcing questions 시작
2. Phase 1~13 순차 진행 — 각 phase status=Approved일 때만 다음 phase 진입 (INV-3 자동 강제)
3. Pre-commit hook — 환각 ID (INV-2) 자동 차단, frontmatter schema 자동 검증
4. DELTA mode — `/specrail change "<topic>"` 시 영향 phase 자동 식별 (graph)
5. Phase 13 후 implementation — fresh subagent + 2-stage review (Superpowers 패턴)

## Install

**Requirements:** Node 20+

```sh
npm install specrail
```

**Claude Code plugin install:** see [docs/MARKETPLACE.md](docs/MARKETPLACE.md).

**Telemetry config (optional):** see [docs/TELEMETRY.md](docs/TELEMETRY.md).

## Quickstart

```sh
specrail init       # Initialize spec
specrail status     # Show progress
specrail next       # Suggest next phase
specrail approve 1  # Approve phase N
specrail check      # Run lint
```

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

`.specrail-cache/state.json`은 derived. 사용자가 frontmatter 수동 편집 시 hook이 cache rebuild.

## Hook chain (기존 hook 보존, INV-10)

기존 `.git/hooks/pre-commit` 있으면:
1. specrail이 기존 hook을 `pre-commit.user-original`로 backup
2. 새 `pre-commit`이 backup 먼저 실행 → 그 후 specrail 검증 실행
3. husky/lefthook 감지 시 specrail은 자체 hook 작성 안 함 (사용자가 husky config에 line 추가 가이드)

## Telemetry (opt-in, default off — INV-9)

설치 시 명시 yes/no 질문. 익명 metric (PhaseStarted/PhaseApproved/HookBlock)만 전송. 사용자 spec 내용·식별자 0건 (INV-8).

Opt-out anytime: `/specrail opt-out`

## Language config (optional, default TypeScript)

기본값은 TypeScript stack (`npm run typecheck` + `vitest` + `.test.ts`). 다른 언어 프로젝트면 project root에 `.specrail.config.json` 생성:

```json
{ "extends": "python" }
```

Preset 4종 + 1 escape hatch:

| `extends` | testFilePattern | QualityReview 5-checklist (요지) |
|---|---|---|
| `typescript` (default) | `.test.ts` | tsc / vitest / ESM `.js` suffix / no TODO / Phase 4 naming |
| `python` | `_test.py` | mypy / pytest / ruff import sort / no TODO / Phase 4 naming |
| `go` | `_test.go` | go vet / go test / gofmt / no TODO / Phase 4 naming |
| `rust` | `.rs` | cargo check / cargo test / clippy `-D warnings` / no TODO / Phase 4 naming |
| `none` | — | empty checklist (QualityReview는 자동 PASS) |

영향 범위:
- **`specrail check`의 AC traceability** — `testFilePattern`에 매칭되는 파일에서 `AC-R*` 라벨 검색
- **Phase 13 subagent QualityReview prompt** — `qualityChecklist` 항목으로 5-check 본문 구성

부분 override (preset 상속 + 일부 변경):

```json
{
  "extends": "typescript",
  "testFilePattern": ".spec.ts",
  "qualityChecklist": [
    "typecheck: npm run typecheck → 0 errors",
    "tests: npm test → all green",
    "no TODO/FIXME comments"
  ]
}
```

설정 파일 없으면 TypeScript 기본값으로 동작.

## Troubleshooting

- **Windows hook 실행 안 됨:** Git for Windows의 Git Bash 사용 권장. WSL 사용자는 plugin이 Linux로 동작.
- **Node 미설치:** [nodejs.org](https://nodejs.org) 또는 nvm·fnm으로 Node 20+ install. plugin install 명령 안내 따름.
- **한국어 spec 깨짐:** 보고해주세요 (issue tracker). NFR-I18N-1 한국어 우선 검증 PASS (T0.9 spike).

## Architecture

- **Skills (ARCH-2):** 13 phase skill + orchestrator (`skills/manifest.json`)
- **Hooks (ARCH-3):** pre-commit chain (schema validate + ID consistency)
- **Graph Builder (ARCH-4):** unified+remark AST parse → 정의·인용 ID graph
- **Schema Validator (ARCH-5):** ajv-based frontmatter validate
- **ID Auto-gen (ARCH-6):** sequential counter, persistent
- **Telemetry Client (ARCH-7):** Plausible (EU region, GDPR auto)

자세한 spec: `docs/spec/examples/` (specrail self-application — 13-phase로 자기 자신을 설계한 결과물)

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

PR welcome. LLM이 spec 쓸 때 환각·phase skip을 일으키는 새 패턴 발견 시 issue로 보고 — specrail이 그것을 자동 강제로 처리하는 게 가치 핵심.
