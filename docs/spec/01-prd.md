---
name: phase-1-prd
description: PRD - 비전·문제·타겟·핵심가치·성공지표·Non-Goals·Role 정의. 모든 후속 phase의 source of truth.
inputs-from: Raw idea or change request
trigger-words: PRD, vision, product spec, what to build
mode: GREENFIELD | DELTA
---

# Phase 1: PRD (Product Requirements Document)

## Purpose

Raw idea를 검증된 product spec으로 변환. 모든 후속 phase의 single source of truth.

## Inputs

- 사용자가 준 raw idea / change request
- (DELTA mode) `docs/spec/current/01-prd.md`

<HARD-GATE>
이전 단계 없음. 첫 phase.
사용자가 raw idea만 줬을 때 곧바로 작성 시작 금지. 먼저 6 forcing questions로 framing 검증.
</HARD-GATE>

## Phase 0: Reframing (작성 전 강제)

사용자의 첫 framing은 거의 항상 정확하지 않다. 작성 전 6 forcing questions로 압박.

**ONE AT A TIME via AskUserQuestion. Push until specific.**

### Q1: Demand Reality
"이걸 누군가 진짜 원한다는 가장 강한 증거는? '관심 있다'·'대기자 등록'·'재밌어 보인다' 말고, 내일 사라지면 진심으로 화나거나 곤란해질 사람이 있는가?"

**Push until:** 구체 행동. 시간을 들이는 사람. 다른 도구를 버린 사람. 친구한테 추천한 사람. 사라지면 대안 찾아 헤맬 사람.

**Red flags:** "사람들이 흥미롭다고 해요" / "대기자 N명" / "주변에서 다 좋다고 해요". 모두 demand 아님.

### Q1 후 Framing 검증
1. **언어 정밀도** — "직관적"·"seamless"·"더 좋은" 같은 정의 안 된 용어 있나? 있으면 측정가능하게 정의 강제.
2. **숨은 가정** — 무엇을 검증 없이 전제하고 있나? "사람들은 X를 원한다" — 어떻게 검증했나?
3. **실제 vs 가설** — "사람들이 원할 거라고 생각해요"는 가설. "내가 매주 3시간을 이 일에 쓴다"는 실제. "친구 N명이 같은 문제를 토로했다"는 실제.

framing이 부정확하면 **constructive reframe**: "내가 보기엔 사실 [reframe]을 만들고 있는 것 같다. 맞나?" 60초, 10분 아님.

### Q2: Status Quo
"사용자가 지금 이 문제를 어떻게 — 못나게라도 — 풀고 있나? 그 workaround의 비용은?"

**Push until:** 구체 워크플로우. 시간. 머릿속 부담. 잊어버려서 잃은 것. 친구·동료·검색에 의존하는 횟수.

**Red flag:** "아무것도 없어요. 그래서 기회가 큰 거예요." 진짜 아무것도 없으면 보통 문제가 행동을 부를 만큼 안 아픈 것.

### Q3: Desperate Specificity
"이게 가장 필요한 진짜 한 사람을 묘사하라. 그 사람의 역할 / 상황 / 하루 / 가장 얻고 싶은 것 / 가장 두려워하는 결과는?"

**Push until:** 구체 한 사람. 직장인이든, 학생이든, 부모든, 게이머든, 취미생활자든 — 카테고리 말고 **한 사람**. 그 사람의 일상의 어느 시간·어느 상황. 본인이 그 사람과 직접 대화한 흔적.

**Red flag:** 카테고리 답변. "젊은 직장인". "헬스 관심 있는 사람". "초보자". "게이머". 카테고리는 사람이 아니다. 카테고리에 메시지 못 보낸다.

### Q4: Narrowest Wedge
"누군가 이번 주에 진짜 가치를 느낄 가장 작은 버전이 뭔가? 전체를 다 만들고 나서가 아니라."

**Push until:** 한 기능. 한 워크플로우. 한 화면. 한 메일·노트·게임 메커니즘. 며칠 안에 ship 가능한.

**Red flag:** "전체를 다 만들어야 진짜 쓸 수 있어요" / "축소하면 차별화 안 돼요". 가치보다 architecture에 집착하는 신호.

### Q5: Observation & Surprise
"실제로 누가 도움 없이 쓰는 걸 옆에서 본 적 있나? 무엇이 놀라웠나?"

**Push until:** 구체 surprise. 가정과 어긋난 사용자 행동. 의도 안 한 곳에서 가치를 찾은 흔적.

**Red flags:** "설문 보냈어요" / "데모 보여줬어요" / "예상대로였어요". 설문은 거짓말, 데모는 연극, "예상대로"는 기존 가정으로 필터링한 것.

### Q6: Future-Fit
"3년 후 세상이 의미 있게 다르면 — 그럴 거다 — 당신이 만드는 것은 더 essential해지나, 덜 essential해지나?"

**Push until:** 사용자 세상이 어떻게 변해서 가치가 늘어나는지 구체 thesis.

**Red flag:** "AI가 점점 좋아져요" / "시장이 성장해요" — 모든 경쟁자가 같은 말 한다.

---

## Smart Routing

제품 단계 따라 모든 6개 안 물어도 됨:
- Pre-product → Q1, Q2, Q3
- Has users → Q2, Q4, Q5
- Has paying / engaged users → Q4, Q5, Q6
- Pure infra / dev tool → Q2, Q4

이미 사용자 답변에 포함된 질문은 skip.

## Escape Hatch

사용자가 "그냥 가" / "질문 그만" 하면:
- 1차: "두 개만 더. 어려운 질문이 가치다. 시험 건너뛰고 처방 받는 것과 같다."
- 2차 거부: 즉시 진행 (Phase 3로 가지 말고 PRD 작성으로).
- 완전 skip 허용: 사용자가 이미 검증된 plan(실 사용자, 사용 패턴, 구체 사례) 줬을 때만.

---

## Mode Selection (사용자에게 강제)

PRD 시작 전 mode 선택:

```
A) SCOPE EXPANSION    — 야심차게. 10x 가능성 탐색.
B) SELECTIVE EXPANSION — 현재 scope 잠그고 expansion 후보 cherry-pick.
C) HOLD SCOPE          — scope 고정. 견고하게.
D) SCOPE REDUCTION     — 최소 가치 단위로 축소.
```

선택한 mode는 후속 phase에 상속. silent drift 금지.

---

## Anti-Sycophancy (강화)

00-common-principles 참조 + Phase 1 특화:

**금지:**
- "괜찮은 아이디어네요" / "흥미롭네요" / "영리하네요"
- "잠재 사용자층이 큽니다"
- "트렌드에 부합합니다"
- "여러 segment가 가능해요"

**대신:**
- 모든 답변에 position + position 바꿀 evidence 명시
- vague answer → 구체화 강제
- "Specificity is the only currency"

---

## Reasoning Procedure

1. **Reframing 완료 확인** — Phase 0의 6 forcing questions 답변 검증
2. **Mode 선택 확인** — A/B/C/D 중 선택됨
3. **검색 (Search Before Building)** — 비슷한 product·도구·서비스의 현행 방식·실패 사례
4. **PRD 초안 작성** — 아래 Output Format 따름
5. **Self-Check** — grep 검증 + checklist
6. **사용자 명시 승인** — HARD-GATE 통과
7. **다음 phase 인풋 정리** — Phase 2에 넘길 §3 Persona, §3 시나리오 추출

---

## Constraints (Prime Directives)

1. **Position 없는 문장 금지** — "여러 가지 방법이 있다" 식 금지.
2. **측정가능한 지표만** — "성능 좋게"는 금지. 단위 + 수치 + 측정 시점.
3. **Non-Goals 필수** — 안 하는 것 명시. 빈 칸 금지.
4. **구체 사람 1명** — Persona는 카테고리 아님. 역할·상황·하루.
5. **Cognitive Patterns 활성화** — Inversion (어떻게 망하나), Focus as subtraction (안 하는 것), Proxy skepticism (메트릭이 진짜 사용자에 봉사하나).

---

## Output Format

````markdown
# PRD: <Product 이름>

**Mode:** EXPANSION | SELECTIVE | HOLD | REDUCTION
**Version:** 1.0 (또는 1.x for DELTA revision)
**Date:** YYYY-MM-DD

## 1. 한 줄 정의

<10단어 이내. 누구의 어떤 문제를 어떻게 푸는지.>

## 2. 문제 (Status Quo)

### 2.1 현재 상황
<사용자가 지금 이 문제를 어떻게 풀고 있나. 구체 워크플로우.>

### 2.2 비용
- 시간: <측정값>
- 정신적 부담: <구체>
- 잃는 기회 / 결과: <구체>

### 2.3 왜 지금
<왜 작년이나 내년이 아니라 지금. 환경·기술·행동 변화 명시.>

## 3. 타겟 사용자

### 3.1 Primary Persona
- **이름/별칭:** <한 사람>
- **역할 / 상황:** <직장인·학생·부모·취미인 / 그 안에서의 위치>
- **하루:** <구체 시간 분포 또는 핵심 루틴>
- **고통:** <Pain Priority 정렬, 1위 명시>
- **가장 얻고 싶은 것:** <외부 보상이든 내부 만족이든 구체>
- **가장 두려워하는 결과:** <놓치는 것 / 잃는 것>

### 3.2 Role (시스템이 인식할 사용자 종류)

product가 multi-user면:
| Role ID | 이름 | 권한 요약 |
|---|---|---|
| ROLE-1 | <예: 생성자> | <설명> |
| ROLE-2 | <예: 협업자> | <설명> |

single-user product (개인앱·single-player game)면 "단일 사용자, role 없음" 명시.

### 3.3 핵심 시나리오 (3개)
- **S1:** <Persona가 언제·어디서·무엇을 하려다 우리 product를 발견·사용·결과 얻는>
- **S2:** ...
- **S3:** ...

## 4. 핵심 가치 (Value Proposition)

### 4.1 한 문장
"<누구>가 <언제> <무엇>을 <어떻게>해서 <어떤 결과>를 얻는다."

### 4.2 차별점 (vs Status Quo)
- vs <대안 1>: <구체 차이>
- vs <대안 2>: <구체 차이>

### 4.3 First-Principles Insight (Layer 3)
<conventional 접근을 거부하는 핵심 통찰. 왜 지금 다른 길.>

## 5. 환경 / 카테고리

- **Product 카테고리:** <예: B2B SaaS / 개인용 앱 / 게임 / 도구·CLI / 웹 서비스 / 모바일 앱 / OSS 라이브러리 / 데스크톱 앱>
- **플랫폼:** <Web / iOS / Android / Desktop / API / CLI / 콘솔>
- **사용 환경:** <데스크톱·모바일·양쪽·특수>
- **Connectivity:** <항상 온라인 / 가끔 오프라인 / 오프라인 우선>

## 6. Non-Goals (안 하는 것)

빈 칸 금지. 적어도 5개.

- ❌ <안 하는 것 1> — 이유
- ❌ <안 하는 것 2> — 이유
- ❌ ...

## 7. 성공 지표

각 지표는 측정 단위 + 목표값 + 측정 시점 명시.

| 지표 ID | 지표 | 단위 | 목표 | 측정 시점 |
|---|---|---|---|---|
| KPI-1 | <예: 활성 사용자> | <단위> | <수> | <시점> |
| KPI-2 | <예: 활성화율> | % | <%> | <after N일> |
| KPI-3 | <예: 핵심 행동 빈도> | per day | <수> | <항상> |

## 8. 가정 (Assumptions)

| ID | 가정 | 검증 방법 | Risk Level |
|---|---|---|---|
| A1 | <가정> | <어떻게 검증할지> | High/Med/Low |

## 9. Open Questions

| Q ID | 질문 | 결정자 | 마감 | Blocking? |
|---|---|---|---|---|
| OQ-1-1 | ... | <역할> | YYYY-MM-DD | Y/N |

## 10. Mode 결정 근거

선택한 mode와 이유 1-2문장.

## 11. 다음 phase 인풋

Phase 2가 사용할 것:
- §3.1 Primary Persona
- §3.3 핵심 시나리오 3개
````

---

## DELTA Mode

기존 `current/01-prd.md`가 있을 때.

### Trigger
사용자 요청이 "기능 추가"·"변경"·"제거"인 경우.

### 형식

`changes/{date}-{topic}/proposal.md`에:

````markdown
# Change Proposal: <topic>

**Status:** proposed
**Date:** YYYY-MM-DD
**Capability:** <kebab-case-id>

## Why
<왜 이 변경. 어떤 문제·기회.>

## What Changes

### ADDED
- <new capability>

### MODIFIED
- <existing R{n}: 무엇이 어떻게 바뀌나>

### REMOVED
- <existing R{n}: 왜 제거>

## Impact
- 영향받는 phase: <목록>
- Persona 변화: <있으면>
- Non-Goal 변화: <있으면>
- 성공지표 변화: <있으면>

## Open Questions
| Q ID | 질문 | 결정자 | Blocking? |
````

DELTA mode에서는 `current/01-prd.md` 그대로 두고 proposal만 추가. 사용자 승인 후 구현 완료 시 `current/`에 머지.

---

## Self-Check

작성 후 다음을 직접 grep + 확인:

```bash
# Position 없는 약한 문장
grep -E "여러 (가지|방법|관점)|고려해볼|살펴볼" 01-prd.md && echo "약한 표현 있음"

# 측정 단위 없는 지표
grep -E "성능 (좋|개선)|빠르게|편하게|직관적|seamless" 01-prd.md && echo "측정값 없는 표현"

# Non-Goals 5개 이상
grep -c "^- ❌" 01-prd.md   # 5 이상이어야

# Persona 카테고리만
grep -iE "사용자들|개발자들|기업|학생들|초보자들" 01-prd.md && echo "카테고리 단어 점검"

# Open Questions 표
grep -A5 "## 9. Open Questions" 01-prd.md
```

체크리스트:
- [ ] Phase 0의 6 forcing questions 답변 받음
- [ ] Mode 선택됨 (A/B/C/D)
- [ ] §1 한 줄 정의 10단어 이하
- [ ] §2 비용에 측정값
- [ ] §3 Primary Persona 카테고리 아닌 1명
- [ ] §3 Role 표 또는 "단일 사용자" 명시
- [ ] §4 First-Principles Insight 포함
- [ ] §6 Non-Goals 5개 이상
- [ ] §7 성공지표 모두 측정 단위 + 목표값 + 시점
- [ ] §8 가정 검증 방법 명시
- [ ] §9 Open Questions Blocking 표시

---

<HARD-GATE>
Self-check 모두 통과. 사용자 명시 승인 받음. 그 후 Phase 2 진행.
승인 없이 Phase 2 시작 금지.
</HARD-GATE>
