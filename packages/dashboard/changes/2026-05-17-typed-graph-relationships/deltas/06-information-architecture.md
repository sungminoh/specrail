# Delta — Phase 06 (Information Architecture)

**Base:** `docs/spec/06-information-architecture.md`
**Proposal:** [../proposal.md](../proposal.md)

## P-CC-4 (Phase view) — MODIFIED

기존 본문 (3-pane shell 안의 phase markdown 영역) 에 추가:
> Phase markdown 영역은 optional 3-pane variant 를 지원: markdown body | (toggle) Connections panel.
> Connections panel 의 visibility 는 localStorage `phase-view.connections-panel.open` 으로 sticky.
> Default: open (좁은 화면 ≤ 1280px 자동 close; OQ-DELTA-2 dogfood 후 확정).

## P-CC-5 (Graph view) — MODIFIED

기존 chrome 영역에 추가:
> 상단 chrome 슬롯: focus 입력 (typeahead) + edge-kind legend toggle.
> Focus 입력 결과는 URL search param (`?focus=<id>&hop=2`) 으로 deep-linkable.

## E-CC: Edge transitions — MODIFIED

기존 E-CC 표에서 phase view ↔ graph view edge 가 일방향이었던 것을:
> Phase view 의 Connections panel 안 "Open in graph" 버튼 → graph view 로 focused deep-link.
> Graph view 노드 click → phase view 의 해당 ID 에 chip focus 자동 적용 (URL hash 로 전달).

## ADD — P-CC reference: Connections panel pseudo-component

(Connections panel 자체는 W-CC-CONNECTIONS 로 Phase 7 에서 정의. IA 측면에서는 P-CC-4 의 sub-region 으로 간주.)
