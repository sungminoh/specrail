# Change Proposal: side-panels + Connections hover tooltip

**Status:** proposed
**Date:** 2026-05-18
**Capability:** side-panels-and-hover
**Predecessor:** M9 typed-graph-relationships (commit `23cc966`)
**Author:** dogfood — surfaced immediately after M9 dogfood

## Why

M9 가 graph 효용 문제는 해결했지만, ConnectionsPanel 을 `phase-body` CSS grid 의 3번째 컬럼으로 배치하면서 새로운 문제 발생.

**증거:**
- Phase markdown 본문 column 너비가 panel 너비만큼 줄어듦 (1px 모니터 기준 약 320px 손실). DESIGN.md "Reading Room" 의 핵심 가치 — 안정적인 reading column — 가 깨짐.
- ChatDrawer 도 동일 구조 (`with-drawer` 가 grid template 을 변경)라 본문이 또 줄어듦. Connections + Chat 둘 다 열면 본문이 매우 좁아짐.
- Neighbor row 위에 마우스 올렸을 때 그 ID 가 어떤 entity 인지 (preview / line 위치) 모름 — 클릭해서 refocus 해야 알 수 있음. 1-hop 이상 탐색이 항상 commit-cost 를 수반.

**Pain mapping:** PAIN-? (reading flow disruption) — 새로 surface 됨. PRD §2.1 의 "사용자가 13 phase markdown 을 자연스럽게 읽고 이동" 의 violations.

## What Changes

### MODIFIED

1. **F2.4 Connections panel — layout: floating right side panel**
   - 현재: `phase-body` CSS grid 의 3rd column (markdown column 너비 침범)
   - 변경: `position: fixed; right: 0; top: <header>` — markdown 본문에 영향 없이 떠 있음.
   - Open/closed toggle 그대로. Open 시 markdown 위에 살짝 겹치는 게 아니라, **markdown 의 우측 여백 (margin-right) 을 일시적으로 확보** — 본문은 중앙에 안정 유지.
   - 좁은 화면 (≤ 1100px): panel open 상태에서 markdown 의 우측 여백이 부족하면 fallback 으로 overlay (markdown 위에 살짝 덮음). ESC 또는 toggle 버튼으로 close.

2. **F4.2 ChatDrawer — layout: same right side panel pattern**
   - 현재: `phase-body.with-drawer` grid template change (markdown column 침범)
   - 변경: F2.4 와 동일한 fixed-right pattern. ChatDrawer 와 ConnectionsPanel 은 **mutually exclusive on right side** — 둘 다 열면 vertically stacked (top half: Connections, bottom half: Chat) 또는 user 가 toggle 로 하나만 열기 (default: 둘 다 보일 때는 stacked).

3. **W-CC-PHASE wireframe — markdown column 고정 너비**
   - 새로: markdown 본문은 `max-width: 760px; margin: 0 auto;` 로 항상 가운데 안정. Panel open 여부와 무관.
   - Sidebar (left) 와 right-panels 는 fixed/sticky overlay. Reading column 은 reading column.

### ADDED

4. **F2.7: Connections hover tooltip**
   - 새 feature: neighbor row 의 ID chip 위에 mouse hover → 200ms 후 tooltip 표시.
   - Content: id + kind + status + 정의 phase/line + 첫 ~150자 preview (idIndex 재활용).
   - 구현: 기존 IdPopover 메커니즘 재활용 — `.id-chip` 셀렉터 외에 `.conn-neighbor-id` 도 동일 hover 동작 적용.
   - Latency: ≤ 16ms hover → render (idIndex cached). Disappear delay 100ms.

5. **AC-R2-7:** GIVEN phase view, WHEN Connections panel 또는 ChatDrawer 가 open, THEN markdown 본문의 가운데 정렬과 reading column 너비 (≤ 760px) 가 변하지 않는다.

6. **AC-R2-8:** GIVEN Connections panel open + neighbor row 위 mouse hover, WHEN 200ms 정지, THEN tooltip 표시 (id / kind / status / phase·line / preview).

7. **NFR-PERF-7:** side-panel toggle (open ↔ close) animation duration ≤ 200ms. 측정: client perf API. Violation: warn.

### REMOVED

- 없음. Functional 변화 없이 layout 만 변경. localStorage sticky 키 유지.

## Impact

- **영향받는 phase:**
  - Phase 3 (Features): F2.4 layout 명세 수정, F2.7 추가, AC-R2-7/8 추가, F4.2 layout 명세 수정
  - Phase 6 (IA): P-CC-4 (3-pane → 1-pane reading + floating right panels)
  - Phase 7 (Wireframe): W-CC-PHASE 수정 (centered reading column + floating panels)
  - Phase 9 (NFR): NFR-PERF-7 추가
  - Phase 10 (Test): TC 1건 (hover tooltip), TC 1건 (reading column stability)
  - Phase 13 (Impl plan): M9 amendment — T9.6 (panel refactor) + T9.7 (hover tooltip)
- **Persona 변화:** 없음.
- **Non-Goal 변화:** 없음.
- **성공지표 변화:** 없음 (NFR-PERF-7 신규 추가).
- **Backward compatibility:** CSS-only changes for layout. Panel state localStorage key unchanged.

## Open Questions

| Q ID | 질문 | Blocking? |
|------|------|-----------|
| OQ-SP-1 | Connections + Chat 둘 다 open 시 stacked vertically vs tabs? | N (default: stacked, half-height each — dogfood 후 재평가) |
| OQ-SP-2 | overlay fallback 시 markdown 위에 panel 이 띄울지, dim backdrop 깔지? | N (no backdrop — reading 가능해야 함) |
| OQ-SP-3 | Tooltip 위에서 다시 hover 가능해야 하나 (texture select / copy)? | N (M9 IdPopover 결정 동일 — pointer-events:none, copy 안 됨) |

## Verification gates

1. Visual: 1280px / 1100px / 900px / 800px breakpoint 에서 markdown 가운데 정렬 + reading column ≤ 760px 안정 유지.
2. Functional: panel toggle (close/open) 시 markdown 위치 / scroll position 안 흔들림.
3. Hover tooltip: neighbor chip → 200ms → preview 표시; mouseleave → 100ms → 사라짐.
4. localStorage sticky: refresh 후에도 panel open state 유지.
