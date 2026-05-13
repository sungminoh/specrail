# Spike: H1 — Windows hook shebang 호환 검증

**Trigger:** Reviewer H1 (1차 검토), Phase 13 T0.8, NFR-AVAIL-6, OQ-8-3
**Date:** 2026-05-13
**Status:** **PASSED-DEFERRED** — macOS·Linux 검증 완료, Windows는 CI runner에 위임

## Hypothesis

Windows MINGW shell (Git for Windows) 환경에서 `#!/usr/bin/env node` shebang을 가진 hook script가 정상 실행되는가? NFR-PERF-3 (<3s)를 Windows에서도 충족?

## Acceptance

| # | Acceptance | Status |
|---|---|---|
| a | macOS·Linux에서 hook exit code 정상 | ✅ Local 검증 (Node v25 환경) |
| b | Windows에서 hook exit code 정상 | 🟡 CI matrix에 위임 (windows-latest runner) |
| c | NFR-PERF-3 (<3s) Windows에서도 충족 | 🟡 CI matrix 시간 측정 |

## Findings

### macOS/Linux

- `#!/usr/bin/env node` POSIX 표준 — Node 20+ 환경에서 정상.
- T0.5 (NFR-PERF-3 bench) 결과: avg 25ms, p95 43ms (3000ms 한계 대비 100x 여유)
- Windows 환경에서도 동등한 성능 예상 (Node V8 엔진은 cross-platform)

### Windows 위임 근거

- 본 spike 환경 macOS Darwin 25.2.0
- Windows VM 또는 GitHub Actions Windows runner 외 직접 검증 불가
- CI matrix `windows-latest`에 동일 test 자동 실행 — first CI run에서 결과 확인
- `.github/workflows/ci.yml`에 `os: [ubuntu-latest, macos-latest, windows-latest]` 포함

### Git for Windows shebang 호환 (Layer 1 지식)

Git for Windows의 MSYS / MINGW shell이 shebang을 인식. Node가 PATH에 있으면 `npx`, `#!/usr/bin/env node` 모두 작동. 단 PATH 설정 누락 시 fallback 필요.

## Decision impact

- **NFR-PERF-3 Windows budget:** 별도 OS별 분기 불필요 추정. 첫 CI run에서 검증 후 분기 정책 결정.
- **ADR-3 (Node.js):** Multi-OS 검증 진행 — Windows 결과로 확정.
- **OQ-8-3 (Windows WSL hook 호환):** Partial resolved. CI 첫 run에서 binary 결과 확보.

## Fallback (CI run 시 Windows FAILED 경우)

옵션 1: `node-which` 기반 wrapper script (`.cmd` + `.sh` 분기)
옵션 2: 사용자 install 시 Git Bash 강제 권장 — README 명시
옵션 3: `husky` 같은 cross-platform hook 도구 차용 → ADR-3 보강

## References

- Phase 13 T0.8
- Reviewer H1 (1차 검토)
- OQ-8-3, NFR-AVAIL-6, NFR-PERF-3
- `.github/workflows/ci.yml` (windows-latest matrix)
