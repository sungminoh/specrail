# Delta — Phase 03 (Features)

**Base:** post-DELTA-2 `docs/spec/03-features.md`
**Proposal:** [../proposal.md](../proposal.md)

## R2 — Acceptance Criteria ADD

- **AC-R2-9:** GIVEN graph page open, WHEN user clicks one of 4 mode tabs (Overview / Phase Focus / ID Focus / Quality), THEN view re-renders within ≤ 200ms with mode-specific layout + filter state.
- **AC-R2-10:** GIVEN Overview mode + 400+ node spec, WHEN initial render, THEN 13 large phase nodes (≥ 60% canvas coverage) with aggregate inter-phase edges (stroke weight = ref count).
- **AC-R2-11:** GIVEN Quality mode + clean spec, WHEN no orphans/dangling, THEN "All clean — no orphans or dangling refs." friendly empty state.

## F2.2 MODIFIED — driven by mode

기존 free-form filter 동작 변경:
> Graph view 는 4개 view mode 중 하나를 렌더. 기본 Overview. 사용자가 mode tab 으로 명시적 전환. Free-form filter (phase chips · kind · orphans · dangling) 은 mode 가 의미있을 때만 노출.

## F2.3 MODIFIED — N-hop slider scope

> N-hop slider 는 **ID Focus mode 에서만** 활성. Overview/Phase Focus/Quality 에서는 hidden.

## F2.6 MODIFIED — focus input scope

> Focus input 은 **ID Focus mode 에서만** 항상 노출. 다른 mode 에서도 typeahead 검색 box 는 유지하되 commit 시 mode 가 자동 ID Focus 로 전환.

## ADD — F2.8: Graph view modes

```markdown
### F2.8: Graph view modes (4 명시적 modes)

<!-- specrail:attrs id=F2.8 -->
\`\`\`yaml
status: proposed
parent-r: R2
solves-pains: [PAIN-4]
linked-ac: [AC-R2-9, AC-R2-10, AC-R2-11]
\`\`\`
<!-- /specrail:attrs -->

**Description:** Graph page 가 4개 모드 중 하나만 렌더 — 사용자가 명시적 tab 으로 전환.

#### S2.8.1: Mode state + URL search param (`?mode=overview|phase|id|quality`)
#### S2.8.2: Overview — 13개 phase 노드, aggregate edge weight, 가로 layered layout
#### S2.8.3: Phase Focus — 선택 phase 의 IDs + 1-hop boundary (dimmed)
#### S2.8.4: ID Focus — 기존 ego graph (focus input + n-hop)
#### S2.8.5: Quality — orphans + dangling refs only + friendly empty state
#### S2.8.6: Mode-aware sidebar (Quality 에서는 필터 비활성, Overview 에서는 sidebar hide)
```
