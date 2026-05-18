# Change Proposal: typed-graph-relationships + Connections panel

**Status:** proposed
**Date:** 2026-05-17
**Capability:** typed-graph-relationships
**Author:** dogfood — surfaced after 0.1.0-alpha.1 user feedback

## Why

현재 graph view 의 실효성이 거의 없다는 dogfood 피드백.

**증거:**
- dashboard 자기 spec 기준 **400 nodes / 2010 edges**. 200+ 노드 임계치를 자동 collapse 하면 13 phase 노드와 ~50 inter-phase 화살표만 보임 — bird's-eye view 인데 행동 가능한 정보가 없다.
- `/api/graph` 응답의 모든 edge `kind` 가 `null`. `schemas/attrs.schema.json` 의 closed-enum 8종 (`solves`, `linked-features`, `parent`, `tested-by`, `covers-ac`, `mitigates`, `linked-arch`, `depends-on`) 이 존재하지만 graph 데이터로 surfaces 되지 않음. 결과: 회색 edge 만 보이고 "이게 어떤 관계인지" 불명.
- Graph view 가 별도 페이지에 있어서 phase markdown 읽다가 "이 R1 을 무엇이 cover 하는가" 묻고 싶을 때 컨텍스트 전환 비용이 큼. 사용자 quote: *"유저가 페이지를 벗어나지 않고도 전체 연결을 쉽게 이해할 수 있게."*
- N-hop slider 가 selection 후에만 활성화 — 처음 들어왔을 때 무엇을 선택할지 모름.

**Pain mapping:** PAIN-2 (cross-reference traceability), PAIN-4 (visual spec exploration) — 이미 R2 가 solves 하기로 했으나 실제 구현이 부족.

## What Changes

### ADDED

1. **Core: typed-ref extraction from attrs blocks** (F2.5)
   - `@specrail/core` 에 `parseAttrsBlocks` + `extractTypedRefs` 추가.
   - 입력: phase body markdown. 출력: `TypedRef[] = { from, to, kind: EdgeKind, line }[]` (`kind` ∈ 8 closed enum) + `AttrsBlock[]` (id + scalars: status/importance/owner).
   - 기존 `extractRefs` (prose mention) 는 그대로 유지 — fallback. `kind` 가 있으면 typed-ref, 없으면 prose-ref.
   - `Phase.parsedRefs` 는 두 source 의 union 으로 변경 (단, SpecRef 에 optional `kind` field 추가).

2. **F2.4: Connections panel (inline in phase view)**
   - Phase markdown 우측에 항상 보이는 right-rail. 현재 focus 중인 ID 의 typed neighbors 를 edge kind 별로 grouped list 로 표시.
   - Focus 변경: chip hover, chip click, 또는 panel 자체에서 다른 neighbor 클릭.
   - Collapsible (좁은 화면 / 사용자 선호). 기본 default: open (sticky in localStorage).
   - "Open in graph" 버튼 → 같은 focus + n-hop=2 로 graph view deep-link.

3. **F2.5: Typed graph relationships**
   - F2.2 graph view 의 edge stroke / dasharray / color 가 `kind` 별로 다름 (8 가지). Legend overlay 추가.
   - Edge tooltip: `"<from> --tested-by--> <to>"` 형태.

4. **F2.6: Graph focus input + status tint**
   - Graph 상단에 focus 입력 (typeahead, idIndex 재활용) — 입력 즉시 ego 모드 (현재는 노드 클릭이 필요).
   - 노드 color tint by status: Draft = warning, Approved = 기본, Rejected = mute + strikethrough.

5. **NFR-PERF-6:** Connections panel refresh on focus change ≤ 16ms (단일 frame). 측정: client perf API. Violation: warn.

6. **NFR-COMPAT-1:** attrs-ref extraction lossless — 모든 closed-enum yaml key 가 graph edge 로 산출. 측정: vitest fixture (모든 8 kind 가 들어간 sample → 8 typed-ref 출력). Violation: release block.

7. **W-CC-CONNECTIONS** (Phase 7) — 새 wireframe component.

8. **AC-R2-5:** GIVEN graph view, WHEN 노드 / edge 표시, THEN edge stroke 가 `kind` 에 따라 8 가지 visually distinguishable 하고 legend 가 항상 노출.

9. **AC-R2-6:** GIVEN phase view + ID hover/click, WHEN Connections panel 활성, THEN ≤ 16ms 안에 그 ID 의 typed neighbors 가 edge kind 별로 grouped 표시 (in/out 구분 포함).

10. **M9** (Phase 13): Typed graph relationships milestone — T9.1~T9.4.

### MODIFIED

- **F2.2** (Graph view): edge rendering 이 kind-aware. Edge 가 null kind 일 때만 기존 회색 fallback.
- **F2.3** (N-hop slider): focus 입력 또는 노드 클릭 둘 다로 활성화.
- **ARCH-4** (core domain library): attrs-block parsing 책임 추가 (idempotent, 0 I/O 유지).
- **/api/projects/:id/graph** payload (Phase 8):
  - `edges[].kind?: "solves"|"linked-features"|"parent"|"tested-by"|"covers-ac"|"mitigates"|"linked-arch"|"depends-on"` (optional, undefined = prose mention)
  - `nodes[].status?: string` (attrs scalar; optional)
  - 기존 fields (from/to/phase/line/id/kind for nodes) unchanged → backward compatible.
- **P-CC-4** (Phase view IA): 2-pane → optional 3-pane (markdown + Connections panel). Panel toggle 은 P-CC-4 의 chrome.
- **P-CC-5** (Graph view IA): 상단 chrome 에 focus 입력 + legend slot.
- **TC**: 새 cases 추가 (TC-typed-refs-extract, TC-connections-panel-refresh, TC-graph-edge-kind-render).

### REMOVED

없음. 기존 F2.1/F2.2/F2.3 모두 유지.

## Impact

- **영향받는 phase:**
  - Phase 3 (Features): R2 AC 추가 2건, F2.4/F2.5/F2.6 추가, F2.2/F2.3 수정
  - Phase 6 (IA): P-CC-4·P-CC-5 수정
  - Phase 7 (Wireframe): W-CC-PHASE 수정, W-CC-GRAPH 수정, W-CC-CONNECTIONS 추가
  - Phase 8 (Architecture): ARCH-4 책임 확장, /api/graph payload 확장
  - Phase 9 (NFR): NFR-PERF-6 추가, NFR-COMPAT-1 추가
  - Phase 10 (Test): TC 3건 추가, EDGE 1건 추가 (malformed yaml fallback)
  - Phase 13 (Impl plan): M9 milestone + T9.1~T9.4 추가
  - Phase 1·2·4·5·11·12: 변화 없음
- **Persona 변화:** 없음. PERSONA-1 의 핵심 워크플로우 ("phase 읽다 ID 의 relationship 빠르게 확인") 가 더 매끄러워짐.
- **Non-Goal 변화:** 없음. graph editing, hosted multi-user 등은 여전히 non-goal.
- **성공지표 변화:** KPI-5 (phase load) 영향 없음. 새 NFR-PERF-6 추가 (≤16ms panel refresh).
- **Backward compatibility:** /api/graph payload 가 optional fields 만 추가 → 0.1.0-alpha.1 클라이언트 깨지 않음. core 의 `Phase.parsedRefs` schema 는 zod optional field 추가 → 기존 fixture parse 통과.

## Open Questions

| Q ID  | 질문 | 결정자 | Blocking? | 마감 |
|-------|------|--------|-----------|------|
| OQ-DELTA-1 | 8 edge kinds 의 정확한 시각화 (color / dash / weight) 매핑? DESIGN.md "Reading Room" gold-accent 단색 정체성과 충돌 가능 — 4 + 4 weighting 으로 압축? | DESIGN.md owner | Y | 구현 전 |
| OQ-DELTA-2 | Connections panel sticky default: open or closed? 좁은 화면 (≤ 1280px) 자동 close? | PERSONA-1 dogfood | N | M9 dogfood 끝 |
| OQ-DELTA-3 | "Open in graph" deep-link URL 형식: `?focus=<id>&hop=2` 가 best? React Router v6 search params 패턴 확인 | impl | N | T9.3 |
| OQ-DELTA-4 | path query ("from A to B") 가 M9 안에 들어가는지, M10 으로 미루는지? proposal 은 M9 에서 제외, 추후 별도 DELTA | impl | N | M9 종료 |
| OQ-DELTA-5 | extractTypedRefs 가 attrs 블록 yaml 을 손수 parsing — 정식 yaml 라이브러리로 가야하나? 현재 line-based 가 충분한지 fixture 검증 후 결정 | impl | N | T9.1 |

## Verification gates (proposal → approved)

이 proposal 이 머지 되려면:

1. 영향 받는 7 phase 모두 deltas/ 파일 작성 (sketch 수준 OK)
2. 사용자가 OQ-DELTA-1 (시각화 매핑) 에 대해 design direction 승인
3. attrs 가 실제 dashboard spec 에서 어떻게 쓰이는지 sample 1개 grep (`grep -A6 "linked-arch" docs/spec/*.md`) — schema 와 실제 사용이 일치하는지 확인

## Migration strategy (approval 후)

1. M9-T9.1 — core `extractTypedRefs` + zod schema 확장 (test-first, all 8 kinds)
2. M9-T9.2 — server `/api/graph` payload 확장 (backward-compat test 포함)
3. M9-T9.3 — UI-A Connections panel
4. M9-T9.4 — UI-B graph upgrades (edge styling + legend + focus input + status tint)
5. spec phases 3·6·7·8·9·10·13 의 실제 markdown 머지 (deltas/ → docs/spec/ apply)
6. CHANGELOG + README "Known gaps" 업데이트 (graph view 효용 항목 close)
