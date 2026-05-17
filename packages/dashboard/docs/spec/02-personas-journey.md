---
phase: 2
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["01-prd.md §3.1", "01-prd.md §3.4"]
---

# Personas & Journey

**Mode:** HOLD SCOPE (inherited)
**Inputs:** PRD §3.1 PERSONA-1, §3.4 SCEN-1/2/3
**Date:** 2026-05-17

## 1. Primary Persona Card

<!-- specrail:attrs id=PERSONA-1 -->
```yaml
alias: Spec-Driven Builder
role: "specrail plugin 사용자 (solo founder · small team lead · advanced student)"
primary-pain: PAIN-2
tech-fluency: 9
daily-context: "데스크톱 + 브라우저 + Claude Code CLI 병행"
status: Approved
since: 2026-05-17
```
<!-- /specrail:attrs -->

### 기본
- **이름/별칭:** Spec-Driven Builder (별칭 "Builder")
- **나이대:** 28-45
- **역할 / 상황:** specrail plugin 을 자기 product 의 spec discipline 으로 적용. 코드도 직접 짬. spec 작성·검토·DELTA 가 weekly habit.
- **사는 곳 / 사용 환경:** 데스크톱 (16+ 인치, dark mode) + Claude Code 터미널 + 브라우저 (Chrome/Arc). 집·사무실·카페 이동.
- **테크 친숙도:** 9-10/10. CLI 일상. git native. plugin install·setup 부담 0.

### 하루 또는 핵심 루틴

| 시간대 / 상황 | 활동 | 도구 / 매체 |
|---|---|---|
| 09:00-11:00 | 코드 작성 (atomic task 단위) | Claude Code, VS Code, terminal |
| 11:00-12:00 | spec 검토·DELTA 후보 정리 | VS Code preview, GitHub web, ctrl-F |
| 14:00-16:00 | 코드 + 테스트 + commit | Claude Code, vitest watch |
| 16:00-17:30 | spec 갱신·downstream 영향 점검 | ctrl-F + 여러 phase 파일 동시 open |
| 저녁 | 새 idea 메모, 다음 cycle 후보 | Apple Notes, Obsidian |

### 도구 / 환경
- **사용 중:** Claude Code (CLI + plugin), VS Code, GitHub web, git, vitest, pnpm/npm.
- **싫어하는 것:** Notion 같은 무거운 wiki (spec 이 git 밖으로 새는 것), tab 10개 띄워두는 워크플로우, 자동저장의 surprise.
- **이미 시도한 대안:** Obsidian (link 강하나 spec discipline 강제 안 됨), Notion (drift 심함), 로컬 mkdocs (read 만 됨).

### 동기
- **가장 얻고 싶은 것:** spec 한 곳에서 흐름·관계·품질을 보고 의심을 즉시 AI 와 함께 해소하는 단일 인터페이스. 검토 후 "이번 cycle 깨진 데 없다" 확신.
- **가장 두려워하는 결과:** silent spec drift — DELTA 가 downstream phase 를 깬 채로 commit, 몇 cycle 후 사고로 발견. 또는 dashboard 가 또 하나의 분산된 도구가 되어 GitHub/VS Code/CLI 사이를 늘리는 것.
- **자존심:** "내 product 의 spec 은 제대로 살아있다" — 코드보다 spec 이 한 단계 앞서 있고 코드가 spec 을 따라간다는 자부심.

### 금기 (안 하는 것)
- Spec 을 git 밖 도구(Notion·Confluence)에 두는 것.
- Dashboard 가 spec 을 임의로 rewrite 하는 것 (사용자 명시 accept 없이).
- 자동저장 (의도 없는 mutation).

## 2. Edge Personas (무시되면 product 깨지는 사람)

<!-- specrail:attrs id=PERSONA-EDGE-1 -->
```yaml
alias: Non-developer maker
role: "PM·디자이너가 specrail 적용 (Claude Code vibe coding)"
primary-pain: PAIN-2
status: Deferred
defer-reason: "v1 desktop dev tool. Touch-friendly mode 후속 cycle."
```
<!-- /specrail:attrs -->

### Edge-1: Non-developer maker (PM·디자이너)
- **왜 무시되기 쉬운가:** dashboard 의 단축키 의존·터미널 병행 가정·markdown editor (CodeMirror) 가 dev 친화. PM/디자이너는 시각적·드래그·자연어 우선.
- **무시했을 때 깨지는 것:** AI 시대 신규 maker 층 이탈. v2 검토 시 touch-friendly + WYSIWYG-ish mode.

<!-- specrail:attrs id=PERSONA-EDGE-2 -->
```yaml
alias: External reviewer
role: "동료·멘토가 spec 만 검토 (코드 권한 없음)"
primary-pain: PAIN-4
status: Deferred
defer-reason: "Multi-user · auth 별 cycle (hosted mode)."
```
<!-- /specrail:attrs -->

### Edge-2: External reviewer (read-only)
- **왜 무시되기 쉬운가:** dashboard 가 local 단일 사용자 가정. 외부 검토자가 "방금 commit 한 spec 한 번 봐줘" 시나리오 비포함.
- **무시했을 때 깨지는 것:** Spec 의 외부 review loop 단절. hosted mode 별 cycle 에서 다룸.

## 3. Journey Map: 시나리오 1 — Daily cross-ref (SCEN-1)

<!-- specrail:attrs id=JNY-1 -->
```yaml
persona: PERSONA-1
scenario: SCEN-1
make-or-break: 3
magic-moment: 4
status: Approved
```
<!-- /specrail:attrs -->

### 컨텍스트
- **시간:** 평일 오후 4시 (16:00-17:30 spec 갱신 슬롯)
- **장소 / 상황:** 책상, dashboard 와 VS Code 동시 open. 방금 atomic task `T13.7` 정의 후 frontmatter 채우는 중.
- **Trigger:** "T13.7 이 어떤 NFR 을 만족시키는지" — TC, AC, F, R, NFR 까지 5단계 추적 필요.
- **이전 행동:** VS Code 에서 13-implementation-plan.md 의 T13.7 정의 작성.

### Step-by-Step

| # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
|---|---|---|---|---|---|
| 1 | Dashboard 의 phase 13 view 에서 T13.7 클릭 | 마우스 클릭 1회 | "참조 어디 보이지" | curious | — |
| 2 | 우측 Refs 탭에 outbound 6개 ID list 표시 | hover 로 TC-25 미리보기 | "TC-25 는 AC-R3-2 cover 하는구나" | engaged | — |
| 3 | TC-25 → AC-R3-2 → F2.1 → R3 → NFR-PERF-2 까지 클릭으로 점프 | 5번 클릭, 매번 phase view 갱신 | "끊김 없이 그래프가 보인다" | satisfied | PAIN-2 해소 |
| 4 | NFR-PERF-2 의 측정 단위·시점 확인 | 화면에서 직접 읽음 | "T13.7 이 정말 이 NFR 을 만족하는지 의심" | skeptical | PAIN-AI-1 후보 |
| 5 | "AI: verify" 클릭 → AI 가 T13.7 vs NFR-PERF-2 일관성 평가 | 응답 read | "측정 setup 누락이라네, patch 제안 받았다" | relieved | PAIN-AI-1 해소 |
| 6 | Patch accept → 파일 갱신 → git diff 확인 | accept, terminal 으로 git diff | "다음 task 로" | committed | — |

### Emotion Curve

```
high │              ╭──●satisfied─●relieved─●committed
     │            ╭─●engaged
mid  │  ●─curious
     │ ╱
low  │●───skeptical (Step 4)
     │
     └──────────────────────────────→
       1   2   3      4    5    6
```

### Critical Step
- **Make-or-break:** Step 3. 5단계 클릭 점프가 끊기면 (예: ref 가 dangling) 사용자가 도구 신뢰 잃음.
- **Magic moment:** Step 4-5. 의심 → AI verify → patch — 결정적 검사로 못 잡는 의미 결함을 dashboard 만이 해결.

## 4. Journey Map: 시나리오 2 — AI quality review (SCEN-2)

<!-- specrail:attrs id=JNY-2 -->
```yaml
persona: PERSONA-1
scenario: SCEN-2
make-or-break: 4
magic-moment: 5
status: Approved
```
<!-- /specrail:attrs -->

### 컨텍스트
- **시간:** 평일 오전 11시 (spec 검토·DELTA 슬롯)
- **장소 / 상황:** 책상, dashboard 단독 full screen. Phase 9 NFR 3개 새로 추가 직후.
- **Trigger:** "이 NFR 들 측정 가능한가? AI 가 한 번 봐줬으면."
- **이전 행동:** VS Code 에서 09-nfr.md 에 NFR-A/B/C 작성하고 dashboard 로 전환.

### Step-by-Step

| # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
|---|---|---|---|---|---|
| 1 | Issue inbox 의 "Run AI review" 클릭 | 클릭 1회 | "30초 안에 결과 나왔으면" | engaged | — |
| 2 | AI session top bar 의 streaming 인디케이터 보면서 대기 | 다른 phase 슬쩍 둘러봄 | "병렬로 다른 작업도" | engaged | — |
| 3 | AI 가 NFR-A 에 대해 "측정 단위 누락" patch 제안 stream | issue card 새로 등장 | "맞다, % 인지 ms 인지" | curious | PAIN-AI-1 |
| 4 | Patch preview 의 diff 시각화 확인 | accept/reject 선택 | "이 정도면 accept" | satisfied | — |
| 5 | Accept → file atomic write → git diff 자동 갱신 | terminal git diff 확인 | "코드처럼 spec 도 PR-able" | committed | — |
| 6 | NFR-B/C 도 같은 흐름 반복 | 자동화된 느낌 | "다음 cycle 도 이렇게" | committed | — |

### Emotion Curve

```
high │       ●engaged──●engaged─●curious───●satisfied─●committed─●committed
mid  │      ╱
     │
     └──────────────────────────────→
       1   2   3   4   5   6
```

### Critical Step
- **Make-or-break:** Step 4. Diff preview 가 어색하거나 (전체 파일 보여줌 / context 부족) 사용자 신뢰 잃음.
- **Magic moment:** Step 5. Atomic write + git diff — "코드처럼 PR-able 한 spec" 자기 인식 강화.

## 5. Journey Map: 시나리오 3 — Graph 탐색 (SCEN-3)

<!-- specrail:attrs id=JNY-3 -->
```yaml
persona: PERSONA-1
scenario: SCEN-3
make-or-break: 3
magic-moment: 4
status: Approved
```
<!-- /specrail:attrs -->

### 컨텍스트
- **시간:** 평일 오후 4시 30분 (downstream 영향 점검 슬롯)
- **장소 / 상황:** 책상, dashboard graph view full screen. 방금 새 feature F2.x 추가.
- **Trigger:** "F2.x 가 어디까지 파급되나? 누락된 NFR·TC 있나?"
- **이전 행동:** Phase 3 에 F2.x 추가 commit.

### Step-by-Step

| # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
|---|---|---|---|---|---|
| 1 | Graph view 열고 F2.x 노드 검색 (cmd+k) | 타이핑 1회 | "F2.x 가 가운데로 와야" | curious | — |
| 2 | 노드 클릭 → 자동 선택 + 우측 Refs 탭 표시 | scroll 없이 보임 | "outbound 가 4개네" | engaged | — |
| 3 | "N-hop = 1" 필터 적용 → F2.x 와 직접 이웃만 표시 | slider 조작 | "복잡도 갑자기 줄었다" | satisfied | PAIN-4 해소 |
| 4 | Orphan filter ON → F2.x 가 아직 어떤 TC 와도 연결 안 됨 발견 | 빨간 점 보임 | "TC 누락 발견" | engaged | PAIN-4 해소 |
| 5 | "AI: 이 F2.x 에 필요한 TC 제안" → 채팅 응답 stream | patch 제안 수락 | "이걸 사람이 매번 안 잊겠지" | relieved | PAIN-AI-1 |
| 6 | Phase 10 view 로 자동 점프, 새 TC 추가 commit | terminal git commit | "spec drift 막았다" | committed | PAIN-DRIFT-1 해소 |

### Emotion Curve

```
high │              ╭──●satisfied─●engaged─●relieved─●committed
mid  │    ●engaged─╯
     │ ●─curious
     └──────────────────────────────→
       1   2   3   4   5   6
```

### Critical Step
- **Make-or-break:** Step 3. N-hop filter 가 느리거나 노드 200+ 에서 hang 하면 graph view 무용지물.
- **Magic moment:** Step 4. Orphan 자동 발견 — graph 자체가 사람 머릿속에 의존하던 부담 해소.

## 6. Pain Priority

| Pain ID | 설명 | 빈도 | 영향도 | 우선 | 어느 시나리오 |
|---|---|---|---|---|---|
| PAIN-2 | 기억 의존 (ctrl-F 반복, ID 그래프 머리속 유지) | 매 검토 session 6-10회 ctrl-F | 치명 (시간 + 정신 부담) | P0 | S1 (전체) |
| PAIN-4 | Cross-phase 검토 cumbersome (14 파일 분산) | 매 DELTA 마다 | 치명 (downstream 누락 위험) | P0 | S1, S3 |
| PAIN-AI-1 | 의미적 review 부재 (결정적 검사로 못 잡음) | 매 NFR/AC 작성 시 | 중 (silent 품질 결함) | P1 | S2, S3 |
| PAIN-DRIFT-1 | DELTA 가 downstream 깨고도 commit 됨 (silent spec drift) | 매 cycle 1-2회 | 치명 (사고로 발견) | P0 | S3 |
| PAIN-CONTEXT-1 | 작업 5분 끊기면 ID graph 머리 안에서 사라짐, 다시 잡는데 분 단위 | 매일 2-3회 | 중 | P1 | S1 |

## 7. 차단 단계 (Blocking Step)

- **S1 차단:** Step 3 (5단계 클릭 점프). dangling ref 가 있으면 사용자 멈춤. PAIN-2 해결의 핵심 — graph builder 정확도 필수.
- **S2 차단:** Step 4 (diff preview). preview 가 noise 많거나 부정확하면 accept 못 함. patch 정확도 + UX 정밀도 필수.
- **S3 차단:** Step 3 (N-hop 성능). 200+ 노드에서 < 200ms 안 나오면 graph view 실패.

## 8. 다음 phase 인풋

Phase 3 (Features) 가 사용할 것:
- §6 Pain Priority (P0: PAIN-2, PAIN-4, PAIN-DRIFT-1 → 핵심 feature 의 근거)
- §7 차단 단계 (각 차단 해결할 F·R 매핑)
- §3-5 SCEN-1/2/3 의 step 들 → AC 작성 기반

## 9. Open Questions

| Q ID | 질문 | 결정자 | 마감 | Blocking? |
|---|---|---|---|---|
| OQ-2-1 | Edge-1 (Non-developer maker) 를 v2 cycle 에서 다룰 시점 | maintainer | post v0.1 | N |
| OQ-2-2 | Edge-2 (External reviewer) hosted mode 와 어떻게 연결 | maintainer | hosted cycle | N |
| OQ-2-3 | PAIN-CONTEXT-1 ("5분 끊기면 graph 재구성") 을 별 feature 로 (예: 마지막 위치 session 복원) vs 일반 navigation 으로 충분 | maintainer | Phase 3 | Y |

<!-- specrail:attrs id=OQ-2-1 -->
```yaml
blocking: false
decider: maintainer
defer-to: "post v0.1"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-2-2 -->
```yaml
blocking: false
decider: maintainer
defer-to: "hosted cycle"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-2-3 -->
```yaml
blocking: true
decider: maintainer
defer-to: "Phase 3"
```
<!-- /specrail:attrs -->
