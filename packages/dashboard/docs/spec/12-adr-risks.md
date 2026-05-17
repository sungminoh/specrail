---
phase: 12
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["08-system-architecture.md ADR-CAND", "Phase 1-11 OQ 통합"]
---

# ADR + Risks

**Mode:** HOLD SCOPE (inherited)
**Date:** 2026-05-17
**Innovation tokens used:** 2 / 3 (Vite+Hono+SPA 아키텍처 자체 = 1 token; Claude CLI subprocess as AI source = 1 token; 나머지는 boring)

## 1. Architecture Decision Records

---

### ADR-1: Session store = SQLite (better-sqlite3)

<!-- specrail:attrs id=ADR-1 -->
```yaml
status: Accepted
decision: "AiSession + AiMessage 영속에 SQLite 사용 (via better-sqlite3 npm)"
consequences: "동기 API · single-threaded · DB 마이그레이션 인프라 필수 · binary native dep"
alternatives-considered: ["LowDB (JSON)", "DuckDB", "Postgres-lite (PGlite)"]
linked-arch: [ARCH-8]
```
<!-- /specrail:attrs -->

**Trigger:** ADR-CAND-1 (Phase 8 §9)
**Innovation token:** No (boring choice)

#### Decision
ENT-AiSession + AiMessage 영속에 **SQLite (better-sqlite3)** 사용. schema migration runner 는 자체 (gravity 의존성 1개 줄임).

#### Alternatives Considered

##### 옵션 A (선택됨): SQLite + better-sqlite3
- **장점:** 동기 API (Node single thread 친화), zero-config, 검증된 binary, query 풍부
- **단점:** native build (prebuilt 대부분 OK)

##### 옵션 B (거절됨): LowDB (JSON)
- **장점:** pure JS, 가독성
- **단점:** 메시지 수십만 건 시 read/write 전체 file 부하, query 없음
- **거절 이유:** scale 한계

##### 옵션 C (거절됨): DuckDB
- **장점:** column 빠름
- **단점:** dashboard 의 workload (write-heavy, 작은 query) 에 overkill, native build 부담 더 큼
- **거절 이유:** workload 불일치

##### 옵션 D (거절됨): PGlite
- **장점:** full Postgres syntax
- **단점:** 큰 라이브러리 (~10MB), v1 needs 대비 overkill
- **거절 이유:** 사이즈


#### Consequences
- (+) 마이그레이션 인프라 깔면 향후 schema 변경 안전.
- (+) Vitest 에서 in-memory `:memory:` mode 로 빠른 test.
- (–) macOS/Linux/Windows 모두 prebuilt 검증 필요 (CI matrix).
- (–) better-sqlite3 가 Node version 변경 시 rebuild — npm postinstall hook 자동.

---

### ADR-2: API form = REST + SSE (server-sent events)

<!-- specrail:attrs id=ADR-2 -->
```yaml
status: Accepted
decision: "HTTP REST 라우트 + SSE 단일 channel 로 streaming. tRPC/WebSocket 안 씀"
consequences: "RPC 타입은 Hono client 의 RPC 추론으로 보장; SSE 가 firewall 친화 + browser 기본 지원"
alternatives-considered: ["tRPC + WebSocket", "GraphQL + subscriptions", "REST + polling"]
linked-arch: [ARCH-2]
```
<!-- /specrail:attrs -->

**Trigger:** ADR-CAND-2 (Phase 8 §9)
**Innovation token:** No

#### Decision
**HTTP REST + SSE (project 당 단일 channel).** Hono RPC client 가 타입 추론 제공. WebSocket 안 씀.

#### Alternatives Considered

##### 옵션 A (선택됨): REST + SSE
- **장점:** browser native (`EventSource`), reconnection 표준화, HTTP/2 multiplexing 친화, debug 쉬움 (curl)
- **단점:** 한 방향 (client → server 는 별 POST). dashboard 의 패턴 (사용자 action → server, server → UI push) 와 정확히 부합

##### 옵션 B (거절됨): tRPC + WebSocket
- **장점:** 양방향 + 강한 타입
- **단점:** WebSocket reconnect/heartbeat 자체 구현, debug 어려움, 라이브러리 면적 (server + client) 큼
- **거절 이유:** 양방향 needs 없음

##### 옵션 C (거절됨): GraphQL subscriptions
- **장점:** subscription 표준
- **단점:** schema 추가 layer, overkill
- **거절 이유:** schema 보일러플레이트

##### 옵션 D (거절됨): REST + polling
- **장점:** 가장 단순
- **단점:** NFR-PERF-4 (외부 변경 ≤ 500ms) 달성 어렵고 부하 부담
- **거절 이유:** latency


#### Consequences
- (+) `curl http://localhost:.../api/projects/:id/events` 로 stream debug 가능.
- (+) Hono의 stream helper 가 SSE 형식 자동 직렬화.
- (–) IE 호환성 N/A (modern browser 만, PRD 환경 부합).

---

### ADR-3: Graph layout 엔진 = elkjs (layered)

<!-- specrail:attrs id=ADR-3 -->
```yaml
status: Accepted
decision: "React Flow + elkjs layered layout"
consequences: "NFR-PERF-2 (≤200ms / 500 nodes) 달성 가능 검증 필요. elkjs ESM 호환성 OK"
alternatives-considered: ["dagre", "viz.js", "cytoscape.js"]
linked-arch: [ARCH-4]
linked-nfr: [NFR-PERF-2]
```
<!-- /specrail:attrs -->

**Trigger:** ADR-CAND-3 (Phase 8 §9)
**Innovation token:** No

#### Decision
**React Flow (rendering) + elkjs (layered layout 계산).**

#### Alternatives Considered

##### 옵션 A (선택됨): React Flow + elkjs
- **장점:** React Flow 가 가장 활발한 React graph 라이브러리, elkjs 가 layered/hierarchical 우수, phase 좌→우 흐름 표현에 적합
- **단점:** elkjs 가 비교적 크지만 lazy load

##### 옵션 B (거절됨): React Flow + dagre
- **장점:** 작은 사이즈
- **단점:** layered 품질 elkjs 미만, 큰 그래프에서 노드 겹침
- **거절 이유:** 시각 품질

##### 옵션 C (거절됨): viz.js (graphviz)
- **장점:** graphviz 표준
- **단점:** 큰 wasm binary (~1MB+), React 통합 자체 구현
- **거절 이유:** 사이즈

##### 옵션 D (거절됨): cytoscape.js
- **장점:** 강력
- **단점:** React-native 아님, learning curve
- **거절 이유:** 통합 비용


#### Consequences
- (+) NFR-PERF-2 bench 통과 검증 후 lock-in.
- (–) elkjs WebWorker 분리 검토 (UI thread blocking 회피, ADR-CAND 미래).

---

### ADR-4: Package manager = pnpm (monorepo workspace)

<!-- specrail:attrs id=ADR-4 -->
```yaml
status: Accepted
decision: "Monorepo migration 시 pnpm workspaces"
consequences: "기존 npm lockfile → pnpm-lock.yaml 변환. CI 갱신"
alternatives-considered: ["npm workspaces", "yarn berry", "bun workspaces"]
linked-arch: []
```
<!-- /specrail:attrs -->

**Trigger:** ADR-CAND-4 (Phase 8 §9)
**Innovation token:** No

#### Decision
**pnpm workspaces.**

#### Alternatives Considered

##### 옵션 A (선택됨): pnpm
- **장점:** 디스크 효율, 빠름, monorepo 친화, strict node_modules 격리 (의도 안 한 transitive import 차단)
- **단점:** pnpm 미설치 사용자 onboarding 추가 step

##### 옵션 B (거절됨): npm workspaces
- **장점:** 추가 도구 X
- **단점:** hoisting 모호, monorepo 기능 약함
- **거절 이유:** monorepo 발전성

##### 옵션 C (거절됨): yarn berry
- **장점:** 강력
- **단점:** PnP plugin 호환성 이슈, Node native module 충돌 종종
- **거절 이유:** ecosystem 마찰

##### 옵션 D (거절됨): bun workspaces
- **장점:** 빠름
- **단점:** 아직 production 채택 적음, native module 호환성 미성숙
- **거절 이유:** 안정성


#### Consequences
- (+) Monorepo 의 `packages/core` `packages/plugin` `packages/dashboard` 셋업 자연스러움.
- (–) Contributors 가 pnpm 설치 필요 (`corepack enable` 안내).

---

### ADR-5: Frontmatter form = react-hook-form + zod resolver

<!-- specrail:attrs id=ADR-5 -->
```yaml
status: Accepted
decision: "Frontmatter form: react-hook-form + @hookform/resolvers/zod"
consequences: "zod schema → field 자동 mapping 자체 구현"
alternatives-considered: ["자체 form (zod schema → field generator)", "TanStack Form", "Formik"]
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

**Trigger:** ADR-CAND-5 (Phase 8 §9)
**Innovation token:** No

#### Decision
**react-hook-form + zod resolver + 얇은 zod-to-field renderer.**

#### Alternatives Considered

##### 옵션 A (선택됨): react-hook-form + zod resolver
- **장점:** 사실상 표준, perf 좋음, uncontrolled inputs로 re-render 최소
- **단점:** zod schema 를 form field 로 매핑하는 layer 자체 작성 필요 (얇음)

##### 옵션 B (거절됨): 자체 form
- **장점:** 의존성 0
- **단점:** validation·dirty/touched·error 추적 자체 구현 부담
- **거절 이유:** NIH

##### 옵션 C (거절됨): TanStack Form
- **장점:** type-safe, framework-agnostic
- **단점:** react-hook-form 대비 채택 적고 학습 필요
- **거절 이유:** 익숙도

##### 옵션 D (거절됨): Formik
- **장점:** 한때 표준
- **단점:** 유지 활동 둔화, perf react-hook-form 미만
- **거절 이유:** 트렌드


---

### ADR-6: Markdown editor = CodeMirror 6

<!-- specrail:attrs id=ADR-6 -->
```yaml
status: Accepted
decision: "CodeMirror 6 + lang-markdown + lang-yaml extension"
consequences: "modular ES build (~150KB gzip 기본), 확장성 좋음"
alternatives-considered: ["Lexical", "Tiptap (ProseMirror)", "Monaco"]
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

**Trigger:** ADR-CAND-6 (Phase 8 §9)
**Innovation token:** No

#### Decision
**CodeMirror 6** + `@codemirror/lang-markdown` + `@codemirror/lang-yaml` extension.

#### Alternatives Considered

- **(선택) CodeMirror 6** — pro: modular ES, syntax highlight·linter·autocomplete extension, 사이즈 합리적. dashboard 의 use case (markdown raw source 편집) 와 정확히 부합.
##### 옵션 A (거절됨): Lexical
- **장점:** Meta 후원
- **단점:** WYSIWYG 지향, raw markdown 편집보다 rich text 적합
- **거절 이유:** 모델 불일치

##### 옵션 B (거절됨): Tiptap (ProseMirror)
- **장점:** 강력 WYSIWYG
- **단점:** 위와 동일, 또한 학습 곡선 큼
- **거절 이유:** 모델·복잡도

##### 옵션 C (거절됨): Monaco (VS Code editor)
- **장점:** VS Code 익숙
- **단점:** 매우 큰 사이즈 (~3MB), web worker 필수
- **거절 이유:** 사이즈


---

### ADR-7: Per-project lockfile = proper-lockfile

<!-- specrail:attrs id=ADR-7 -->
```yaml
status: Accepted
decision: "Per-project dashboard instance lockfile 은 proper-lockfile 라이브러리 사용"
consequences: "stale lock detection · cross-platform 동작 보장"
alternatives-considered: ["자체 mtime touch", "fs lockfile (proper-lockfile 없이)", "system semaphore"]
linked-nfr: [NFR-SCAL-3]
```
<!-- /specrail:attrs -->

**Trigger:** OQ-11-2 (Phase 11)
**Innovation token:** No

#### Decision
**`proper-lockfile` npm 라이브러리.** `<projectRoot>/.specrail-cache/dashboard.lock` 위치.

#### Alternatives Considered

##### 옵션 A (선택됨): proper-lockfile
- **장점:** stale lock 자동 검출 (pid check), cross-platform, 12k+ deps 사용 (검증)
- **단점:** 의존성 추가

##### 옵션 B (거절됨): 자체 mtime touch
- **장점:** 0 dep
- **단점:** stale lock 처리 직접 구현 (pid 검사·timeout 처리). 검증되지 않은 race condition 위험
- **거절 이유:** NIH

##### 옵션 C (거절됨): System semaphore
- **장점:** OS native
- **단점:** cross-platform 차이 큼, JS API 불일치
- **거절 이유:** cross-platform


---

### ADR-8: ID 컨벤션 재사용 (P-CC, W-CC, E-CC)

<!-- specrail:attrs id=ADR-8 -->
```yaml
status: Accepted
decision: "Dashboard 의 페이지·와이어프레임·요소도 plugin schema 의 P-CC, W-CC, E-CC pattern 재사용. surface 필드로 'dashboard' 명시"
consequences: "specrail check / attrs schema 가 별 수정 없이 적용. CC 'Claude Code' 의미는 surface 로 일반화"
alternatives-considered: ["Plugin schema 에 P-WEB / W-WEB / E-WEB 추가", "별 entity kind 확장 (web-page / web-wf)"]
linked-arch: []
```
<!-- /specrail:attrs -->

**Trigger:** Phase 6/7 작성 중 발생한 schema 호환 결정
**Innovation token:** No

#### Decision
**P-CC, W-CC, E-CC IDs 그대로 사용.** surface 필드가 "dashboard" 로 명시 — schema 의 CC 명명은 historical artifact 로 처리.

#### Alternatives Considered

##### 옵션 A (선택됨): 재사용
- **장점:** plugin schema·lint 변경 0, dashboard cycle 본 작업에 영향 X
- **단점:** "CC" 명칭이 web app 에 어색해 보임

##### 옵션 B (거절됨): Plugin schema 확장 (P-WEB 추가)
- **장점:** 의미 정확
- **단점:** plugin DELTA cycle 필요 → dashboard cycle 차단
- **거절 이유:** scope creep

- **별 entity kind** — pro: 깔끔. con: 위와 동일, plugin 변경 dependency. **거절.**

#### Consequences
- 향후 plugin DELTA 에서 P-CC 를 surface-agnostic name (예: PG = Page) 으로 rename 시 dashboard 도 일괄 migration.

---

### ADR-9: Visual design = /design-consultation 별 cycle 위임

<!-- specrail:attrs id=ADR-9 -->
```yaml
status: Accepted
decision: "Visual design system (color/typography/icon/spacing/motion) 은 /design-consultation 산출물(DESIGN.md) 로 위임. v1 implementation 은 unstyled 또는 minimal shadcn default 로 골격 검증 → DESIGN.md 후 styling apply"
consequences: "구현 phasing 명확: 기능 layer 먼저, visual layer 나중. design 결정 변경에 강건."
alternatives-considered: ["v1 에서 shadcn/Tailwind default 로 고정", "design 결정 후 implementation 시작 (block)"]
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

**Trigger:** PRD §6 Non-Goal 6, 사용자 명시 요청
**Innovation token:** No (의도적 분리)

#### Decision
**v1 implementation 은 unstyled / minimal default 로 기능 검증.** DESIGN.md (design-consultation 별 cycle 산출물) 후 visual styling layer 적용. Wireframe (Phase 7) 의 information layout 만 v1 commitment.

#### Alternatives Considered

##### 옵션 A (선택됨): Defer + phase 분리
- **장점:** 두 결정 layer 독립, 변경 강건성
- **단점:** implementation 중 시각 disagreement 가능 (사용자에게 unstyled UI 노출 일정 동안)

##### 옵션 B (거절됨): shadcn/Tailwind 즉시 채택
- **장점:** 빠른 시각화
- **단점:** design-consultation 가 다른 시스템 권장 시 rework
- **거절 이유:** lock-in 위험

##### 옵션 C (거절됨): Block until DESIGN.md
- **장점:** 한 번에 깔끔
- **단점:** dashboard implementation 지연, 사용자 feedback loop 늦음
- **거절 이유:** 일정

---

## 2. Risk Register

<!-- specrail:attrs id=RISK-1 -->
```yaml
severity: H
probability: M
mitigation: "claude CLI 어댑터 1곳 격리; CLI version check 시 비호환 경고; schema fixture 로 drift 즉시 감지 (TC-12 등)"
linked-arch: [ARCH-6]
linked-nfr: [NFR-AVAIL-2]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-2 -->
```yaml
severity: H
probability: L
mitigation: "INV-1, INV-2 lint+test 강제, atomic write + mtime guard, 사용자 자동 git track 가이드"
linked-arch: [ARCH-3, ARCH-5]
linked-nfr: [NFR-SEC-3]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-3 -->
```yaml
severity: M
probability: M
mitigation: "AI patch 가 INV-1 단일 깔때기 거치므로 사용자 explicit accept 필요. 자동 적용 0."
linked-arch: [ARCH-3]
linked-r: [R4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-4 -->
```yaml
severity: M
probability: M
mitigation: "few-shot prompt + zod validate, 실패 시 raw 응답 chat 노출. patch 추출 실패 배지로 사용자에게 명시. fallback: 수동 적용 가이드"
linked-arch: [ARCH-3, ARCH-6]
linked-r: [R4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-5 -->
```yaml
severity: M
probability: L
mitigation: "watch scope = docs/spec/ + changes/ 만 (INV-4). polling fallback 옵션. chokidar usePolling flag 노출"
linked-arch: [ARCH-5]
linked-nfr: [NFR-PERF-4]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-6 -->
```yaml
severity: L
probability: M
mitigation: "slash command 첫 호출 시 'Downloading…' progress 표시; 이후 npm cache (~/.npm/_npx)"
linked-arch: []
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-7 -->
```yaml
severity: M
probability: L
mitigation: "OS 별 prebuilt binary 검증 (CI matrix ubuntu/macos/windows). 실패 시 사용자에게 build-from-source 가이드"
linked-arch: [ARCH-8]
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-8 -->
```yaml
severity: H
probability: M
mitigation: "PRD KPI-4 측정: 외부 사용자 3명 in 12 weeks. 미달 시 cycle 의 ROI 재평가. dashboard 자체 demand 검증 부족"
linked-arch: []
linked-nfr: []
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=RISK-9 -->
```yaml
severity: M
probability: L
mitigation: "DESIGN.md 산출 지연 시 unstyled 로 dogfood 진행 가능 (ADR-9). 단 외부 사용자 onboarding 시 'beta' label"
linked-arch: [ARCH-1]
```
<!-- /specrail:attrs -->

| ID | Risk | 영역 | Likelihood (L/M/H) | Impact (L/M/H) | Owner | Monitoring | Mitigation 요약 |
|---|---|---|---|---|---|---|---|
| RISK-1 | Claude CLI stream-json schema 변경 | EXT-1 | M | H | maintainer | release notes monitor + bench fail | 어댑터 격리 |
| RISK-2 | Atomic write 실패로 spec 손상 | EXT-2 | L | H | maintainer | INV test + user incident | INV-1/2 강제 + git 책임 |
| RISK-3 | AI 가 잘못된 patch 제안 → 사용자 accept 시 spec 오염 | R4 | M | M | maintainer | user incident report | 단일 깔때기 + 사용자 review 강제 |
| RISK-4 | Patch JSON 형식 파싱 실패 | R4 | M | M | maintainer | metric "patch extraction failure rate" (local) | few-shot + fallback |
| RISK-5 | Chokidar 대량 이벤트 (git pull) → 부하 | R6 | L | M | maintainer | self-test EDGE-7 | scope 한정 + debounce |
| RISK-6 | `npx -y` 첫 실행 지연으로 사용자 의문 | OPS-2 | M | L | maintainer | user UX feedback | progress indicator |
| RISK-7 | better-sqlite3 native build 실패 | ARCH-8 | L | M | maintainer | CI cross-OS matrix | prebuilt 검증 + 가이드 |
| RISK-8 | demand reality 부족 — KPI-4 미달 | demand | M | H | maintainer | 12주 GitHub 활동 집계 | OSS visibility + community 노출 |
| RISK-9 | DESIGN.md 지연 → 사용자에게 unstyled UI 노출 | design | L | M | maintainer | design-consultation 진행률 | beta label + dogfood 우선 |

### Risk Matrix (LxI)

```
              Impact
              L          M          H
Probability ────────────────────────────────
   H        │ -        │ -        │ RISK-8 │
   M        │ RISK-6   │ RISK-3,4 │ RISK-1 │
   L        │ -        │ RISK-5,7,9│ RISK-2 │
```

## 3. 통합 Open Questions (resolved + remaining)

### Resolved (이전 phase 에서 또는 본 phase 에서 결의)

| OQ | 결의 | 위치 |
|---|---|---|
| OQ-1-1 (slash command 별 DELTA vs 같이) | Plugin DELTA cycle 별도 (Phase 13 task 에 포함 안 함, slash command 는 plugin side) | implicit |
| OQ-1-2 (monorepo migration 시점) | Phase 13 implementation plan 의 **첫 task** | Phase 13 |
| OQ-1-5 (visual design 순서) | ADR-9 (unstyled 먼저, DESIGN.md 후 styling) | ADR-9 |
| OQ-4-3 (`.specrail-cache/` watch) | 제외 (INV-WATCH-1 allowlist 외) | Phase 8 INV-WATCH-1 |
| OQ-5-2 (conflict force overwrite 노출) | 노출 (P-CC-10 [Force overwrite] 버튼). 사용자 OS Time Machine·git 으로 복구 가정 | Phase 7 P-CC-10 |
| OQ-6-2 (URL hash vs query) | query param 사용 (`?chat=1`, `?edit=1`) — 북마크/공유 호환 | Phase 6 §4 |
| OQ-7-1 (external diff tool) | 내장 side-by-side diff view 만 v1. external git mergetool 호출은 v2 (browser 한계) | Phase 7 §9 |
| OQ-8-1 (`.specrail-cache/` watch) | 제외 (OQ-4-3 와 동일 결정) | ADR-3 외 |
| OQ-9-1 (NFR-AVAIL-1 측정) | GitHub issue 기반 self-report (자동 ping 0, NFR-PRIV-1 보호) | Phase 11 §9 |
| OQ-9-2 (KPI-4 telemetry) | GitHub star/issue/discussion 기반 self-measure | Phase 11 §9 |
| OQ-10-2 (health-ping test) | TC 추가 없음 (위 결정과 정합) | Phase 11 §9 |
| OQ-11-2 (lockfile mechanism) | proper-lockfile 라이브러리 (ADR-7) | ADR-7 |

### Remaining (Phase 13 으로 또는 후속 cycle)

<!-- specrail:attrs id=OQ-12-1 -->
```yaml
decider: maintainer
due: "Phase 13"
blocking: false
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-12-2 -->
```yaml
decider: maintainer
due: "post v0.1"
blocking: false
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-12-3 -->
```yaml
decider: maintainer
due: "post v0.1"
blocking: false
```
<!-- /specrail:attrs -->

| OQ | 질문 | Defer to | Blocking? |
|---|---|---|---|
| OQ-12-1 | 통합 OQ 중 v0.1 release 후에 다시 점검할 항목 정기 cycle (분기? 반기?) | Phase 13 | N |
| OQ-12-2 (was OQ-1-3) | `@specrail/dashboard` npm scope 등록 (anthropic-org? sungminoh?) | release 직전 | N |
| OQ-12-3 (was OQ-2-1, OQ-2-2) | Edge persona (PM·외부 reviewer) cycle 일정 | post v0.1 | N |

## 4. Innovation Token Ledger

| # | Token | 사용 ADR | 이유 |
|---|---|---|---|
| 1 | Vite + React SPA + Hono server (vs Next.js boring choice) | implicit (Phase 8 Stack 결정) | 장기 확장성·런타임 중립 |
| 2 | Claude Code CLI subprocess (vs API key) as AI source | implicit (Phase 1 decision #2) | UX·비용·plugin 컨텍스트 일치 |
| 3 (unused) | — | — | margin for unexpected |

남은 토큰 1개 — 구현 중 발견되는 정당화된 novel choice 1개까지 허용. 그 이상은 boring 강제.

## 5. 다음 phase 인풋

- **Phase 13 (Impl plan):** ADR-1~9 결정을 atomic task 의 dependency / scaffold 단계로 매핑. RISK-1~9 가 mitigation 작업으로 task 화.
