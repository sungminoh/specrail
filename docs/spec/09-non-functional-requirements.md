---
phase: 9
status: Approved
---

# Non-Functional Requirements

**Mode:** HOLD SCOPE
**Inputs:** PRD §4 KPI, Phase 8 ARCH·EXT
**Date:** 2026-05-10 (harness only)

> Plugin은 passive 산출물이 아닌 실 작동 code (skills + hooks + builders). 7 domains 모두 적용.

## 1. Performance (Perf)

Plugin이 직접 측정·enforce 가능한 perf NFR. NFR-PERF-2 (LLM 응답)와
NFR-PERF-7 (누적 사양화 시간 self-report)는 CC·user 측이라 별도 분리.

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-PERF-1 | Skill invocation 시간 (LLM 응답 제외) | ms | <500 | log + 평균 | 사용자 phase 진행 흐름 끊김 (KPI-1 ↓) |
| NFR-PERF-3 | Pre-commit hook 실행 시간 | s | <3 | git timing | 사용자 commit 부담 — hook bypass 욕구 |
| NFR-PERF-4 | Dependency graph 빌드 시간 (cold) | s | <2 (한 project 평균) | bench | 첫 hook·skill 실행 지연 |
| NFR-PERF-5 | Dependency graph 빌드 시간 (incremental, file watch) | ms | <300 | bench | UI 반응 지연 |
| NFR-PERF-6 | Schema validation 시간 (한 phase frontmatter) | ms | <100 | bench | hook 누적 지연 |

<!-- specrail:ignore-start -->

(아래는 plugin 외부 측정 — verifier matrix 제외)

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-PERF-2 | LLM 응답 시간 (한 phase 산출물 생성) | s | <60 | LLM API log | 사용자 이탈 (KPI-1 ↓) |
| NFR-PERF-7 | 13 phase 사양화 누적 시간 (AI 보조) | h | <6 | 사용자 self-report | KPI-3 미달 |

<!-- specrail:ignore-end -->

PRD KPI 직접 매핑:
- KPI-1 (완주율) → NFR-PERF-1·2·3 모두 (지연이 누적 이탈 원인)
- KPI-3 (사양화 시간) → NFR-PERF-7

## 2. Scalability (Scal)

이 product는 server 없음. Scalability = **per-user spec 크기 한계 + plugin이 견디는 ID·노드 수**.

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-SCAL-1 | 한 phase 산출물 크기 한계 | KB | LLM context 한계 따름 (~50KB body) | LLM 응답 모니터 | LLM 응답 잘림 → 사용자가 phase 분할 |
| NFR-SCAL-2 | Project 내 누적 ID 수 (Spec·Entity·INV·NFR·OPS·ADR·RISK·TC 등) | count | <5000 | dependency graph node count | graph 빌드 지연 → NFR-PERF-4 위반 |
| NFR-SCAL-5 | 한 사용자 동시 multi-project | concurrent | 무제한 (각 docs/spec 분리) | - | ID counter 충돌 X (per-project) |

<!-- specrail:ignore-start -->

(아래는 scope 결정 (deferred / N-A) — verifier matrix 제외)

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-SCAL-3 | DELTA changes 누적 수 (per project) | count | <500 | file system | timeline navigation 지연 (향후 cycle) |
| NFR-SCAL-4 | 동시 사용자 (서로 다른 머신) | concurrent | 무제한 (각자 환경) | - | 무관 |

<!-- specrail:ignore-end -->

이 product가 popular 해져도 (KPI-4: 500 stars) 인프라 비용 증가 X — passive code.

## 3. Availability (Avail)

NFR-AVAIL은 대부분 plugin 외부 책임 (CC·git·LLM API·사용자 측). plugin이
직접 enforce·test 할 수 있는 건 NFR-AVAIL-6 (hook 자체 실패) 뿐. 나머지는
scope 결정으로 documented, verifier intent matrix 밖.

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-AVAIL-6 | Hook 자체 실패 (script error) | error rate | <0.1% | hook log | 사용자가 hook bypass 욕구 — INV-3 위반 위험 |

<!-- specrail:ignore-start -->

(아래는 plugin 외부 책임으로 documented — verifier matrix 제외)

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-AVAIL-1 | Plugin install 가용성 | % | fork 후 사용자 측 책임 | 사용자 측 | 무관 (passive code) |
| NFR-AVAIL-2 | EXT-1 Claude Code 다운 시 처리 | - | 의존 (필수) | CC 측 | plugin 무용 — Persona가 다른 시간 사용 |
| NFR-AVAIL-3 | EXT-2 LLM API 다운 시 | - | CC가 fallback 또는 사용자 대기 | CC 측 | phase 진행 일시 정지 |
| NFR-AVAIL-4 | EXT-3 Git Hosting 다운 시 | - | local git 작동, push만 막힘 | git 측 | hook 작동 가능 (local git) |
| NFR-AVAIL-5 | EXT-5 Telemetry endpoint 다운 시 | - | local queue 보존, 재전송 | local | 사용자 무관 (background) |
| NFR-AVAIL-7 | RPO (사용자 spec 손실) | - | 사용자 git push 빈도 결정 | - | 사용자 책임 (가이드 README) |
| NFR-AVAIL-8 | RTO | - | 즉시 (clone + plugin install) | - | 사용자 책임 |

<!-- specrail:ignore-end -->

Cognitive Pattern: **Error budgets** — 99.9% SLO = 0.1% budget. budget을 ship에 spend.

## 4. Security (Sec) — STRIDE

### Spoofing
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-2 | Hook bypass (사용자가 `--no-verify`로 commit) | hook은 plugin이 enforce 못 함 — git 자체 한계. 가이드 + telemetry로 detection (R13). 진짜 enforce는 CI에서 (사용자 측). |

### Tampering
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-4 | 사용자 spec 직접 변조 (frontmatter 수동 수정) | hook이 schema 검증 + ID consistency check (INV-1, INV-2) |
| NFR-SEC-5 | `.specrail-cache/` 변조 (graph cache 위조) | hook이 cache invalidate + rebuild on commit |

### Information Disclosure
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-7 | 사용자가 spec에 secret/API key/PII 적고 LLM에 paste | README + Phase 1 prompt에 경고. Pre-commit hook이 secret pattern detection (optional, opt-in F) |
| NFR-SEC-9 | Telemetry event에 spec 내용 누출 (R13) | INV-8 enforce. Schema validator가 metadata 검사 — 허용된 field만 |

### DoS
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-10 | Malicious 사용자가 매우 큰 spec 작성 → graph 빌드 메모리 고갈 | NFR-SCAL-2 한계 (5000 node) + builder timeout (30s) → graceful degradation |
| NFR-SEC-11 | Hook script가 무한 loop (변조됨) | hook timeout (10s) — git이 자동 abort |

### Elevation of Privilege
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-12 | Hook script가 임의 명령 실행 (사용자 머신에 RCE) | maintainer 자체 hook script만 install, 사용자 명시 confirm 후 install (AC-R6-3) |

<!-- specrail:ignore-start -->

(아래는 process · out-of-plugin · endpoint side — verifier matrix 제외)

### Spoofing (process/out-of-scope)
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-1 | Malicious plugin update (사용자가 가짜 plugin 설치) | maintainer signed release, README "공식 source 확인" |

### Tampering (process)
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-3 | Malicious PR로 plugin skill에 jailbreak 삽입 | PR review 강제, signed tag, marketplace verification |

### Repudiation (user responsibility)
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-6 | 사용자가 자기 spec 변경 부인 | git history (사용자 책임 — out of plugin scope) |

### Information Disclosure (guidance only)
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-8 | 사용자가 spec에 proprietary info 적고 public LLM에 paste (회사 정책 위반) | README "회사 환경에서 self-hosted LLM 또는 enterprise plan 권장" |

### Elevation (endpoint-side)
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-13 | Telemetry payload injection (endpoint side) | endpoint validation, plugin 자체 권한 상승 X (single-user single-machine) |

<!-- specrail:ignore-end -->

### Compliance 후보
| ID | 의무 | 적용 |
|---|---|---|
| NFR-SEC-COMP-1 | OSS 라이선스 (MIT 등) | LICENSE 파일 강제 |
| NFR-SEC-COMP-2 | 사용자 GDPR/HIPAA 환경 | 가이드 (사용자 책임 — README + telemetry opt-out 안내) |

## 5. Privacy (Priv)

PRD §3 Persona 데이터 + Phase 4 Entity 분류.

| ID | 데이터 | 분류 | 처리 정책 |
|---|---|---|---|
| NFR-PRIV-3 | Telemetry event metadata | 익명 (anonProjectHash) | INV-8 — spec 내용 0건. project root path SHA256 (irreversible) |
| NFR-PRIV-4 | TelemetryConsent | 사용자 명시 동의 | INV-9 — default OptedOut. opt-in 명시 후만 전송. |
| NFR-PRIV-5 | Plugin이 사용자 file system access 범위 | 최소 권한 | docs/spec/, .git/hooks/, .specrail-cache/, ~/.specrail/만 — 명시 |

<!-- specrail:ignore-start -->

(아래는 사용자·LLM provider 책임 — verifier matrix 제외)

| ID | 데이터 | 분류 | 처리 정책 |
|---|---|---|---|
| NFR-PRIV-1 | 사용자가 spec에 적는 idea·persona·시나리오·PAIN | 사용자 측 (PII 가능) | 이 product는 저장 안 함. 사용자 git repo + LLM API에만. README에 LLM 데이터 처리 정책 확인 권장. |
| NFR-PRIV-2 | 사용자가 LLM에 paste한 prompt | 사용자 측 | LLM provider 정책 따름 (Claude Code 측 책임) |

<!-- specrail:ignore-end -->

해당 권리:
- 데이터 export: 사용자 git pull (사용자 책임)
- 데이터 삭제: opt-out + 데이터 삭제 요청 (R13.F3) — 익명 hash이라 매칭 어려움이 trade-off
- 동의: opt-in only (R13.F1)
- 데이터 region: telemetry endpoint host 시점 결정 (ADR-CAND-7)

## 6. Accessibility (A11y)

Plugin 자체는 terminal·markdown surface. WCAG 2.1 AA 적용. NFR-A11Y-3
(code block fence)만 spec authoring 시 grep으로 자동 verify 가능. 나머지는
code review·manual·terminal/IDE 측 책임 — verifier matrix 제외.

| ID | NFR | 측정 방법 |
|---|---|---|
| NFR-A11Y-3 | Code block fence + lang 명시 | grep `^\`\`\`` |

<!-- specrail:ignore-start -->

(아래는 manual review 또는 terminal·IDE 측 책임 — verifier matrix 제외)

| ID | NFR | 측정 방법 |
|---|---|---|
| NFR-A11Y-1 | 모든 status는 색 + icon + text (색만 X) | code review |
| NFR-A11Y-2 | Markdown semantic 위계 일관 (H1/H2/H3) | grep `^##+` |
| NFR-A11Y-4 | Mermaid 다이어그램 alt text 또는 prose 동등 설명 | 각 다이어그램 옆 prose |
| NFR-A11Y-5 | Hyperlink descriptive ("여기 클릭" 금지) | review |
| NFR-A11Y-6 | Terminal output screen reader 친화 (markdown native) | manual |
| NFR-A11Y-7 | Keyboard navigation (terminal 자체 + IDE 자체) | 자동 (terminal·IDE 측) |

<!-- specrail:ignore-end -->

(Dashboard a11y — color contrast·focus indicator·ARIA 등 — 향후 cycle.)

## 7. Internationalization (i18n)

NFR-I18N-1 (한국어 우선) 와 NFR-I18N-4/5 (UTC·ISO 8601 timestamp) 는 plugin
이 직접 enforce. 나머지는 scope 결정 (branch 전략·사용자 자유·미지원 RTL).

| ID | NFR | 정책 |
|---|---|---|
| NFR-I18N-1 | 기본 언어 (plugin 자체 — skill prompt) | 한국어 우선 |
| NFR-I18N-4 | 시간대 (Telemetry timestamp) | UTC 저장 |
| NFR-I18N-5 | 날짜 형식 | ISO 8601 (YYYY-MM-DD) |

<!-- specrail:ignore-start -->

(아래는 scope 결정으로 documented — verifier matrix 제외)

| ID | NFR | 정책 |
|---|---|---|
| NFR-I18N-2 | 추가 언어 | 영어 — branch 또는 디렉토리 분리  |
| NFR-I18N-3 | 사용자 spec 언어 | 사용자 자유 — plugin 무관 |
| NFR-I18N-6 | 텍스트 길이 | 한국어/영어 차이 약 1.5x — markdown 표 자동 wrap |
| NFR-I18N-7 | RTL 지원 | 미지원 (한국어·영어만) |

<!-- specrail:ignore-end -->

## 8. NFR ↔ ARCH 매핑

| NFR | 영향받는 ARCH |
|---|---|
| NFR-PERF-1 (skill invoke) | ARCH-2 |
| NFR-PERF-2 (LLM 응답) | ARCH-1 (CC measure), EXT-2 |
| NFR-PERF-3 (hook 실행) | ARCH-3, ARCH-4, ARCH-5 |
| NFR-PERF-4·5 (graph 빌드) | ARCH-4 |
| NFR-PERF-6 (schema 검증) | ARCH-5 |
| NFR-SCAL-2 (누적 ID) | ARCH-4, ARCH-6 |
| NFR-AVAIL-6 (hook 실패) | ARCH-3 |
| NFR-SEC-3 (PR jailbreak) | ARCH-2 (maintainer) |
| NFR-SEC-4 (spec 변조) | ARCH-3, ARCH-5 |
| NFR-SEC-7 (PII LLM paste) | ARCH-spec (사용자 측) — 가이드만 |
| NFR-SEC-9 (telemetry leak) | ARCH-7 |
| NFR-PRIV-3·4 | ARCH-7 |
| NFR-A11Y-* | ARCH-2 (skill 산출물 형식) |

## 9. PRD KPI ↔ NFR 매핑

| KPI | 지원 NFR |
|---|---|
| KPI-1 완주율 80% | NFR-PERF-1·2·3 (응답 빠름), NFR-AVAIL-2·3 (CC·LLM 가용), NFR-SEC-2 (hook bypass 억제) |
| KPI-2 환각 ID 0 | NFR-SEC-4 (spec 변조 차단) |
| KPI-3 사양화 시간 <6h | NFR-PERF-7 (누적 시간) |
| KPI-4 GitHub stars 500 | (NFR 비종속, marketing·quality 의존) |
| KPI-6 hook 정당 차단 >85% | NFR-AVAIL-6 (hook 실패율 <0.1%) |

## 10. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-9-1 | NFR-SEC-7 secret pattern detection — base 또는 opt-in F? | maintainer | Phase 12 |
| OQ-9-2 | NFR-PERF-3 hook timeout — 3s 한계 합리? graph 큰 project에서 검증 | maintainer | Phase 10 spike |
| OQ-9-3 | NFR-SCAL-2 누적 ID 5000 한계 — 실 사용 시 도달 가능성? per-project archive 정책 | maintainer | Phase 11 |
| OQ-9-4 | NFR-PRIV-3 telemetry endpoint host (region·jurisdiction) | maintainer | ADR-CAND-7 |

## 11. 다음 phase 인풋

Phase 10 (Test Strategy)에:
- 측정가능 NFR 모두 (PERF·SCAL 모두 → bench/perf test)
- INV cover (특히 INV-2 환각 ID·INV-8 telemetry privacy)
- Edge case: 매우 큰 spec, multi-project 동시, hook 변조

Phase 11 (Operations)에:
- AVAIL·SEC·PRIV NFR (deploy·monitoring 정책)
- Telemetry endpoint 운영 (R13)
- DR: 사용자 spec backup 가이드

Phase 12 (ADR)에:
- 모든 ADR-CAND-1~10 (Phase 8) + ADR-CAND-7 telemetry host

---

## 11. Attrs blocks (M-CSA — schema v1.0)

Per `skills/_common/principles.md` §"Attrs Blocks Are Mandatory". Each NFR row in §1–§7 gets a schema-valid attrs block here. `target`/`unit`/`measure-method` placeholders ("see row") point readers back to the source table — the structured fields are bulk-scaffolded for KPI-7 coverage; per-NFR substantive values are a 0.3.0 codemod follow-up.

<!-- specrail:attrs id=NFR-AVAIL-1 -->
```yaml
status: Approved
target: "fork 후 사용자 측 책임"
unit: "%"
measure-method: "사용자 측"
linked-arch: ["ARCH-3"]
violates-action: "무관 (passive code)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-2 -->
```yaml
status: Approved
target: "의존 (필수)"
unit: "-"
measure-method: "CC 측"
linked-arch: ["ARCH-3"]
violates-action: "plugin 무용 — Persona가 다른 시간 사용"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-3 -->
```yaml
status: Approved
target: "CC가 fallback 또는 사용자 대기"
unit: "-"
measure-method: "CC 측"
linked-arch: ["ARCH-3"]
violates-action: "phase 진행 일시 정지"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-4 -->
```yaml
status: Approved
target: "local git 작동, push만 막힘"
unit: "-"
measure-method: "git 측"
linked-arch: ["ARCH-3"]
violates-action: "hook 작동 가능 (local git)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-5 -->
```yaml
status: Approved
target: "local queue 보존, 재전송"
unit: "-"
measure-method: "local"
linked-arch: ["ARCH-3"]
violates-action: "사용자 무관 (background)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-6 -->
```yaml
status: Approved
target: "<0.1%"
unit: "error rate"
measure-method: "hook log"
linked-arch: ["ARCH-3"]
violates-action: "사용자가 hook bypass 욕구 — INV-3 위반 위험"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-7 -->
```yaml
status: Approved
target: "사용자 git push 빈도 결정"
unit: "-"
measure-method: "-"
linked-arch: ["ARCH-3"]
violates-action: "사용자 책임 (가이드 README)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-AVAIL-8 -->
```yaml
status: Approved
target: "즉시 (clone + plugin install)"
unit: "-"
measure-method: "-"
linked-arch: ["ARCH-3"]
violates-action: "사용자 책임"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-1 -->
```yaml
status: Approved
target: "<500"
unit: "ms"
measure-method: "log + 평균"
linked-arch: ["ARCH-3","ARCH-4"]
violates-action: "사용자 phase 진행 흐름 끊김 (KPI-1 ↓)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-2 -->
```yaml
status: Approved
target: "<60"
unit: "s"
measure-method: "LLM API log"
linked-arch: ["ARCH-3","ARCH-4"]
violates-action: "사용자 이탈 (KPI-1 ↓)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-3 -->
```yaml
status: Approved
target: "<3"
unit: "s"
measure-method: "git timing"
linked-arch: ["ARCH-3","ARCH-4"]
violates-action: "사용자 commit 부담 — hook bypass 욕구"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-4 -->
```yaml
status: Approved
target: "<2 (한 project 평균)"
unit: "s"
measure-method: "bench"
linked-arch: ["ARCH-3","ARCH-4"]
violates-action: "첫 hook·skill 실행 지연"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-5 -->
```yaml
status: Approved
target: "<300"
unit: "ms"
measure-method: "bench"
linked-arch: ["ARCH-3","ARCH-4"]
violates-action: "UI 반응 지연"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-6 -->
```yaml
status: Approved
target: "<100"
unit: "ms"
measure-method: "bench"
linked-arch: ["ARCH-3","ARCH-4"]
violates-action: "hook 누적 지연"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PERF-7 -->
```yaml
status: Approved
target: "<6"
unit: "h"
measure-method: "사용자 self-report"
linked-arch: ["ARCH-3","ARCH-4"]
violates-action: "KPI-3 미달"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PRIV-1 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-7"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PRIV-2 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-7"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PRIV-3 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-7"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PRIV-4 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-7"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-PRIV-5 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-7"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SCAL-1 -->
```yaml
status: Approved
target: "LLM context 한계 따름 (~50KB body)"
unit: "KB"
measure-method: "LLM 응답 모니터"
linked-arch: ["ARCH-2","ARCH-4"]
violates-action: "LLM 응답 잘림 → 사용자가 phase 분할"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SCAL-2 -->
```yaml
status: Approved
target: "<5000"
unit: "count"
measure-method: "dependency graph node count"
linked-arch: ["ARCH-2","ARCH-4"]
violates-action: "graph 빌드 지연 → NFR-PERF-4 위반"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SCAL-3 -->
```yaml
status: Approved
target: "<500"
unit: "count"
measure-method: "file system"
linked-arch: ["ARCH-2","ARCH-4"]
violates-action: "timeline navigation 지연 (향후 cycle)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SCAL-4 -->
```yaml
status: Approved
target: "무제한 (각자 환경)"
unit: "concurrent"
measure-method: "-"
linked-arch: ["ARCH-2","ARCH-4"]
violates-action: "무관"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SCAL-5 -->
```yaml
status: Approved
target: "무제한 (각 docs/spec 분리)"
unit: "concurrent"
measure-method: "-"
linked-arch: ["ARCH-2","ARCH-4"]
violates-action: "ID counter 충돌 X (per-project)"
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-1 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-10 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-11 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-12 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-13 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-2 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-3 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-4 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-5 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-6 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-7 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-8 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=NFR-SEC-9 -->
```yaml
status: Approved
target: "see row"
unit: "see row"
measure-method: "see row"
linked-arch: ["ARCH-3","ARCH-5"]
last-modified: 2026-05-16
```
<!-- /specrail:attrs -->

