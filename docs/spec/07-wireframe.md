<!-- v4-plugin-refinement (T2.5c, architect 옵션 B): self-check bash blocks → ARCH-5 schema validator + ARCH-3 hooks 자동 강제. HARD-GATE 수동 승인 step → ADR-8 state machine 자동 enforce. 상대 경로 file 참조 → plugin runtime의 docs/spec/ resolver. v3 원본 prompt는 git tag v3-archive 참조. -->

---
name: phase-7-wireframe
description: 페이지별 layout, Element Spec, Component States(Loading/Empty/Error/Success), Responsive 2 breakpoints.
inputs-from: Phase 6 Page 명세 + Phase 5 들어오는·나가는 경로
trigger-words: wireframe, layout, UI, screen
mode: GREENFIELD | DELTA
---

# Phase 7: Wireframe

## Purpose

각 페이지 / 화면의 UI 구성을 사양화. 디자인이 아닌 **information layout**.

## Inputs

- Phase 6 Page Catalog
- Phase 5 페이지 Node에 들어오는·나가는 Edge
- Phase 4 Entity (필드명 매핑)
- (DELTA) `current/07-wireframe/`

<HARD-GATE>
Phase 6 사용자 승인 없이 진행 금지.
</HARD-GATE>

## Mode 상속

- EXPANSION: 추가 component 패턴 탐색
- SELECTIVE: Phase 6 페이지만 base
- HOLD: Phase 6 페이지 1:1 + 4-state (Loading/Empty/Error/Success) 모두
- REDUCTION: P0 페이지만 + Success state만

---

## Anti-Sycophancy

00-common 참조 + Phase 7 특화:

**금지:**
- "예쁘게 만들면..."
- "디자인 시스템에서..."
- "보통 이런 식으로 배치"

**대신:**
- 모든 element는 Phase 4 Entity attribute 또는 Phase 3 AC 인용 강제
- "Pixel-perfect"는 Phase 7이 아님 (디자인 단계)
- 색·폰트·구체 컴포넌트 라이브러리 금지

---

## Reasoning Procedure

1. Phase 6 페이지마다 Wireframe ID `W-{n}` (P-{n}와 1:1)
2. **단일 디바이스·플랫폼 우선** — PRD §5의 primary 환경 하나만 그림
3. Layout 설계 (zone 분할)
4. Element Spec — 각 element가 어느 Entity attribute / AC를 표시
5. Component States 4종 — Loading / Empty / Error / Success
6. Responsive 2 breakpoints (mobile / desktop) — 해당 시
7. Self-Check + 승인

---

## Constraints

1. **Wireframe ID `W-{n}` = Page ID `P-{n}`** — 1:1 매핑.
2. **단일 디바이스·플랫폼 우선** — 두 플랫폼 동시에 그리지 말 것 (산만).
3. **모든 element는 Entity attribute / AC 인용** — 정당화 없는 element 금지.
4. **4 Component States 필수** — Loading / Empty / Error / Success.
5. **Responsive (해당 시) 2 breakpoints** — mobile (≤768px) / desktop (≥769px). 그 외 안 다룸.
6. **색·폰트 금지** — 색은 black/white/gray만. 폰트 크기는 H1/H2/Body/Caption만.
7. **Page별 분리 파일** — `07-wireframe/W-{n}-{slug}.md`로.

---

## Output Format

각 wireframe 별도 파일:
```
07-wireframe/
├── W-1-{slug}.md
├── W-2-{slug}.md
└── ...
```

각 파일 구조:

````markdown
# W-{n}: <페이지 이름>

**Mode:** {inherited}
**Page:** P-{n}
**URL / 위치:** <패턴>
**Primary Device:** desktop | mobile | other (PRD §5)
**Date:** YYYY-MM-DD

## 1. 들어오는·나가는 경로 (Phase 5)

**들어오는:**
- E-{n}: from N-{x} (조건: ...)
- E-{m}: from N-{y} (조건: ...)

**나가는:**
- E-{a}: to N-{z} (조건: <성공>)
- E-{b}: to N-{w} (조건: <취소>)

## 2. Layout (Primary Device)

```
┌─────────────────────────────────────────────────────────┐
│ <Top zone>                                                │
├─────────────────────────────────────────────────────────┤
│ <Side zone>  │  <Main content zone>                      │
│              │                                            │
│              │  <Title (H1)>                              │
│              │  <Description (Body)>                      │
│              │  <Action zone> [Primary] [Secondary]       │
│              │                                            │
│              │  <Content list / detail / form>           │
│              │  ┌───────────────────────────────────┐    │
│              │  │ <Item / row / field>               │    │
│              │  └───────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 3. Element Spec

| Element ID | 종류 | 표시 데이터 | Source |
|---|---|---|---|
| E-1 | <Logo / nav / button / list / form> | <표시 내용> | <static / ENT-X.attr / AC-R{n}-{m}> |
| E-2 | ... | ... | ... |
| E-3 | ... | ... | ... |

## 4. Component States

### State 1: Loading
- <어느 element가 placeholder / skeleton / spinner>
- <어느 element가 disabled>

### State 2: Empty
- <어느 zone이 empty 안내 + CTA>
- <onboarding tip 위치>

### State 3: Error
- 종류 1: 권한 거부 → <어디로>
- 종류 2: 네트워크 실패 → <인라인 또는 banner>
- 종류 3: 서버 오류 → <인라인 banner>
- 종류 4: Validation 실패 (form) → <각 input 아래 message>

### State 4: Success
- 위 Layout 정상 표시

## 5. Responsive (해당 시 — Mobile breakpoint ≤768px)

```
<모바일 layout ASCII>
```

차이점:
- <Side zone> → <Drawer / 햄버거>
- <Action zone> → <화면 폭 채우는 button>
- <List row> → <vertical 형식>

## 6. Interactions

| Interaction | Element | Trigger | 결과 | SM 영향 |
|---|---|---|---|---|
| <행동> | E-{n} | click / submit / swipe | <결과> | SM-<Entity>: <전이> |

## 7. Accessibility

- 모든 button에 aria-label
- 색만으로 정보 전달 금지 (Status는 색 + 텍스트)
- Tab order: <순서>
- Focus indicator: 명확한 ring
- Empty state는 screen reader가 안내 가능

## 8. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-7-W{n}-1 | ... | <역할> | N |
````

---

## DELTA Mode

기존 wireframe 위에 변경.

### 형식

영향받는 wireframe만 새로 또는 수정 버전:

`changes/{date}-{topic}/deltas/07-wireframe-delta.md`:

````markdown
## ADDED Wireframes
- W-{n}-{slug}.md (full)

## MODIFIED Wireframes
### W-{existing}
- Element Δ:
  | E ID | Before | After | Reason |
- State Δ: <Loading state 추가/변경 등>
- Layout Δ: <zone 추가/제거>
- Migration: <users 영향>

## REMOVED Wireframes
- W-{n}: 사라짐. 어디로 redirect.
````

---

## Self-Check (디렉토리 전체에 대해)

```bash
# Wireframe ID Page와 1:1
ls 07-wireframe/W-*.md | sed 's|.*W-||;s|-.*||' | sort -u > w_ids.txt
grep -E "^\| P-[0-9]+" 06-information-architecture.md | grep -v "P-40\|P-50" | sed 's|.*P-||;s| .*||' | sort -u > p_ids.txt
diff p_ids.txt w_ids.txt   # 빈 결과 = 1:1

# 각 wireframe에 4 states 모두
for f in 07-wireframe/W-*.md; do
  for state in Loading Empty Error Success; do
    grep -q "State.*$state" "$f" || echo "$f: $state 누락"
  done
done

# Element source 인용
for f in 07-wireframe/W-*.md; do
  grep -A1 "^| E-[0-9]" "$f" | grep -cE "ENT-|S[0-9]+\.|F[0-9]+\.|static"
done

# 색·폰트 디테일 노출
grep -iE "blue|red|green|#[0-9a-f]{3}|font-weight|14px|16px" 07-wireframe/

# Responsive 2 breakpoints (해당 시)
for f in 07-wireframe/W-*.md; do
  grep -q "Mobile\|≤768px\|Primary Device" "$f" || echo "$f: device·responsive 표시 누락"
done
```

체크리스트:
- [ ] W-{n} = P-{n} (1:1)
- [ ] 단일 primary device로 그림
- [ ] 모든 element가 Source 인용 (Entity / AC / static)
- [ ] 4 component states 모두
- [ ] Responsive (해당 시)
- [ ] 색은 black/white/gray만
- [ ] 폰트는 H1/H2/Body/Caption만
- [ ] Interactions 표 (Trigger → 결과 → SM 영향)
- [ ] Accessibility 4항목
- [ ] 들어오는·나가는 Edge 명시

---

<HARD-GATE>
Self-check 통과 + 사용자 승인. Phase 8 진행.
</HARD-GATE>