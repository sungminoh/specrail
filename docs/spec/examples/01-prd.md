# PRD: Planning Pipeline Plugin (v4)

**Mode:** HOLD SCOPE (retroactive — PRD §10 변경 2026-05-12. 원래 SCOPE EXPANSION이었으나 dashboard 분리 결정으로 변경)
**Version:** 1.1 (DELTA — Mode 변경)
**Date:** 2026-05-10 (Mode 갱신 2026-05-12)
**Reference:** `/reference-v3/01-prd.md` (메인 prompt only — example 참조 금지)

## 1. 한 줄 정의

13단계 spec discipline을 Claude Code 안에서 structured I/O·hook으로 강제하는 plugin.

(Local web dashboard는 별 cycle — v4.5+. 본 v4의 산출물 frontmatter는 미래 dashboard read 호환 design.)

## 2. 문제 (Status Quo)

### 2.1 현재 상황 — v3 markdown 사용자

Builder가 v3 메인 prompt를 LLM에 paste → 산출물 markdown 작성 → self-check grep 수동 실행 → 다음 phase로. 13번 반복. 검토는 14개 markdown 파일 cross-reference하며 수동.

### 2.2 비용 (v3 사용 중 발견된 약점)

- **환각 ID:** Phase 5에서 "S1.2.3" 인용했는데 Phase 3에 정의 X. self-check grep으로 catch하지만 사후. 사용자가 다시 작성.
- **사용자 기억 의존:** "Phase 3에서 R1 뭐였지?" 매번 ctrl-F.
- **HARD-GATE 양심 의존:** LLM이 자기 prompt 따르길 기대. LLM이 무시하면 사용자가 catch해야.
- **검토 cumbersome:** dependency·status·산출물 모두 14개 파일에 분산.
- **Self-check 잊음:** 사용자가 grep 실행 안 하면 무용.

### 2.3 왜 지금

- Claude Code plugin SDK 성숙 (skill·tool·hook 패턴 표준화)
- v3 markdown 사용 중 위 약점 직접 경험 (이번 conversation)
- AI agent 능력 강화 → spec discipline 더 essential, 도구 강제 필요

## 3. 타겟 사용자

### 3.1 Primary Persona

v3 Builder Persona의 부분집합 — **Claude Code 사용자.**

- **별칭:** Builder (Claude Code user)
- **나이대:** 25-50
- **역할 / 상황:** v3 Persona 동일 (solo founder · small team · advanced student · AI 도구 자주 쓰는 professional). **추가 조건: Claude Code subscriber 또는 사용자.**
- **테크 친숙도:** 9-10/10 (Claude Code 사용자 평균 더 높음)
- **사용 환경:** 데스크톱 작업 + 브라우저 (대시보드)

### 3.2 Role

**Single-user.** plugin은 한 사용자 환경에 install. 사용자가 만드는 spec 내부의 multi-role은 별개.

### 3.3 핵심 시나리오

- **S1 (Greenfield):** Claude Code에서 `/plan-pipeline` 명령 → Phase 1 skill 호출 → 13phase 진행 → Phase 13 후 implementation 같은 세션에서.
- **S2 (DELTA):** 기존 spec 보유 → 변경 명령 → plugin이 영향 phase 자동 식별 (ID dependency graph) → ADDED/MODIFIED/REMOVED만 진행.
- **S3 (Refactor — P1):** 기존 codebase + spec 부재 → plugin이 codebase 분석 후 13 phase 역방향 채움. v4 첫 release scope X. v4.1 후보.

## 4. 핵심 가치

### 4.1 한 문장
"Claude Code 안에서 13단계 spec을 structured로 작성하면 hook이 자동 검증하고 대시보드가 시각화한다 — 사용자 양심 의존 제거."

### 4.2 차별점

- **vs v3 markdown:** structured I/O로 환각 ID 0건. hook이 self-check 자동. PAIN-4 검토 부담은 markdown rendered (GitHub·VS Code preview)로 부분 mitigate, 인터랙티브 검토는 v4.5 dashboard cycle에서. (단점: Claude Code 사용자만)
- **vs Superpowers:** 13 phase pre-implementation pipeline 전용 (Superpowers는 implementation skills). Phase 13에서 Superpowers 패턴 차용.
- **vs OpenSpec:** capability 단위 차용 + 13 phase 추가 + Claude Code 통합.
- **vs 일반 PRD template:** template 아닌 enforce하는 도구.

### 4.3 First-Principles Insight

v3에서 시도한 접근: "사용자 양심 + LLM 자율" → 약점은 양심·기억·grep 실행 의존.

v4 통찰: **Spec discipline은 도구로 강제할 때 진짜 작동.** 사용자가 잊어도, LLM이 무시해도, 도구가 차단. 양심·기억은 fail-prone, 도구는 deterministic.

Conventional 접근 (PRD template Notion에 채움): 사용자가 template 채울 의지 있어야. v4: 채워야만 다음 진행 가능 (HARD-GATE 도구로 enforce).

## 5. 환경 / 카테고리

- **Product 카테고리:** Claude Code plugin (개발자 도구)
- **플랫폼:** Claude Code 작동 모든 OS (macOS · Linux · Windows WSL)
- **사용 환경:** terminal (Claude Code session). 산출물 검토는 markdown rendered (GitHub·VS Code preview).
- **Connectivity:** offline-friendly (LLM API 호출만 online; structured spec·hook은 local)

## 6. Non-Goals

- ❌ **AI 모델 자체 만들기** — Claude Code 위에 작동
- ❌ **Code generation 도구** — Phase 13 후 Claude Code agent에 위임
- ❌ **IDE / editor 확장** — Claude Code skill만, VS Code extension 별개
- ❌ **단일 도메인 templating** — 메타 그대로
- ❌ **Project management** — issue tracking·sprint 사용자 기존 도구
- ❌ **Claude Code 외 다른 agent (Cursor·Aider 등) tooling** — v3 markdown으로 fallback
- ❌ **Real-time collaboration** — single-user
- ❌ **Marketplace 직접 운영** — GitHub OSS로
- ❌ **Local web dashboard** — 별 cycle (v4.5+). 본 v4는 frontmatter schema가 미래 dashboard 호환 design만 보장.

(v3 §6의 "GUI 안 만듦" "자동 spec 검증 안 만듦"은 v4에서 ADR-superseded — hook은 자동 검증, dashboard는 v4.5로 분리.)

## 7. 성공 지표

| 지표 ID | 지표 | 단위 | 목표 | 측정 시점 |
|---|---|---|---|---|
| KPI-1 | plugin install 후 첫 spec 완주율 | % | 80% | 출시 6개월 |
| KPI-2 | 환각 ID 발생 (정의 안 된 ID 인용) | per session | 0 | hook 통과 시 자동 0 |
| KPI-3 | 13 phase 사양화 시간 (AI 보조) | 시간 | <6 | 첫 사용 |
| KPI-4 | GitHub stars | count | 500 | 출시 1년 |
| KPI-6 | hook 차단 후 사용자 수정 비율 (정당한 차단) | % | >85% | hook log |

(KPI-5 dashboard 사용 빈도 — v4.5 cycle로 이동.)

## 8. 가정

| ID | 가정 | 검증 방법 | Risk Level |
|---|---|---|---|
| A1 | Claude Code plugin SDK가 13 skill orchestration 가능 | 기술 spike Phase 8/12 | High |
| A2 | fresh subagent 패턴이 spec phase에 작동 (산출물 self-sufficiency 강제) | dogfood (이번 v4 작업 자체) | High |
| A4 | structured frontmatter + markdown body가 LLM 응답 quality 유지 | dogfood + sample test | Med |
| A5 | 사용자가 Claude Code subscriber라 비용 부담 적음 | 사용자 segment 분석 | Low |

(A3 dashboard 관련 가정 — v4.5 cycle로 이동.)

## 9. Open Questions

| Q ID | 질문 | 결정자 | 마감 | Blocking? |
|---|---|---|---|---|
| OQ-1-1 | Claude Code plugin marketplace 등록 vs GitHub OSS only | maintainer | 출시 전 | N |
| OQ-1-2 | 대시보드 multi-project tab (한 brower에 여러 spec) — v4 또는 v4.1 | maintainer | Phase 6 IA | N |
| OQ-1-3 | Claude Code 외 사용자 fallback 가이드 (v3 markdown 직접) — README 어디 | maintainer | Phase 6 | N |
| OQ-1-4 | telemetry opt-in mechanism (KPI-5·6 측정) | maintainer | Phase 11 | N |
| OQ-1-5 | Refactor (S3, P1) v4.1 또는 v4.2 | maintainer | Phase 13 | N |

## 10. Mode 결정 근거

**HOLD SCOPE.** 단일 product (harness)에 집중. Boil the Lake 정확한 응용 — "끓일 수 있는 호수" (단일 module fully scoped).

이전 EXPANSION 결정은 두 product (harness + dashboard) 동시 — Lake 두 개 = Ocean. 본 cycle은 harness 견고하게.

Dashboard·다중 LLM·AI auto-review 등은 별 cycle (v4.5+).

남는 R 8개 (R3 dashboard 제거): R1·R2·R4·R5·R6·R7·R8·R13.

## 11. 다음 phase 인풋

Phase 2 (Persona·Journey)에:
- §3.1 Primary Persona (Claude Code 사용자, v3 Persona 부분집합)
- §3.3 시나리오 3개 (S1 Greenfield, S2 DELTA, S3 Refactor — S3는 P1)

(v3 example의 Builder Persona·시나리오 참조 X — v4 example은 만드는 중.)
