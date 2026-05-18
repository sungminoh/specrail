# Change Proposal: graph view modes

**Status:** proposed
**Date:** 2026-05-18
**Capability:** graph-view-modes
**Predecessor:** M9 + DELTA-2 (commit `81f578d`)
**Author:** dogfood — surfaced after DELTA-2 layout fix

## Why

User feedback after DELTA-2: *"graph 너무 복잡하고 전혀 뭐 이해가 안되네."*

**진단:** graph page 의 default 동작이 "모든 것을 한 번에 보여주는 free-form filter" 모델. 결과적으로:
- 400 노드 / 1100+ 엣지 spec 에서 phase-collapsed 13개 노드가 canvas 하단에 작게 뭉쳐있음 — 화면 비례가 깨짐
- Legend overlay 가 캔버스의 ~30% 점유, default open
- 좌측 FILTERS sidebar 4종 filter 동시 노출 (PHASE chip 13개 + KIND + ORPHANS + DANGLING)
- 사용자가 "어디부터 봐야 하나" 진입점이 없음 — 모든 옵션이 동등하게 노출됨

**원인:** "전체를 보여주고 user 가 filter 로 좁혀라" 패러다임. 일반적인 graph 탐색 UX 인데, 본 product 의 사용자가 *해결하려는 실제 질문*과 mismatch.

**Real questions users have:**
1. "전체 phase 흐름이 어떻게 생겼나?" — phase-level overview
2. "phase 3 안에 뭐가 있고 어디로 연결?" — phase focus
3. "이 R1 이 뭐랑 연결?" — ID-level ego graph (이미 작동)
4. "뭐가 끊겼나?" — quality check (orphan/dangling)

## What Changes

### ADDED

**F2.8: Graph view modes** — 4개 명시적 모드. 상단 tab UI 로 전환:

| Mode | 답하는 질문 | Default? |
|------|------------|---------|
| **Overview** | 전체 phase 흐름 | ✓ |
| **Phase Focus** | 한 phase 안의 ID 들 + 1-hop boundary | |
| **ID Focus (Ego)** | 한 ID 의 N-hop neighborhood (기존 동작) | |
| **Quality** | orphans + dangling refs only | |

**Mode 별 동작:**

**Overview (default):**
- 13개 phase 노드만 렌더. 가로 layered (`elk.direction = RIGHT`).
- 노드 크게 (200x60), 라벨 명확 (`Phase 01 · PRD`).
- Inter-phase 엣지 두께 = aggregate ref 개수 (1~∞ → stroke 1.5~6px scale).
- 클릭 → Phase Focus mode 로 자동 전환 (해당 phase).
- Legend, filter sidebar 모두 숨김. 단순 toolbar 만 (mode tabs + legend toggle).

**Phase Focus:**
- 선택된 phase 의 IDs + 1-hop 바깥 boundary (다른 phase 의 인접 IDs).
- Boundary 노드는 dimmed (opacity 0.5) — "여긴 다른 phase 다" 시각 단서.
- 좌측 sidebar: phase chip 1줄 (현재 선택만 highlight), kind dropdown 보조.
- 노드 더블클릭 → ID Focus 로 전환.

**ID Focus (Ego):**
- 기존 동작 그대로. focus input + n-hop slider.
- toolbar 에 "← Overview" / "← Phase Focus" back 버튼.

**Quality:**
- Orphans (in=0 AND out=0) + Dangling refs (target 없음) 만 렌더.
- 노드 색상: orphans → muted, dangling → warning.
- Filter sidebar 비활성 (mode 자체가 filter).
- 비어있으면: "All clean — no orphans or dangling refs." friendly state.

### MODIFIED

- **F2.2** (Graph view): no longer a single free-form view. Renders selected mode.
- **F2.3** (N-hop slider): only active in ID Focus mode.
- **F2.6** (focus input + status tint): focus input pinned in ID Focus mode toolbar (was always-visible).
- **Legend overlay**: default closed (was open). Toggle button stays in toolbar.

### REMOVED

- 좌측 sidebar 의 "Phase chips" + "Kind dropdown" + "Orphans only" + "Dangling refs only" 항상 노출 — mode 에 흡수됨.

## Acceptance Criteria

- **AC-R2-9:** GIVEN graph page open, WHEN user clicks any of 4 mode tabs, THEN view re-renders within ≤ 200ms with mode-specific layout + filter state.
- **AC-R2-10:** GIVEN Overview mode, WHEN 400+ node spec loaded, THEN 13 large phase nodes are visible filling ≥ 60% of canvas, inter-phase edge weight = aggregate ref count.
- **AC-R2-11:** GIVEN Quality mode, WHEN no orphans/dangling exist, THEN friendly empty state shown (not blank canvas).

## Impact

- **영향받는 phase:** 3 (F2.x), 7 (W-CC-GRAPH wireframe), 13 (T9.8 T9.9).
- **Backward compatibility:** URL `?focus=<id>&hop=N` → ID Focus mode 로 자동 진입 (기존 link 깨지 않음).
- **No new API.** All client-side.

## Open Questions

| ID | 질문 | Resolved |
|---|---|---|
| OQ-VM-1 | Overview 클릭 → Phase Focus 자동? 아니면 사용자가 mode 전환 명시? | 자동 (UX flow 빠름) |
| OQ-VM-2 | Quality mode에 severity별 정렬? | 1차에선 단순 — orphans/dangling 두 그룹만 |
| OQ-VM-3 | URL state 보존 (`?mode=overview`)? | YES — 공유 가능 |
