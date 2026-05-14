# Personas & Journey

**Mode:** HOLD SCOPE (retroactive — PRD §10 변경 2026-05-12. 원래 EXPANSION이었으나 dashboard 분리)
**Inputs:** PRD §3.1, §3.3
**Reference:** `/reference-v3/02-personas-journey.md`
**Date:** 2026-05-10 (DELTA 2026-05-12: dashboard 표현 제거)

## 1. Primary Persona Card

### 기본
- **별칭:** Builder (Claude Code 사용자)
- **나이대:** 25-50
- **역할 / 상황:** AI 도구로 product 만드는 한 사람. solo founder · small team lead · advanced student · 사이드 프로젝트 professional. **Claude Code subscriber 또는 trial 사용자.**
- **사는 곳 / 사용 환경:** 데스크톱 작업 (집·사무실·카페) + markdown 검토 (GitHub UI·VS Code preview) + 모바일 메모 (이동 중 idea 수집). 인터랙티브 dashboard는 v4.5+.
- **테크 친숙도:** 9-10/10. CLI 일상. git native. plugin install·setup 부담 작음.

### 하루 또는 핵심 루틴

| 시간대 / 상황 | 활동 | 도구 / 매체 |
|---|---|---|
| 출퇴근·이동 중 | idea 수집·기존 spec 참조 | 모바일 메모, 모바일 chat |
| 아침 work block (1-2h) | spec 작성·검토 (plugin) | Claude Code + GitHub/VS Code markdown preview |
| 점심 후 deep work (2-4h) | 구현 (Phase 13 후) | Claude Code agent + git |
| 저녁·주말 | 사이드 프로젝트 또는 review | Claude Code |

### 도구 / 환경
- **사용 중:** Claude Code (primary), Cursor·ChatGPT (보조), Notion (idea 메모), Linear·GitHub (issue tracking)
- **싫어하는 것:** 무거운 GUI, OAuth·계정 강제, 설치 복잡한 도구, vendor lock-in
- **이미 시도한 대안:** v3 markdown 직접 사용, BMAD, OpenSpec, Cursor Rules, Claude Project Knowledge, Notion template

### 동기
- **가장 얻고 싶은 것:** "한 사람이 큰 product를 ship했다"는 결과. AI 시대 leverage 증명. 또는 자기 itch 해결.
- **가장 두려워하는 결과:** 6개월 작업이 LLM hallucination 위에 쌓여 production에서 깨짐. 또는 spec 작성 부담이 너무 커서 plugin 자체를 안 씀.
- **자존심 / 자기 표현:** "AI를 amplifier로 쓰는 craftsperson". HN·Twitter에서 보일 quality.

### 금기
- 새 vendor에 lock-in되는 도구
- 회의·sprint·OKR 같은 무거운 process
- 자기 데이터 cloud로 자동 sync (privacy 우려)

## 2. Edge Personas

### Edge-1: Non-developer maker (디자이너·PM이 Claude Code로 vibe coding)
- **왜 무시되기 쉬운가:** Phase 4 Domain Model·Phase 8 Architecture가 코딩 배경 가정. plugin UI도 dev 친화 default.
- **무시했을 때 깨지는 것:** AI 시대 가장 큰 신규 사용자층. 진입 장벽 높으면 잃음.

### Edge-2: Multiple parallel projects (한 사람이 여러 product 동시 진행) — v4.5+ cycle
- **왜 무시되기 쉬운가:** v4.0은 단일 project 가정. Multi-project switching UI (dashboard tab 등)는 v4.5+ cycle로 deferred.
- **무시했을 때 깨지는 것:** 사이드 프로젝트 다수 보유 builder가 핵심 사용자층. project switching 부담이면 plugin 안 씀.

### Edge-3: Brownfield maintainer (S3 P1 — v4.1 또는 v4.2 후보)
- **왜 무시되기 쉬운가:** Greenfield 가정 강함.
- **무시했을 때 깨지는 것:** 가장 큰 시장 (existing software 유지·확장).

## 3. Journey Map: 시나리오 1 — Greenfield

### 컨텍스트
- 시간: 토요일 오전 10시
- 장소 / 상황: 카페·집 책상. 새 idea 흥분 상태.
- Trigger: 어제 저녁 친구와 대화 중 "이런 도구 있으면 좋겠는데"
- 이전 행동: Notion에 한 paragraph + 비슷한 product Twitter 링크

### Step-by-Step

| # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
|---|---|---|---|---|---|
| 1 | Plugin 발견 | GitHub README · Twitter 보고 install | "v3 markdown 써봤는데 plugin이 더 나을까" | curious | PAIN-base |
| 2 | Install | Claude Code에 plugin add 명령 | "Claude Code plugin이라 setup 단순한가" | hopeful | - |
| 3 | 첫 trigger | `/specrail init` 또는 "13 phase로 새 product 만들고 싶어" | "init이 뭘 만들지" | curious | - |
| 4 | docs/spec 자동 생성 | plugin이 디렉토리 + 빈 산출물 골격 생성 + Phase 1 안내 출력 | "어디서 시작" | engaged | - |
| 5 | Phase 1 skill 호출 | plugin 자동 호출 → 6 forcing questions | "v3와 동일하지만 흐름은 매끄러운가" | challenged | - |
| 6 | Forcing 압박 | "한 사람을 묘사하라"에서 막힘 | "역시 vague하면 못 넘김" | uncomfortable but engaged | PAIN-fundamental |
| 7 | PRD 산출물 생성 | plugin이 structured frontmatter + body markdown 작성 | "ID 자동 부여되네" | impressed | PAIN-1 해결 |
| 8 | Hook 검증 | commit 시 hook이 self-check 자동 → pass | "내가 grep 안 해도 되네" | relieved | PAIN-5 해결 |
| 9 | Markdown 검토 | GitHub UI 또는 VS Code preview에서 PRD + dependency graph mermaid 확인 | "전체 한 번 — 인터랙티브 검토는 v4.5에서" | satisfied | PAIN-4 Partial (인터랙티브는 v4.5 dashboard) |
| 10 | 명시 승인 | Claude Code에 `approve phase 1` | "다음 phase로" | confident | - |
| 11 | Phase 2 skill 자동 호출 | plugin이 fresh subagent로 Phase 2 진입, PRD §3 자동 input | "ID 다시 안 적어도 되네" | flow | PAIN-2 해결 |
| 12 | ...반복 11회 (Phase 2-12)... | 각 phase same pattern | "흐름이 jam 없이" | gritty but flow | - |
| 13 | Phase 13 → Implementation | Superpowers 패턴 subagent로 atomic task 실행 | "spec → code 자동" | trust | - |
| 14 | Ship | git push, deploy | "이번엔 placeholder 안 박혔다" | satisfied | - |

### Emotion Curve

```
   high │                                     ●satisfied─●trust─●satisfied
        │                          ●relieved─●satisfied─●confident
        │                       ●impressed
   neutral│●curious─●hopeful─●engaged─●challenged─●engaged
        │                  ╲
   low  │                  ●uncomfortable
        │
        └────────────────────────────────────────────────────→
          1   2   3   4   5   6   7   8   9   10  11  12  13  14
```

### Critical Step
- **Make-or-break:** Step 6 (Forcing 압박). v3와 동일 — 여기서 도망치면 PRD 약함이 후속 phase 전염.
- **Magic moment:** Step 8 (Hook 검증 자동 pass) + Step 11 (다음 phase 자동 ID 인계). v3 대비 새로 추가된 두 magic moment — plugin 가치 입증 지점.

## 4. Journey Map: 시나리오 2 — DELTA (결제 추가 예시)

### 컨텍스트
- 시간: 평일 오후 2시
- 장소 / 상황: 사무실. 무료 → 유료 전환 압박.
- Trigger: 사용자 N명 도달, 결제 도입 필요.
- 이전 행동: payment provider docs 읽음. 어디서 시작할지 막막.

### Step-by-Step

| # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
|---|---|---|---|---|---|
| 1 | Plugin DELTA 명령 | `/specrail change "add payment"` | "영향 phase 직접 식별 부담 안 됨" | hopeful | PAIN-DELTA-scope |
| 2 | 영향 phase 자동 식별 | plugin이 ID dependency graph 분석 → "Phase 1, 3, 4, 8, 12, 13 영향" 출력 | "내가 손으로 안 해도" | relieved | - |
| 3 | proposal.md 자동 draft | plugin이 ADDED/MODIFIED/REMOVED 골격 생성 | "vague한 거 채워야겠지" | engaged | - |
| 4 | 각 영향 phase delta 진행 | plugin이 phase 별 fresh subagent 호출, 영향 spec만 input | "기존 spec 안 깨지나" | cautious | - |
| 5 | 새 ADR | plugin이 alternatives ≥ 2 강제, 거절 이유 hook 검증 | "비교 강제하니 명확" | confident | - |
| 6 | 새 INV (멱등성) | plugin이 INV ID 자동 부여, 기존 INV와 충돌 hook 검증 | "넘버링 자동" | safe | - |
| 7 | tasks.md (Phase 13 DELTA) | atomic task with TC 인용 | "RED test부터" | trust | - |
| 8 | 사용자 승인·머지 | plugin이 current/ 자동 sync + archive 이동 | "이전 spec 안 깨졌네" | trust | - |

### Critical Step
- **Make-or-break:** Step 2 (영향 phase 자동 식별 정확도). 빠진 phase 있으면 모순 발생.
- **Magic moment:** Step 2 자체. v3에선 사용자 수동 판단했던 가장 부담스런 부분.

## 5. Journey Map: 시나리오 3 — Refactor (P1 — v4.1 후보)

### 컨텍스트
- 시간: sprint 사이 빈 주
- 장소 / 상황: 1년 된 codebase, spec 부재. 다음 큰 기능 전 정리 필요.
- Trigger: 새 dev 합류, onboarding spec 부재.

### Step-by-Step (v4.1 명세 후 확정)

| # | Step | Persona 행동 | 감정 |
|---|---|---|---|
| 1 | `/specrail reverse-engineer` | daunted |
| 2 | plugin이 codebase 분석 (file tree + 핵심 module) | wary |
| 3 | Phase 1 PRD 역방향 자동 draft | impressed |
| 4 | 각 phase 사용자 검수·수정 | cautious |
| 5 | current/ freeze | confident |

### Critical Step (S3 — 잠정)
- **Make-or-break:** Step 2 (codebase 분석 정확도). plugin이 실 module 구조를 ENT로 못 매핑하면 무용.

(P1 — v4 첫 release scope 외. 명세 잠정. v4.1에서 정식 Journey Map.)

## 6. Pain Priority

| Pain ID | 설명 | 빈도 | 영향도 | 우선 | 어느 시나리오 |
|---|---|---|---|---|---|
| PAIN-1 | 환각 ID (정의 안 된 ID 인용) | v3 사용자 전원 | 높음 | P0 | S1, S2 |
| PAIN-2 | 사용자 기억 의존 (이전 phase ID ctrl-F) | 전원 | 중 | P0 | S1, S2 |
| PAIN-3 | HARD-GATE 양심 의존 (LLM이 무시 시 사용자 catch) | ~50% | 매우 높음 | P0 | S1, S2 |
| PAIN-4 | 검토 cumbersome (14 markdown cross-reference) | 전원 | 중 | P0 | S1, S2 |
| PAIN-5 | self-check grep 잊음 | ~30% | 높음 | P0 | S1, S2 |
| PAIN-DELTA-scope | DELTA 영향 phase 수동 판단 부담 | DELTA mode 전원 | 매우 높음 | P0 | S2 |
| PAIN-fundamental | Forcing question 도망 (v3와 동일) | ~40% | 치명 | P0 | S1 |
| PAIN-6 | 다중 project 동시 검토 부담 | 30% (multi-project user) | 중 | P1 | (Edge-2) |
| PAIN-7 | Brownfield 역설계 부담 | brownfield user 전원 | 매우 높음 | P1 | S3 (v4.1) |
| PAIN-base | Plugin install·setup 마찰 | 첫 사용자 전원 | 중 | P0 | S1 |

## 7. 차단 단계 (Blocking Step)

- **S1 차단:** Step 6 (Forcing 압박에서 도망) → PAIN-fundamental 해결 필수 (v3 prompt 그대로 차용).
- **S1 보조 차단:** Step 2 (Plugin install 실패) → PAIN-base 해결 필수 (단일 명령 install).
- **S2 차단:** Step 2 (영향 phase 자동 식별 부정확) → PAIN-DELTA-scope 해결 필수.
- **S3 차단:** v4.1.

## 8. 다음 phase 인풋

Phase 3 (Features)에:
- §6 Pain Priority 표 (P0 우선 기능화)
- §7 차단 단계 (각 차단 해결 Spec 매핑)
- 시나리오 별 magic moment 식별 (성공 metric anchor)

(EXPANSION 후보로 surface — Phase 3 cherry-pick 시 검토:
- e1 다른 Persona 추가 (Edge-1 → Primary 승격)
- e2 새 시나리오: design review (작성 spec을 팀에 review 요청)
- e3 PRD §10 cherry-pick: AI 자동 review · DELTA timeline · 다중 LLM provider)

## 9. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-2-1 | Edge-1 (non-developer)을 v4 첫 release primary 승격? Phase 3 결정 | maintainer | N |
| OQ-2-2 | Edge-2 (multi-project) 대시보드 multi-tab v4 첫 release 포함? | maintainer | Phase 6 IA |
| OQ-2-3 | S3 Refactor v4.1 또는 v4.2 | maintainer | Phase 13 |
