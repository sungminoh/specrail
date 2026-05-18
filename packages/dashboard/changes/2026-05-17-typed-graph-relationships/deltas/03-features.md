# Delta — Phase 03 (Features)

**Base:** `docs/spec/03-features.md` (current Approved version)
**Proposal:** [../proposal.md](../proposal.md)

## R2: Cross-reference exploration — MODIFIED

### Acceptance Criteria — ADD

- **AC-R2-5:** GIVEN graph view, WHEN 노드 / edge 표시, THEN edge stroke 가 `kind` 에 따라 8 가지 visually distinguishable 하고 legend 가 항상 노출.
- **AC-R2-6:** GIVEN phase view + ID hover/click, WHEN Connections panel 활성, THEN ≤ 16ms 안에 그 ID 의 typed neighbors 가 edge kind 별로 grouped 표시 (in/out 구분 포함).

### F2.2: Graph view (React Flow + elkjs) — MODIFIED

기존 본문에 추가:
> Edge stroke / dasharray / color 가 `edge.kind` 에 따라 다름 (8 closed-enum). null kind (prose mention) 는 기존 회색 fallback.

### F2.3: N-hop slider — MODIFIED

기존 본문에 추가:
> N-hop 활성 trigger: 노드 click **또는** 상단 focus 입력.

## ADD — F2.4: Connections panel (inline)

```markdown
### F2.4: Connections panel (inline in phase view)

<!-- specrail:attrs id=F2.4 -->
\`\`\`yaml
status: proposed
parent-r: R2
solves-pains: [PAIN-2]
\`\`\`
<!-- /specrail:attrs -->

**Description:** Phase markdown 우측에 always-visible right-rail. 현재 focus 중인 ID 의 typed neighbors 를 edge kind 별로 grouped list 로 표시.

**Trigger:** chip hover / click / Connections panel 자체에서 다른 neighbor click.
**UX:** Collapsible (sticky in localStorage; default open).
**Out:** "Open in graph" deep-link → `?focus=<id>&hop=2`.

#### S2.4.1: Connections panel render (TanStack Query 기반)
#### S2.4.2: Focus state synchronization (chip ↔ panel)
#### S2.4.3: localStorage sticky collapse state
```

## ADD — F2.5: Typed graph relationships (core)

```markdown
### F2.5: Typed graph relationships

<!-- specrail:attrs id=F2.5 -->
\`\`\`yaml
status: proposed
parent-r: R2
\`\`\`
<!-- /specrail:attrs -->

**Description:** core 가 `<!-- specrail:attrs -->` 블록의 closed-enum 8 yaml key
(`solves`, `linked-features`, `parent`, `tested-by`, `covers-ac`, `mitigates`,
`linked-arch`, `depends-on`) 를 typed-ref 로 추출. 기존 prose-mention ref 와 union.

#### S2.5.1: `extractTypedRefs(body)` in @specrail/core
#### S2.5.2: SpecRef zod schema `kind?` field 확장
#### S2.5.3: fs.ts adapter 가 typed + prose refs 머지
```

## ADD — F2.6: Graph focus input + status tint

```markdown
### F2.6: Graph focus + status tint

<!-- specrail:attrs id=F2.6 -->
\`\`\`yaml
status: proposed
parent-r: R2
\`\`\`
<!-- /specrail:attrs -->

**Description:** Graph 상단 chrome 에 focus 입력 (typeahead, idIndex 재활용).
입력 즉시 ego mode 활성 (현 구현: 노드 click 필요). 노드 color tint by attrs.status.

#### S2.6.1: Focus input 컴포넌트 + idIndex 결합
#### S2.6.2: nodeStyleForKind 확장 — status tint (Draft/Approved/Rejected)
#### S2.6.3: Legend overlay (8 edge kinds)
```
