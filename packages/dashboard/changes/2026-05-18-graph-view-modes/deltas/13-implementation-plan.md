# Delta — Phase 13 (Implementation Plan)

**Base:** post-DELTA-2 `docs/spec/13-implementation-plan.md`
**Proposal:** [../proposal.md](../proposal.md)

## M9 — AMENDED

```markdown
<!-- specrail:attrs id=T9.8 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "Browser smoke: each of 4 mode tabs renders ≤200ms; Overview shows 13 large phase nodes filling >60% canvas; AC-R2-9 + AC-R2-10"
commit-msg-stub: "feat(web): graph view modes — Overview tab + mode state (F2.8)"
depends-on: [T9.4]
linked-ac: [AC-R2-9, AC-R2-10]
linked-features: [F2.8]
\`\`\`
<!-- /specrail:attrs -->

**T9.8 — GraphView mode tabs + Overview mode**
- Files: `packages/dashboard/web/src/features/graph/GraphView.tsx` — mode state, top tabs, URL sync (`?mode=`), Overview-specific filter/layout branch (13 nodes only, aggregate weighted edges).
- `styles/layout.css` — `.graph-mode-tabs`, `.graph-mode-tab`, `.graph-mode-tab.active`.

<!-- specrail:attrs id=T9.9 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "Phase Focus = single phase IDs + 1-hop boundary dimmed; Quality = orphans+dangling only with friendly empty state; AC-R2-11"
commit-msg-stub: "feat(web): Phase Focus + Quality modes + mode-aware sidebar (F2.8)"
depends-on: [T9.8]
linked-ac: [AC-R2-9, AC-R2-11]
linked-features: [F2.8]
\`\`\`
<!-- /specrail:attrs -->

**T9.9 — Phase Focus + Quality + sidebar refactor**
- Files: GraphView.tsx — Phase Focus mode filter branch; Quality mode filter (orphans + dangling); sidebar conditional render per mode; legend default closed.
```
