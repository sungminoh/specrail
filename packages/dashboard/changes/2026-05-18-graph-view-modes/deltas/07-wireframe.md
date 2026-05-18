# Delta — Phase 07 (Wireframe)

**Base:** post-DELTA-2 `docs/spec/07-wireframe.md`
**Proposal:** [../proposal.md](../proposal.md)

## W-CC-GRAPH — REVISED

기존 single canvas 변경 → mode-aware toolbar:

```
┌── sidebar ──┬── graph canvas ───────────────────────────────────────────┐
│ phase list  │  [Overview]  [Phase Focus]  [ID Focus]  [Quality]   legend ▶│
│   …         │  ────────────────────────────────────────────────────────  │
│ Graph (on)  │                                                            │
│             │  (canvas — mode-specific layout)                           │
│             │                                                            │
│             │  Overview: 13 large phase nodes, gold inter-phase edges    │
│             │  Phase Focus: phase chip strip + N nodes of that phase     │
│             │  ID Focus: focus input + n-hop slider + ego graph          │
│             │  Quality: orphans/dangling only + friendly empty state     │
└─────────────┴────────────────────────────────────────────────────────────┘
```

- Tab style: pill segmented control top-left, active = gold accent border.
- Legend: floating popover, default closed (was open). Toggle button right of tabs.
- Mode-specific accessories (focus input · n-hop slider · phase chips) appear/disappear with mode.
- Empty Quality state: centered prose "All clean — no orphans or dangling refs."
- Overview node size: ≥ 160px wide, label "Phase 01 · PRD" (vs. tiny rects in old default).
