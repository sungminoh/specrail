# Delta — Phase 07 (Wireframe)

**Base:** post-M9 `docs/spec/07-wireframe.md` (with W-CC-CONNECTIONS already merged or pending)
**Proposal:** [../proposal.md](../proposal.md)

## W-CC-PHASE — REVISED layout

기존 3-pane variant 를 **1 reading column + floating side panels** 로 변경:

```
┌── sidebar ──┬────────── markdown body (centered, max-w 760px) ──────────┐
│ phase list  │                                                              ┌─── CONN ────┐
│   01 PRD    │      ## R1: Spec view                                        │ focus: R1   │
│ → 03 Featu… │      (reading column stays centered regardless of panels)    │ ◀ solves    │
│   …         │      <chip: R1>  <chip: NFR-PERF-2>                           │   PAIN-2    │
│             │                                                              │ ◀ tested-by │
│             │      …                                                       │   TC-3      │
│             │                                                              │ [graph ↗]   │
│             │                                                              └─────────────┘
│             │                                                              ┌─── CHAT ────┐
│             │                                                              │ (toggled)   │
│             │                                                              │ …           │
│             │                                                              └─────────────┘
└─────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

- **Markdown column:** `max-width: 760px; margin: 0 auto;` — Panel open 여부와 무관.
- **Right panels:** `position: fixed; right: 0; top: <header>; height: <viewport - header>`.
  - Stacked vertically when both open: Connections (top half), Chat (bottom half).
  - Each toggleable, each remembers state in localStorage (`phase-view.connections-panel.open`, `phase-view.chat-drawer.open`).
- **Collapsed state:** chevron-rail (32px) 가 viewport 우측에 sticky, 한 번 클릭으로 다시 expand.
- **Narrow screen (≤ 1100px):** panel 이 markdown 위에 overlay (backdrop 없음, 그 위에 떠 있음). ESC / toggle 로 close.
- **Tooltip:** neighbor row 위 hover → 200ms → IdPopover 와 동일한 표시 (mounted globally in AppShell).

## W-CC-CONNECTIONS — MODIFIED

기존 "right pane sub-region" → "floating right side panel":

> **Anatomy:** unchanged from M9.
> **Position:** `position: fixed; right: 0;`. Width 320px desktop, 280px tablet (≤ 1100px), hidden on mobile (≤ 768px — bottom sheet fallback).
> **Mount:** in `AppShell` (not in `PhaseRoute`) — survives phase navigation without remount; focus state persists.

## W-CC-CHAT — MODIFIED

기존 grid-template-columns ChatDrawer → floating panel:

> **Position:** same fixed-right pattern as W-CC-CONNECTIONS, stacked below it when both open.
> **Mount:** moved from `PhaseRoute` to `AppShell` for the same persistence reason.
