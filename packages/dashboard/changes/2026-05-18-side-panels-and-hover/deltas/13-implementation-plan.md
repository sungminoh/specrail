# Delta — Phase 13 (Implementation Plan)

**Base:** post-M9 `docs/spec/13-implementation-plan.md`
**Proposal:** [../proposal.md](../proposal.md)

## M9 — AMENDED

기존 §M9 에 task 추가:

```markdown
<!-- specrail:attrs id=T9.6 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "Visual: 1280/1100/900px breakpoints — markdown column stays centered (max-w 760px); Connections + Chat panels both open render as vertically stacked floating panels"
commit-msg-stub: "refactor(web): Connections + Chat as floating right side panels (AC-R2-7)"
depends-on: [T9.3]
linked-ac: [AC-R2-7]
linked-features: [F2.4, F4.2]
\`\`\`
<!-- /specrail:attrs -->

**T9.6 — Floating side panels refactor**
- Move ConnectionsPanel + ChatDrawer mount from PhaseRoute to AppShell.
- Replace `phase-body` CSS grid with single centered reading column.
- Position both panels `fixed; right: 0`. Stacked vertically when both open.
- Collapsed-rail chevron lives at viewport-right.
- Narrow-screen overlay fallback (≤ 1100px) without backdrop.

<!-- specrail:attrs id=T9.7 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "Hover `.conn-neighbor-id` for 200ms → IdPopover renders with same id index data (AC-R2-8)"
commit-msg-stub: "feat(web): hover tooltip on Connections neighbors (F2.7)"
depends-on: [T9.6]
linked-ac: [AC-R2-8]
linked-features: [F2.7]
\`\`\`
<!-- /specrail:attrs -->

**T9.7 — Connections hover tooltip**
- Extend `IdPopover` selector to `.id-chip, .conn-neighbor-id`.
- Verify idIndex includes attrs-block-defined IDs (already done in r3).
- 200ms open delay / 100ms close delay (NFR-PERF-7 budget).
```

## §14 Done Definition — v0.2.0 ship gate AMENDED

추가:
- [ ] AC-R2-7 + AC-R2-8 PASS (visual smoke + hover smoke)
- [ ] NFR-PERF-7 PASS
- [ ] Markdown reading column 760px 안정 (any panel state)
