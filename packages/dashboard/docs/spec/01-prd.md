---
phase: 1
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' (forcing Q2-Q6 escape hatch 후 일괄 승인)"
upstream-context: ../../../../docs/superpowers/specs/2026-05-16-specrail-dashboard-design.md
upstream-product: "specrail (plugin)"
---

# PRD: specrail dashboard

**Mode:** HOLD SCOPE
**Version:** 1.0
**Date:** 2026-05-17

## 1. 한 줄 정의

specrail spec 을 view·관계·AI review 하는 local 웹앱.

## 2. 문제 (Status Quo)

### 2.1 현재 상황

specrail plugin 사용자(Builder)는 13개 phase markdown 을 VS Code/vim/GitHub preview 에 띄워 직접 cross-reference 한다. "Phase 5 에서 R3 가 뭐였지" → ctrl-F → 01-prd.md 열어 검색 → 다시 phase 5 로 복귀. 한 검토 session 에 동일 ID 를 평균 6-10회 ctrl-F. Phase 13 implementation plan 의 한 task 가 어떤 R/F 를 만족하는지 추적하려면 6 단계(T→TC→AC→F→R) 의 cross-ref 를 사람이 따라감.

### 2.2 비용

- **시간:** Spec 검토 1 session 당 ctrl-F + 파일 전환에 15-25분. Plugin 만들면서 본인이 매주 3-5회 진행 (≥ 1시간/주).
- **정신적 부담:** ID 일관성 (예: F1.2 가 정의된 phase, 참조하는 phase, 영향받는 task) 을 머릿속에서 그래프로 유지. 5분만 끊겨도 다시 잡는 데 분 단위 소모. PAIN-2 ("Phase 3 에서 R1 뭐였지" 매번 ctrl-F) — plugin PRD §2.2 에 명시.
- **잃는 기회 / 결과:** 검토 부담이 크니 검토 빈도가 낮아짐 → DELTA 변경의 downstream 영향 누락 → spec drift. AI 가 spec 을 자유 형식 prose 로 읽고 의미적 품질 review (예: "이 NFR 은 측정 불가") 를 하는 단계가 plugin self-check 와 별개로 없어, 결정적 검사 통과해도 의미적 결함이 잔존.

### 2.3 왜 지금

- 2026-05-15 `core-schema-attrs` DELTA 가 plugin 의 spec 을 product-grade dashboard data source 로 격상 — frontmatter + per-entity attrs block 이 안정화되어 dashboard 가 read 할 contract 가 처음으로 존재.
- Claude Code CLI 의 `--output-format stream-json` 이 안정화되어 subprocess 기반 AI 통합이 API key 관리 없이 가능.
- specrail plugin PRD §10 이 dashboard 를 별 cycle 로 명시 — 본 cycle 이 그 약속의 첫 이행.

## 3. 타겟 사용자

### 3.1 Primary Persona

<!-- specrail:attrs id=PERSONA-1 -->
```yaml
alias: Spec-Driven Builder
role: "specrail plugin 을 자기 product 에 적용 중인 Claude Code 사용자"
primary-pain: PAIN-2
tech-fluency: 9
daily-context: "데스크톱 + 브라우저 + Claude Code CLI 병행"
status: Draft
since: 2026-05-17
```
<!-- /specrail:attrs -->

- **별칭:** Spec-Driven Builder (specrail user)
- **역할 / 상황:** specrail plugin 을 자기 product 에 적용해 13 phase spec 을 운용 중. solo founder · small team lead · advanced student. **Claude Code subscriber + specrail 0.3+ 설치자**.
- **하루:** 코드 작업 ~60%, spec 작성·검토·DELTA ~25%, 기타 ~15%. spec 작업 중 ctrl-F·파일 전환에 1 session 당 15-25분.
- **고통 (Pain Priority):**
  1. PAIN-2 (기억 의존, ctrl-F 반복) — **1순위**
  2. PAIN-4 (cross-phase 검토 cumbersome) — 1순위와 결합
  3. PAIN-AI-1 (의미적 review 부재 — 결정적 검사로 못 잡는 품질 결함)
- **가장 얻고 싶은 것:** spec 한 곳에서 흐름을 보고, 의심 가는 부분을 AI 와 대화하며 즉시 고칠 수 있는 단일 인터페이스.
- **가장 두려워하는 결과:** dashboard 가 또 하나의 분산된 도구가 되어 GitHub/VS Code/CLI 사이를 한 군데 더 늘리는 것. silent spec drift.

### 3.2 Edge Persona (참조용, 본 cycle 비타겟)

<!-- specrail:attrs id=PERSONA-EDGE-1 -->
```yaml
alias: Non-developer maker
role: "PM·디자이너가 specrail 적용"
primary-pain: PAIN-2
status: Deferred
defer-reason: "v1 desktop dev tool. Touch UI·visual editor 후속 cycle."
```
<!-- /specrail:attrs -->

- **무시했을 때 깨지는 것:** AI 시대 신규 사용자층. v2 에서 touch-friendly 모드 검토.

### 3.3 Role (시스템이 인식할 사용자 종류)

**단일 사용자, role 없음.** OSS local self-host, auth 없음. 다중 사용자·hosted 모드는 별 cycle.

### 3.4 핵심 시나리오 (3개)

<!-- specrail:attrs id=SCEN-1 -->
```yaml
persona: PERSONA-1
trigger: "DELTA proposal 작성 중 downstream 영향 확인 필요"
status: Draft
```
<!-- /specrail:attrs -->

**SCEN-1 (Daily cross-ref):** PERSONA-1 이 phase 13 task 를 정의하다가 그 task 가 어떤 NFR 을 만족하는지 추적 필요. Dashboard 의 phase view 에서 task ID 클릭 → 우측 Refs 탭에 outbound 6개(TC, AC, F, R, NFR, ADR) 가 즉시 표시 → hover 로 정의 미리보기 → 클릭으로 해당 phase 점프. 기존: 6번 ctrl-F + 파일 전환 ~3분. Dashboard: ~15초.

<!-- specrail:attrs id=SCEN-2 -->
```yaml
persona: PERSONA-1
trigger: "AI review-scan 으로 의미적 결함 발견 필요"
status: Draft
```
<!-- /specrail:attrs -->

**SCEN-2 (AI quality review):** PERSONA-1 이 phase 9 NFR 을 새로 추가하고 issue inbox 의 "Run AI review" 클릭. AI 가 cwd 의 NFR 들을 읽고 "NFR-N 은 측정 unit 없음, NFR-M 은 측정 시점 빠짐" patch 제안 stream. 사용자가 각 patch 검토 → accept 시 파일 atomic write + git diff 로 즉시 확인. 기존: AI 가 결정적 검사 통과한 NFR 의 의미 결함 자동 발견 안 함.

<!-- specrail:attrs id=SCEN-3 -->
```yaml
persona: PERSONA-1
trigger: "Graph 로 phase 간 dependency 한눈 확인"
status: Draft
```
<!-- /specrail:attrs -->

**SCEN-3 (Graph 탐색):** PERSONA-1 이 새 feature F2.x 추가 후 graph view 에서 F2.x 노드 선택 → 1-hop filter → 영향받는 NFR·TC·T 가 시각적으로 즉시 보임 → orphan 또는 dangling ref 가 있으면 빨간 표시 → 누락 즉시 발견. 기존: graph 가 사람 머릿속에만 존재.

## 4. 핵심 가치 (Value Proposition)

### 4.1 한 문장

specrail 사용자가 13 phase spec 을 한 브라우저에서 흐름·관계·품질을 보고, AI 와 대화하며 즉시 수정해 spec 작업 시간을 ≥ 60% 줄인다.

### 4.2 차별점 (vs Status Quo)

- **vs VS Code/vim + GitHub preview:** ID cross-ref 가 클릭 1회. 결정적 검사 + AI 의미 review 통합 inbox.
- **vs 일반 markdown 뷰어 (Obsidian, Logseq 등):** specrail 의 phase 구조·attrs block·DELTA 패턴을 1급으로 이해. AI 호출이 target repo 의 Claude Code 컨텍스트로 정확히 진입.
- **vs Claude Code CLI 만:** 시각적 graph + 다중 origin 통합 AI UX (issue list + chat + inline) — CLI 의 turn-based 와 다른 패러다임.

### 4.3 First-Principles Insight

spec 의 가치는 **불변식(invariant)이 도구에 의해 강제될 때** 비례 증가. plugin 이 frontmatter·attrs·ID consistency 를 강제하고, dashboard 가 cross-phase 의미 일관성을 시각화·AI 검증한다. 두 도구는 같은 contract (frontmatter + attrs) 로 결합 — dashboard 는 plugin 의 약속을 처음으로 소비하는 dogfood.

## 5. 환경 / 카테고리

- **Product 카테고리:** OSS dev tool · local web app
- **플랫폼:** macOS · Linux · Windows (desktop 1280+ only)
- **사용 환경:** 데스크톱 브라우저 + 터미널 병행
- **Connectivity:** Local 우선 (파일 시스템 + Claude CLI). 첫 실행 시 npm download 만 네트워크 필요.
- **배포:** `@specrail/dashboard` npm package. plugin 의 `/specrail dashboard` slash command 가 `npx -y @specrail/dashboard@^0.x --project <cwd>` 로 호출.

## 6. Non-Goals (안 하는 것)

- ❌ **팀 공유 hosted 모드** — auth, multi-user, DB sync 없음. localhost only. **이유:** PRD-plugin §10 이 단일 product cycle 명시. hosted 는 별 cycle.
- ❌ **DELTA proposal 생성·승인 UI** — direct edit + git 으로 대체. **이유:** plugin CLI 가 이미 `/specrail change` 제공. UI 중복.
- ❌ **다중 LLM provider** — Claude Code CLI subprocess 전용. **이유:** plugin 과 동일 LLM 컨텍스트 보장 + API key 관리 회피.
- ❌ **모바일·태블릿 지원** — desktop 1280+ only. **이유:** spec 검토는 multi-pane 화면 + 키보드 단축키 의존.
- ❌ **i18n** — UI 한국어 / 영문 mixed-script 본문 표시만. **이유:** v1 사용자층이 한국어 화자 + 영문 spec 혼용.
- ❌ **Visual design system 자체 제작** — `/design-consultation` 별 cycle 산출물(DESIGN.md) 위임. **이유:** UX/IA 와 visual design 은 별 결정 layer.
- ❌ **Cross-repo spec graph** — 한 dashboard 인스턴스는 multi-project registry 지원하나 각 project 는 독립 graph. **이유:** spec 간 의존성 정의 없음, 잘못된 link 위험.

## 7. 성공 지표

<!-- specrail:attrs id=KPI-1 -->
```yaml
target: 60
unit: percent
measurement-point: "본인 daily usage 8주 후"
baseline: "현재 spec 검토 1 session 15-25분"
```
<!-- /specrail:attrs -->

| 지표 ID | 지표 | 단위 | 목표 | 측정 시점 |
|---|---|---|---|---|
| KPI-1 | Spec 검토 시간 감소 | percent vs baseline | ≥ 60% (15-25분 → 6-10분) | 본인 daily usage 8주 후 |

<!-- specrail:attrs id=KPI-2 -->
```yaml
target: 0
unit: count
measurement-point: "release 후 첫 4주"
critical: true
```
<!-- /specrail:attrs -->

| KPI-2 | 외부 편집 시 파일 corruption 사건 | count | 0 | release 후 첫 4주 |

<!-- specrail:attrs id=KPI-3 -->
```yaml
target: 80
unit: percent
measurement-point: "본인 sample 30 issues 후"
```
<!-- /specrail:attrs -->

| KPI-3 | AI review-scan 의 patch accept 비율 | percent | ≥ 80% (false positive 낮음) | 본인 sample 30 issues 후 |

<!-- specrail:attrs id=KPI-4 -->
```yaml
target: 3
unit: count
measurement-point: "v0.1 release 후 12주"
```
<!-- /specrail:attrs -->

| KPI-4 | 본인 외 실 사용자 (1 session ≥ 5분, 1주 ≥ 1회) | count | ≥ 3 | v0.1 release 후 12주 |

<!-- specrail:attrs id=KPI-5 -->
```yaml
target: 2
unit: second
measurement-point: "phase view 500 ID, graph 200 노드"
```
<!-- /specrail:attrs -->

| KPI-5 | Phase view 초기 load 시간 | second (p95) | ≤ 2 | phase view 500 ID, graph 200 노드 |

## 8. 가정 (Assumptions)

| ID | 가정 | 검증 방법 | Risk Level |
|---|---|---|---|
| A1 | Claude Code CLI 의 `--output-format stream-json` schema 가 6개월 이상 안정 | release notes 모니터링 + 어댑터 격리 + bench unit test 로 schema drift 즉시 감지 | Med |
| A2 | PERSONA-1 (본인 + 2-3명) 의 검토 빈도가 dashboard 사용을 정당화 (≥ 주 3회) | 본인 8주 telemetry (KPI-1 측정 시) + 외부 사용자 인터뷰 | Med |
| A3 | `core-schema-attrs` DELTA 가 정착 — 모든 phase 가 attrs block 충실 | plugin 0.3.x 의 `specrail audit` 결과 ≥ 95% attrs completeness | Low |
| A4 | 사용자가 `npx -y` 첫 실행 ~수십초 대기를 수용 | plugin slash command UX 에 "Downloading…" progress + 이후 cache | Low |
| A5 | desktop 1280+ 가정이 사용자 화면 100% 커버 (sub-1280 사용자 0) | 8주 사용 후 user agent 통계 | Low |

## 9. Open Questions

| Q ID | 질문 | 결정자 | 마감 | Blocking? |
|---|---|---|---|---|
| OQ-1-1 | Plugin 의 `/specrail dashboard` slash command 추가는 plugin 의 별 DELTA cycle 인가, dashboard cycle 의 phase 13 task 에 포함인가 | maintainer | Phase 13 | N |
| OQ-1-2 | v1 의 monorepo migration (root → packages/plugin) 을 어느 phase 의 task 로 — 13 (impl plan) 안 vs 별 plugin DELTA cycle | maintainer | Phase 13 | Y |
| OQ-1-3 | `@specrail/dashboard` npm scope 등록 (anthropic-org? 개인?) | maintainer | release 전 | N |
| OQ-1-4 | KPI-4 외부 사용자 3명 측정의 telemetry 메커니즘 — opt-in 익명 ping vs GitHub star/issue 수 | maintainer | Phase 11 | N |
| OQ-1-5 | "Visual design 별 cycle" 의 순서 — implementation 시작 전 vs middle vs unstyled 로 끝까지 가고 마지막에 | maintainer | Phase 13 | Y |

<!-- specrail:attrs id=OQ-1-1 -->
```yaml
blocking: false
decider: maintainer
defer-to: "Phase 13"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-1-2 -->
```yaml
blocking: true
decider: maintainer
defer-to: "Phase 13"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-1-3 -->
```yaml
blocking: false
decider: maintainer
defer-to: "release 전"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-1-4 -->
```yaml
blocking: false
decider: maintainer
defer-to: "Phase 11"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-1-5 -->
```yaml
blocking: true
decider: maintainer
defer-to: "Phase 13"
```
<!-- /specrail:attrs -->

## 10. Mode 결정 근거

**HOLD SCOPE.** Brainstorm cycle 에서 합의한 12 결정 (OSS local self-host · Claude CLI subprocess · 3-tier review · 단일 PatchProposal 깔때기 · Vite+React+Hono · monorepo · file watcher+SSE · npm 분리+slash command 연결 등) 을 고정하고 견고하게 구현.

EXPANSION 하지 않는 이유: demand reality (Q1) 가 본인 + 소규모 커뮤니티 수준. 야심 차게 늘리면 사용자 0인 기능을 만들 위험. REDUCTION 하지 않는 이유: 3 AI UX 통합이 사용자 의도이며 단일 PatchProposal 깔때기로 복잡도가 흡수됨 — 빼면 product 의 정체성이 약해짐.

향후 cycle 후보: hosted multi-user · DELTA UI · 다중 LLM · 모바일 · Edge-2 (browser multi-tab) · i18n.

## 11. 다음 phase 인풋

Phase 2 (Personas & Journey) 가 사용할 것:
- §3.1 PERSONA-1 (Spec-Driven Builder)
- §3.2 PERSONA-EDGE-1 (참조용)
- §3.4 SCEN-1, SCEN-2, SCEN-3
- §2.2 비용 (시간·정신적 부담·잃는 기회) → PAIN list 의 기초
- §6 Non-Goals → persona 범위 한정 기준
