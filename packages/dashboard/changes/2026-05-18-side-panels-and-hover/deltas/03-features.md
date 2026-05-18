# Delta — Phase 03 (Features)

**Base:** post-M9 `docs/spec/03-features.md`
**Proposal:** [../proposal.md](../proposal.md)

## R2 — Acceptance Criteria ADD

- **AC-R2-7:** GIVEN phase view, WHEN Connections panel 또는 ChatDrawer 가 open, THEN markdown 본문의 가운데 정렬과 reading column 너비 (≤ 760px) 가 변하지 않는다.
- **AC-R2-8:** GIVEN Connections panel open + neighbor row mouse hover, WHEN 200ms 정지, THEN tooltip 표시 (id / kind / status / phase·line / preview).

## F2.4 MODIFIED — layout 명세

기존 "right rail (3rd pane in W-CC-PHASE)" 표현을 변경:

> **Layout:** floating right side panel. `position: fixed; right: 0; top: <header offset>; height: calc(100vh - header)`. Markdown 본문에 영향 없이 sticky. Open 시 markdown 의 우측 여백 (margin-right) 만 reserve — 본문 가운데 정렬 안정 유지. 좁은 화면 (≤ 1100px) 에서는 overlay fallback (markdown 위에 살짝 덮음; backdrop 없음).

## F4.2 MODIFIED — layout 명세

기존 ChatDrawer 의 grid-template-columns 침범 방식 제거:

> **Layout:** F2.4 와 동일한 floating right side panel pattern. Connections + Chat 둘 다 open 시 vertically stacked (top half: Connections, bottom half: Chat). Reading column 너비 불변.

## ADD — F2.7: Connections hover tooltip

```markdown
### F2.7: Connections neighbor hover tooltip

<!-- specrail:attrs id=F2.7 -->
\`\`\`yaml
status: proposed
parent-r: R2
linked-features: [F1.2, F2.4]
linked-ac: [AC-R2-8]
\`\`\`
<!-- /specrail:attrs -->

**Description:** Connections panel 의 neighbor row 위 mouse hover → 200ms 후
IdPopover 와 동일한 tooltip 표시 (id / kind / status / phase·line / preview).
구현: 기존 `IdPopover` 의 selector 를 `.id-chip, .conn-neighbor-id` 로 확장.
Reuses idIndex cache — no new query.

#### S2.7.1: IdPopover selector 확장 + 적용
#### S2.7.2: hover delay tuning (open 200ms / close 100ms)
```
