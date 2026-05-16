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
6. `/specrail verify` — spec 항목별 implementation status를 코드·테스트·git에서 자동 도출

## Verification — `specrail verify`

Spec 안의 `Status:` 필드는 author **intent**(`Draft`나 `Approved`)만 표현합니다.
실제 구현 **reality**는 도구가 매번 새로 계산합니다 — drift 불가능한 single
source of truth:

```bash
specrail verify              # human-readable report
specrail verify --json       # machine-readable
specrail verify --md         # PR-comment friendly
specrail verify --filter R1  # 특정 ID만
specrail verify --no-tests   # vitest skip (faster but lower fidelity)
```

각 ID의 reality 5단계:

- 🟢 **Built** — 자동탐지 evidence 완전 (test 통과, 파일 존재 등)
- 🟡 **Partial** — 일부 evidence (children 일부 Built, 일부 NotBuilt 등)
- ⚪ **NotBuilt** — evidence 0건
- 🔵 **ManualReview** — semantic 영역 (ADR 등) — `**Verification:**` sign-off 필요
- 🟠 **ManualReview-Stale** — sign-off 있으나 관련 파일 hash 변경됨

ID 종류별 rule (요약):

| ID | 출처 |
|---|---|
| AC / TC / INV / EDGE / NFR | `tests/`에서 ID 참조 + 그 test 통과 |
| ARCH / EXT / OPS | spec 본문에 명시된 `src/...`, `.github/...` 경로 존재 |
| ENT | spec 본문의 entity 이름이 `src/` 안에 interface/type/class로 존재 |
| RB | `docs/runbooks/RB-{n}*.md` 존재 OR 정의 셀에 substantive body |
| T (task) | spec body의 `Files:` 경로 존재 + TODO/FIXME 0건 |
| OQ | row의 상태가 RESOLVED / DEFERRED / ADR 참조 |
| ADR | `**Verification:**` sign-off + 옵션 `sha:<short> path:<rel>` |
| R / F | 자식 AC + F + S를 roll-up |
| PAIN / KPI / RISK | 정의 근처 cross-reference 된 ID들의 reality를 roll-up |

### Verifier scope: shape presence, not shape quality

각 rule은 evidence가 **존재하는지**를 검사할 뿐, evidence의 **품질**은 검사하지
않습니다. 예:

- ENT rule: `interface User {}` 처럼 멤버가 없는 빈 stub은 reject. 하지만
  `interface User { _stub: never }`는 accept — 멤버가 있으므로 "shape는 존재"
  합니다. 그 멤버의 타입이 의미 있는지(`never` vs `string`)는 **code review의
  영역**이지 verifier의 책임이 아닙니다.
- OQ rule: row에 `Resolved` / `DEFERRED` / `ADR-N` 키워드가 있으면 Built.
  rationale 텍스트가 substantive한지(글자 수, 구조적 anchor 유무 등)는 검사하지
  않습니다. 바보같이 `DEFERRED`만 쓴 spec은 review가 잡아야 합니다.
- vitest rule: `it('AC-X', ...)` 안에 `expect(...)` 호출이 하나라도 있으면
  Built. `expect(1).toBe(1)` 같은 tautological assertion인지는 검사하지 않습니다
  — review나 runtime이 잡습니다.

**Why this matters**: 적대적 author가 "spec lie"를 만들기 위한 키워드는 verifier가
탐지하지만, 의미 없는 substance를 적어 review를 우회하는 건 verifier 범위 밖입니다.
verifier loop를 무한히 늘리지 않기 위한 honest cut입니다.

자동탐지가 못 잡는 항목은 spec에 explicit annotation을 추가하면 됩니다:

```markdown
### ADR-7: Telemetry endpoint — Plausible

**Verification:** Manual review by maintainer 2026-05-14 sha:abc1234 path:src/telemetry/plausible-adapter.ts
```

`Verification:` 블록의 `sha:` 가 현재 git blob SHA와 일치하지 않으면
ManualReview-Stale로 자동 표시되어 재 sign-off가 필요해집니다.

Pre-commit 통합: `src/hook/verify-status.ts`는 spec이 명시한 `Evidence:` /
`Files:` 경로가 실제로 존재하는지 검증. NotBuilt/Partial 자체는 commit을
막지 않지만 (작업 중인 상태도 commit해야 함), broken evidence pointer (예:
`src/no/such.ts`)는 commit을 차단합니다.

자세한 baseline은 [docs/verify-baseline-2026-05-14.md](docs/verify-baseline-2026-05-14.md).

## Install

**Requirements:** Node 20+

```sh
npm install specrail
```

This puts the CLI on your `PATH` (`specrail` binary) and ships the 13-phase skill collection at `node_modules/specrail/skills/`.

### After install — wire skills into Claude Code

Claude Code's plugin loader scans `~/.claude/plugins/<name>/`, not `node_modules/`. Copy or symlink the shipped `skills/` directory into your plugin cache:

```sh
# Symlink (recommended — auto-updates on npm upgrade)
mkdir -p ~/.claude/plugins
ln -sfn "$(npm root -g)/specrail/skills" ~/.claude/plugins/specrail
# (or, for a local install: ln -sfn "$(pwd)/node_modules/specrail/skills" ~/.claude/plugins/specrail)

# Or copy (stable snapshot)
cp -r "$(npm root -g)/specrail/skills" ~/.claude/plugins/specrail
```

Restart Claude Code; the orchestrator skill is now invokable as `/specrail`.

> A formal `.claude-plugin/plugin.json` manifest + marketplace listing is deferred to a future release. Until then, the skill drop-in above is the canonical install path. See [docs/MARKETPLACE.md](docs/MARKETPLACE.md) for context.

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
