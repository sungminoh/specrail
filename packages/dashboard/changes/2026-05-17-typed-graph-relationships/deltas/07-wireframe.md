# Delta — Phase 07 (Wireframe)

**Base:** `docs/spec/07-wireframe.md`
**Proposal:** [../proposal.md](../proposal.md)

## W-CC-PHASE — MODIFIED

기존 2-pane (sidebar + markdown) wireframe 에 optional 3rd pane 추가:

```
┌── sidebar ──┬── markdown body ──┬── CONNECTIONS ──┐
│ phase list  │ ## R1: Spec view  │ focus: R1       │
│   01 PRD    │ ...                │                 │
│ → 03 Featu… │ <ID-chip: R1>      │ ◀ solves        │
│   …         │ <ID-chip: NFR-1>   │     PAIN-2      │
│             │                    │ ◀ tested-by     │
│             │                    │     TC-3        │
│             │                    │ ▶ parent-r      │
│             │                    │     —           │
│             │                    │ [open in graph↗]│
└─────────────┴────────────────────┴─────────────────┘
```

- Right pane (Connections) width: 320px desktop, collapsible to 32px chevron rail.
- Pinned state in localStorage.
- Mobile (≤ 768px): pane hidden, accessible via ID chip long-press → modal overlay.

## W-CC-GRAPH — MODIFIED

기존 chrome 위에 추가:
- 상단 toolbar 에 focus 입력 (placeholder "focus an ID…") + n-hop slider (focus 입력 시 즉시 활성).
- 캔버스 우상단에 floating legend (8 edge kinds, click to toggle visibility).
- 노드 색이 status tint 적용 (Draft / Approved / Rejected 시각 구분).

```
┌────── focus: [_____] hop: ▼─◯─────▲ 2  | legend [▽]┐
│                                                     │
│         (graph canvas — edges colored by kind)      │
│                                                     │
│  [legend overlay (top-right):                       │
│    ── solid red       solves                        │
│    ── solid orange    linked-features               │
│    ── solid amber     parent                        │
│    ── solid green     tested-by                     │
│    ── dashed green    covers-ac                     │
│    ── solid purple    mitigates                     │
│    ── dashed blue     linked-arch                   │
│    ── solid gold      depends-on                    │
│    ── dashed grey     (prose mention, no kind)      │
│  ]                                                  │
└─────────────────────────────────────────────────────┘
```

## ADD — W-CC-CONNECTIONS

```markdown
## 13. W-CC-CONNECTIONS — Connections panel (inline pseudo-screen)

Sub-region of W-CC-PHASE (right pane).

**Anatomy:**
- Header: focus chip + kind badge + phase/line micro-link
- Outbound section: grouped by edge kind (solves / linked-features / parent / depends-on)
- Inbound section: grouped by edge kind (tested-by / covers-ac / mitigates / linked-arch)
- Footer: "open in graph ↗" button (deep-link to W-CC-GRAPH with focus + hop=2)

**State:** managed by `useGraphConnections(projectId, focusId)` hook (derives from cached graph query).
**Refresh budget:** ≤ 16ms (NFR-PERF-6).
```
