# Wireframe

**Mode:** HOLD SCOPE
**Inputs:** Phase 6 Page Catalog (15개 P-CC-*)
**Reference:** `/reference-v3/07-wireframe.md`
**Date:** 2026-05-10 (v4.0 — dashboard scope 제거 후)

> 단일 surface — Claude Code 응답이라 단일 zone 패턴 + variation. (Dashboard wireframe 9개는 v4.5 cycle.)

---

# W-CC-pattern: Claude Code 응답 표준 zone

**Page:** P-CC-1 ~ P-CC-15 (15개 inheritance)
**Surface:** Claude Code session (terminal text)
**Primary Device:** terminal + desktop. 모바일은 read-only.

## 들어오는·나가는 경로

들어오는: 사용자 명령 또는 skill chain 자동 trigger
나가는: 사용자 응답·승인·수정 요청

## Layout

```
┌────────────────────────────────────────────────────────┐
│ [Z1: Phase Header]                                      │
│ ## Phase {N}: {Phase name}                              │
│ Mode: HOLD SCOPE (inherited)                            │
│ Status: 🔄 Draft / ✓ Approved / ⚠ Hook Block            │
├────────────────────────────────────────────────────────┤
│ [Z2: Inputs Received] (이전 phase frontmatter)          │
│ - PRD §3.1 Persona                                      │
│ - Phase 2 Pain Priority (PAIN-1, ...)                   │
├────────────────────────────────────────────────────────┤
│ [Z3: Output draft] (산출물 markdown 본문)               │
│ ## R1: ...                                              │
│ ### F1.1: ...                                           │
│ AC-R1-1: GIVEN ... WHEN ... THEN ...                    │
│ ...                                                      │
├────────────────────────────────────────────────────────┤
│ [Z4: Self-Check 결과]                                   │
│ ✓ Vague AC: 0건                                         │
│ ✓ ID consistency: 0 violation                           │
│ ⚠ Open Questions: 3건 (OQ-3-1·2·3)                      │
├────────────────────────────────────────────────────────┤
│ [Z5: Markdown 검토 가이드]                              │
│ 📄 docs/spec/{NN-name}.md (file open in IDE)            │
│ 🌐 GitHub URL or VS Code preview                        │
├────────────────────────────────────────────────────────┤
│ [Z6: Next Step Prompt]                                  │
│ <HARD-GATE>                                             │
│ A) 승인 → Phase {N+1}                                   │
│ B) 수정 요청                                            │
│ </HARD-GATE>                                            │
└────────────────────────────────────────────────────────┘
```

(이전 EXPANSION 버전의 Z5 "Dashboard Link"는 "Markdown 검토 가이드"로 변경 — file path + GitHub/VS Code preview 안내. v4.5 dashboard cycle에서 Z5에 dashboard URL 추가.)

## Element Spec

| Element ID | 종류 | 표시 데이터 | Source |
|---|---|---|---|
| E-CC-1 | Header (H2) | "Phase {N}: {name}" | ENT-Phase.id, .name |
| E-CC-2 | Mode indicator | inherited mode | ENT-Phase.mode (PRD §10) |
| E-CC-3 | Status indicator (icon + text) | Draft/Approved/HookBlock | SM-Phase + SM-Hook |
| E-CC-4 | Inputs list (markdown bullets) | 이전 phase frontmatter parsed | F1.2 (R1.F2 input auto-inject) |
| E-CC-5 | Output draft (nested markdown) | 산출물 본문 | LLM 생성 (per phase) |
| E-CC-6 | Self-Check 결과 (✓/⚠/❌ icon + 항목) | grep + frontmatter validation | F2.1, F2.3, F2.4 |
| E-CC-7 | Markdown 검토 가이드 | file path + GitHub/VS Code 안내 | static |
| E-CC-8 | HARD-GATE prompt | 승인/수정 옵션 | F5.4 |

## Component States

### State 1: Loading (skill 호출 중)
- Z3·Z4 placeholder ("…" 또는 spinner). Z1·Z2 표시.
- 사용자에 "Phase {N} skill 작동 중" 안내.

### State 2: Empty (Phase 첫 시작 — Phase 1 init)
- Z2 (Inputs)가 비어있음 — "이전 phase 없음, raw idea 받음" 표시.
- Z3가 6 forcing questions 진행 중 표시.

### State 3: Hook Block (P-CC-5)
- Z1 status: "⚠ Hook Block"
- Z3 위치에 violation 명시:
  - "INV-2 위반: 정의 안 된 ID 인용 (S99.1.1)"
  - "→ valid IDs: [list]"
- Z4 ❌ 표시
- Z6 prompt: "수정 후 재commit"

### State 4: Success
- 위 Layout 정상

### State 5: Escalation (P-CC-15, BLOCKED subagent)
- Z1 status: "⚠ Subagent Blocked (Implementation stage)"
- Z3 위치에 BLOCKED 사유 + 옵션
- Z6 prompt: "재시도 / 사용자 결정 / spec 수정"

## Responsive

Terminal text — viewport 무관. 모바일 Claude Code app에서도 읽기 가능. 명령은 데스크톱 first.

## Interactions

| Interaction | Element | Trigger | 결과 | SM 영향 |
|---|---|---|---|---|
| 승인 | E-CC-8 | "approve phase N" | Phase transition | SM-Phase: Draft → Approved |
| 수정 요청 | E-CC-8 | 자유 텍스트 | Z3 재작성 | SM-Phase: Draft 유지 |
| File open | E-CC-7 | file path 클릭 또는 IDE에서 직접 | IDE/editor 열림 | - |
| Hook violation 수정 | E-CC-6 | 사용자 file edit + 재commit | Hook 재실행 | SM-Phase: Draft 유지 |

## Accessibility

- 모든 status는 색 + icon + 텍스트 (색만으로 정보 X)
- Markdown semantic 위계 (H2/H3)
- Code block fence + lang
- HARD-GATE는 명시 prompt — screen reader 친화
- File path는 클릭 가능 hyperlink (terminal · GitHub UI · VS Code 모두)

---

## 색·폰트 규약 (Claude Code 응답 = terminal markdown)

- **색:** terminal default. 의미 색만 emoji/icon 사용:
  - 🟢 ✓ green = Applied/Done/Approved (성공)
  - 🟡 🔄 yellow = Proposed/Draft (진행 중)
  - 🟠 orange = Review/Implementing (활성 작업)
  - ⚪ gray = Archived/Empty
  - 🔴 ❌ red = Hook fail/Error (경고)
- **폰트 크기:** terminal 기본 (markdown rendered 시 H1/H2/Body — IDE/GitHub의 default)

(Dashboard 색·폰트 — Tailwind / 디자인 시스템 등 — v4.5 cycle.)

---

## Self-Check

```bash
# Wireframe 수
grep -c "^# W-" 07-wireframe.md   # 1 (CC-pattern)

# 5 component states 명시
grep -cE "State [0-9]:" 07-wireframe.md

# Element source 인용
grep -A1 "^| E-CC" 07-wireframe.md | grep -cE "ENT-|F[0-9]|UI state|system|static"
```

체크리스트:
- [x] W-CC-pattern은 P-CC-* 15에 inheritance
- [x] Primary device 명시 (terminal+desktop)
- [x] 모든 element가 Source 인용
- [x] 5 component states (Loading/Empty/HookBlock/Success/Escalation)
- [x] 색은 의미만 (status emoji/icon)
- [x] Interactions 표
- [x] Accessibility 명시
- [x] 들어오는·나가는 Edge

## Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-7-1 | Z3 출력 형식 — markdown 그대로 vs syntax-highlighted code | maintainer | Phase 8 |
| OQ-7-2 | E-CC-7 file path를 자동 클릭 가능 (terminal hyperlink) — Claude Code 지원 여부 | maintainer | Phase 8 spike |

## 다음 phase 인풋

Phase 8 (Architecture)에:
- Claude Code skill 응답 형식 (markdown + tool call)
- File path hyperlink mechanism

Phase 9 (NFR)에:
- A11y: terminal screen reader, color + icon duplication

Phase 10 (Test):
- Wireframe 5 state 검증 (skill 응답 sample test)
