---
phase: 3
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["01-prd.md §3/§5/§6", "02-personas-journey.md §6/§7"]
---

# Functional Specification

**Mode:** HOLD SCOPE (inherited)
**Inputs:** PRD §3 Role/§5/§6, Phase 2 §6 Pain Priority/§7 차단
**Date:** 2026-05-17

## 0. Roles

**단일 사용자, role 구분 없음.** OSS local self-host (PRD §3.3). Permission Matrix 섹션 생략.

---

## R1: Spec view & navigation

<!-- specrail:attrs id=R1 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-2, PAIN-CONTEXT-1]
```
<!-- /specrail:attrs -->

**Description:** 사용자가 13 phase markdown 을 브라우저에서 자연스럽게 읽고 이동.
**해결하는 PAIN:** PAIN-2 (ctrl-F 반복), PAIN-CONTEXT-1 (context 재구성)
**해결하는 시나리오:** SCEN-1 (전 단계)
**Importance:** P0
**Status:** Approved


### Acceptance Criteria

- **AC-R1-1:** GIVEN dashboard 실행 + project 등록됨, WHEN 사용자가 phase N 클릭, THEN phase view 가 ≤ 2초(p95) 내 렌더되고 frontmatter·body·toolbar 표시.
- **AC-R1-2:** GIVEN phase view open, WHEN 본문의 ID(예: `R3`) hover, THEN 정의 미리보기 popover 표시; 클릭 시 정의처 phase 로 점프.
- **AC-R1-3:** GIVEN 다중 project 등록, WHEN top bar project switcher 사용, THEN 200ms 이내 phase list·view 가 해당 project 로 전환.
- **AC-R1-4:** GIVEN cmd+k 누름, WHEN ID·phase 이름 검색, THEN fuzzy match 결과 ≤ 50ms 내 표시.

### F1.1: Phase view (read mode)

<!-- specrail:attrs id=F1.1 -->
```yaml
status: Approved
parent-r: R1
linked-features: []
```
<!-- /specrail:attrs -->

**Description:** Markdown 본문 + frontmatter 를 렌더링.
**Importance:** P0
**Status:** Approved


#### S1.1.1: Markdown render (remark/rehype)

<!-- specrail:attrs id=S1.1.1 -->
```yaml
status: Approved
parent-f: F1.1
```
<!-- /specrail:attrs -->

**Description:** GFM + frontmatter + mermaid + 코드 syntax highlight.
**Importance:** P0  **Status:** Approved

#### S1.1.2: Frontmatter collapsible block

<!-- specrail:attrs id=S1.1.2 -->
```yaml
status: Approved
parent-f: F1.1
```
<!-- /specrail:attrs -->

**Description:** Toolbar 아래 collapsible YAML block.
**Importance:** P1  **Status:** Approved

### F1.2: ID auto-linkify + hover preview

<!-- specrail:attrs id=F1.2 -->
```yaml
status: Approved
parent-r: R1
solves-pains: [PAIN-2]
```
<!-- /specrail:attrs -->

**Description:** 본문의 R/F/S/NFR/… ID 를 자동 link, hover popover, click jump.
**Importance:** P0
**Status:** Approved (해결: PAIN-2)


#### S1.2.1: ID 정규식 detect + index 구축
<!-- specrail:attrs id=S1.2.1 -->
```yaml
status: Approved
parent-f: F1.2
```
<!-- /specrail:attrs -->

#### S1.2.2: Hover popover (정의의 첫 200자)
<!-- specrail:attrs id=S1.2.2 -->
```yaml
status: Approved
parent-f: F1.2
```
<!-- /specrail:attrs -->

#### S1.2.3: Click 시 정의처 phase 로 navigate
<!-- specrail:attrs id=S1.2.3 -->
```yaml
status: Approved
parent-f: F1.2
```
<!-- /specrail:attrs -->

### F1.3: Quick switcher (cmd+k)

<!-- specrail:attrs id=F1.3 -->
```yaml
status: Approved
parent-r: R1
solves-pains: [PAIN-CONTEXT-1]
```
<!-- /specrail:attrs -->

**Description:** Phase·ID 검색 modal.
**Importance:** P1
**Status:** Approved (해결: PAIN-CONTEXT-1)


#### S1.3.1: Fuzzy match (phase 이름 + ID)
<!-- specrail:attrs id=S1.3.1 -->
```yaml
status: Approved
parent-f: F1.3
```
<!-- /specrail:attrs -->

### F1.4: Multi-project registry & switcher

<!-- specrail:attrs id=F1.4 -->
```yaml
status: Approved
parent-r: R1
```
<!-- /specrail:attrs -->

**Description:** 여러 repo path 등록·전환.
**Importance:** P1
**Status:** Approved


#### S1.4.1: Registry CRUD (~/.specrail-dashboard/registry.json)
<!-- specrail:attrs id=S1.4.1 -->
```yaml
status: Approved
parent-f: F1.4
```
<!-- /specrail:attrs -->

#### S1.4.2: Project 등록 시 docs/spec/01-prd.md 존재 검증
<!-- specrail:attrs id=S1.4.2 -->
```yaml
status: Approved
parent-f: F1.4
```
<!-- /specrail:attrs -->

---

## R2: Cross-reference exploration

<!-- specrail:attrs id=R2 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-2, PAIN-4]
```
<!-- /specrail:attrs -->

**Description:** Phase 간 ID dependency 를 시각·텍스트로 탐색.
**해결하는 PAIN:** PAIN-2, PAIN-4
**해결하는 시나리오:** SCEN-1, SCEN-3
**Importance:** P0
**Status:** Approved


### Acceptance Criteria

- **AC-R2-1:** GIVEN phase view + ID 선택, WHEN 우측 Refs tab open, THEN in/out refs 가 list 로 표시; 각 ref click 시 해당 phase 정의처로 점프.
- **AC-R2-2:** GIVEN graph view + 500 노드 이하, WHEN N-hop filter 적용, THEN ≤ 200ms 내 reflow.
- **AC-R2-3:** GIVEN graph 노드 클릭, WHEN 우측 Refs tab, THEN in/out refs + "Open in phase view" 버튼 표시.
- **AC-R2-4:** GIVEN graph 200 노드 초과, WHEN graph view open, THEN phase-level collapsed view 로 자동 fallback (phase 노드 click 시 expand).
- **AC-R2-5:** GIVEN graph view, WHEN 노드 / edge 표시, THEN edge 가 `kind` 별로 visually distinguishable (stroke weight / dasharray / opacity — DESIGN.md gold-accent 유지) 하고 legend overlay 가 항상 노출.
- **AC-R2-6:** GIVEN phase view + ID hover/click, WHEN Connections panel 활성, THEN ≤ 16ms 안에 그 ID 의 typed neighbors 가 edge kind 별 그룹으로 표시 (in/out 구분 + status pill 포함).
- **AC-R2-7:** GIVEN phase view, WHEN Connections panel 또는 ChatDrawer 가 open, THEN markdown 본문의 가운데 정렬과 reading column 너비 (≤ 760px) 가 변하지 않는다 (floating right side panel pattern).
- **AC-R2-8:** GIVEN Connections panel open + neighbor row mouse hover, WHEN 200ms 정지, THEN tooltip (`IdPopover`) 표시 — id / kind / preview (200자 이내).
- **AC-R2-9:** GIVEN graph page open, WHEN user clicks one of 4 mode tabs (Overview / Phase Focus / ID Focus / Quality), THEN view re-renders within ≤ 200ms with mode-specific layout + filter state.
- **AC-R2-10:** GIVEN Overview mode + 400+ node spec, WHEN initial render, THEN 13 large phase nodes (≥ 60% canvas coverage) with aggregate inter-phase edges (stroke weight = log₂(ref count)).
- **AC-R2-11:** GIVEN Quality mode + clean spec, WHEN no orphans/dangling, THEN "All clean — no orphans or dangling refs." friendly empty state.

### F2.1: Refs tab (in/out)
<!-- specrail:attrs id=F2.1 -->
```yaml
status: Approved
parent-r: R2
solves-pains: [PAIN-2]
```
<!-- /specrail:attrs -->

#### S2.1.1: In/out ref index 구축 (core.graph)
<!-- specrail:attrs id=S2.1.1 -->
```yaml
status: Approved
parent-f: F2.1
```
<!-- /specrail:attrs -->

#### S2.1.2: Refs 결과 list UI (sort by phase)
<!-- specrail:attrs id=S2.1.2 -->
```yaml
status: Approved
parent-f: F2.1
```
<!-- /specrail:attrs -->

### F2.2: Graph view (React Flow + elkjs)
<!-- specrail:attrs id=F2.2 -->
```yaml
status: Approved
parent-r: R2
solves-pains: [PAIN-4]
```
<!-- /specrail:attrs -->

#### S2.2.1: ELK layered layout
<!-- specrail:attrs id=S2.2.1 -->
```yaml
status: Approved
parent-f: F2.2
```
<!-- /specrail:attrs -->

#### S2.2.2: Filter panel (phase, ID prefix, orphan/dangling toggle)
<!-- specrail:attrs id=S2.2.2 -->
```yaml
status: Approved
parent-f: F2.2
```
<!-- /specrail:attrs -->

#### S2.2.3: 200+ 노드 → phase-level collapsed fallback
<!-- specrail:attrs id=S2.2.3 -->
```yaml
status: Approved
parent-f: F2.2
```
<!-- /specrail:attrs -->

### F2.3: N-hop slider
<!-- specrail:attrs id=F2.3 -->
```yaml
status: Approved
parent-r: R2
```
<!-- /specrail:attrs -->

#### S2.3.1: Slider (0~N) + 선택 노드 기준 subgraph 계산
<!-- specrail:attrs id=S2.3.1 -->
```yaml
status: Approved
parent-f: F2.3
```
<!-- /specrail:attrs -->

### F2.4: Connections panel (floating right side panel)
<!-- specrail:attrs id=F2.4 -->
```yaml
status: Approved
parent-r: R2
solves-pains: [PAIN-2]
linked-ac: [AC-R2-6, AC-R2-7]
```
<!-- /specrail:attrs -->

**Description:** Phase markdown 우측에 floating right side panel (`position: fixed; right: 0`). Markdown 본문에 영향 없이 떠 있음 — reading column 은 max-width 760px 가운데 정렬 유지 (AC-R2-7). 현재 focus 중인 ID 의 typed neighbors 를 edge kind 별 grouped list 로 표시. Focus 변경 trigger: chip click / panel 내 neighbor click. Toggle 가능 (sticky in localStorage). ChatDrawer 와 동시 open 시 vertically stacked (Connections 상반·Chat 하반).
**Out:** "Open in graph ↗" deep-link `?focus=<id>&hop=2`.

#### S2.4.1: ConnectionsPanel UI + useGraphConnections 훅 (cached graph query 재활용 — no new API)
<!-- specrail:attrs id=S2.4.1 -->
```yaml
status: Approved
parent-f: F2.4
```
<!-- /specrail:attrs -->

#### S2.4.2: Focus state sync (chip click → panel) + localStorage sticky collapse
<!-- specrail:attrs id=S2.4.2 -->
```yaml
status: Approved
parent-f: F2.4
```
<!-- /specrail:attrs -->

### F2.5: Typed graph relationships (core)
<!-- specrail:attrs id=F2.5 -->
```yaml
status: Approved
parent-r: R2
linked-ac: [AC-R2-5]
linked-arch: [ARCH-4]
```
<!-- /specrail:attrs -->

**Description:** core 가 `<!-- specrail:attrs -->` 블록의 closed-enum edge keys (`solves`, `linked-features`, `parent`, `tested-by`, `covers-ac`, `mitigates`, `linked-arch`, `depends-on`) 와 dashboard spec 에서 실제 사용되는 qualified 변형 (`parent-f`, `parent-r`, `parent-zone`, `linked-ac`, `linked-r`, `solves-pains`) 를 typed-ref 로 추출. 기존 prose-mention ref 와 union (typed-ref 가 같은 (from,to) 의 prose-ref 를 suppress).

#### S2.5.1: `extractTypedRefs(body)` + `parseAttrsBlocks(body)` in @specrail/core
<!-- specrail:attrs id=S2.5.1 -->
```yaml
status: Approved
parent-f: F2.5
```
<!-- /specrail:attrs -->

#### S2.5.2: SpecRef zod schema `kind?` field + GraphEdge.kind + GraphNode.status
<!-- specrail:attrs id=S2.5.2 -->
```yaml
status: Approved
parent-f: F2.5
```
<!-- /specrail:attrs -->

### F2.6: Graph focus input + status tint
<!-- specrail:attrs id=F2.6 -->
```yaml
status: Approved
parent-r: R2
linked-ac: [AC-R2-5]
```
<!-- /specrail:attrs -->

**Description:** Graph 상단 chrome 에 focus 입력 (typeahead, idIndex 재활용). 입력 즉시 ego mode 활성 (노드 click 도 동일). 노드 색이 attrs.status 에 따라 tint (Approved = 기본, Draft/Proposed = dashed border, Rejected = muted + strikethrough). Edge styling: gold-accent 단색 + stroke weight/dasharray/opacity 4-family grouping (OQ-DELTA-1 합의).

#### S2.6.1: FocusInput 컴포넌트 + URL search params (`?focus=<id>&hop=N`) 양방향 sync
<!-- specrail:attrs id=S2.6.1 -->
```yaml
status: Approved
parent-f: F2.6
```
<!-- /specrail:attrs -->

#### S2.6.2: nodeStyleForKind 확장 (status tint) + EdgeLegend overlay
<!-- specrail:attrs id=S2.6.2 -->
```yaml
status: Approved
parent-f: F2.6
```
<!-- /specrail:attrs -->

### F2.7: Connections neighbor hover tooltip
<!-- specrail:attrs id=F2.7 -->
```yaml
status: Approved
parent-r: R2
linked-features: [F1.2, F2.4]
linked-ac: [AC-R2-8]
```
<!-- /specrail:attrs -->

**Description:** Connections panel 의 neighbor row 위 mouse hover → 200ms 후 IdPopover 와 동일한 tooltip 표시 (id / kind / phase·line / preview). 구현: 기존 `IdPopover` 의 selector 를 `.id-chip, .conn-neighbor-id` 로 확장 + `buildIdIndex` Pass-3 가 `- **AC-R*-*:**` bullet definition 도 index 에 포함. Latency: ≤ 16ms (hover) — idIndex cached.

#### S2.7.1: IdPopover selector 확장 (`.id-chip, .conn-neighbor-id`)
<!-- specrail:attrs id=S2.7.1 -->
```yaml
status: Approved
parent-f: F2.7
```
<!-- /specrail:attrs -->

#### S2.7.2: buildIdIndex Pass-3 — bullet definition recognition
<!-- specrail:attrs id=S2.7.2 -->
```yaml
status: Approved
parent-f: F2.7
```
<!-- /specrail:attrs -->

### F2.8: Graph view modes (4 명시적 modes)
<!-- specrail:attrs id=F2.8 -->
```yaml
status: Approved
parent-r: R2
solves-pains: [PAIN-4]
linked-ac: [AC-R2-9, AC-R2-10, AC-R2-11]
```
<!-- /specrail:attrs -->

**Description:** Graph page 가 4개 모드 중 하나만 렌더 — 사용자가 명시적 tab 으로 전환:
- **Overview** (default): 13개 phase 노드만 크게, inter-phase aggregate weighted edges (stroke = log₂(count)). 클릭 → Phase Focus.
- **Phase Focus**: 선택 phase 의 IDs + 1-hop boundary (dimmed opacity 0.45). 노드 클릭 → ID Focus.
- **ID Focus**: focus input + n-hop slider + ego graph (기존 F2.2/F2.3/F2.6 동작 흡수).
- **Quality**: orphans (in=0, out=0) + dangling refs (target 미정의) 만. 깨끗한 spec 에선 "All clean." friendly state.

Mode 는 URL `?mode=overview|phase|id|quality` 와 양방향 sync. ?focus=<id> 가 있으면 자동 ID Focus 진입 (backward-compat). Sidebar / focus input / n-hop slider / legend 모두 mode-aware (필요할 때만 노출, legend default 닫힘).

#### S2.8.1: Mode state + URL search param sync
<!-- specrail:attrs id=S2.8.1 -->
```yaml
status: Approved
parent-f: F2.8
```
<!-- /specrail:attrs -->

#### S2.8.2: Overview mode — 13 large phase nodes, aggregate weighted edges
<!-- specrail:attrs id=S2.8.2 -->
```yaml
status: Approved
parent-f: F2.8
```
<!-- /specrail:attrs -->

#### S2.8.3: Phase Focus — single phase + 1-hop boundary (dimmed)
<!-- specrail:attrs id=S2.8.3 -->
```yaml
status: Approved
parent-f: F2.8
```
<!-- /specrail:attrs -->

#### S2.8.4: Quality mode — orphans + dangling refs only + clean empty state
<!-- specrail:attrs id=S2.8.4 -->
```yaml
status: Approved
parent-f: F2.8
```
<!-- /specrail:attrs -->

#### S2.8.5: Mode-aware toolbar/sidebar/legend visibility
<!-- specrail:attrs id=S2.8.5 -->
```yaml
status: Approved
parent-f: F2.8
```
<!-- /specrail:attrs -->

---

## R3: Deterministic quality checks

<!-- specrail:attrs id=R3 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-4, PAIN-DRIFT-1]
```
<!-- /specrail:attrs -->

**Description:** plugin self-check + cross-phase 결정적 검사 통합.
**해결하는 PAIN:** PAIN-4, PAIN-DRIFT-1
**해결하는 시나리오:** SCEN-3
**Importance:** P0
**Status:** Approved


### Acceptance Criteria

- **AC-R3-1:** GIVEN project open, WHEN cross-phase check 실행, THEN orphan ID, dangling ref, status 불일치, traceability 누락 4종 검출.
- **AC-R3-2:** GIVEN issue 발견, WHEN issue inbox row 펼침, THEN source label (`plugin-self-check`/`cross-phase`/`ai-quality`) + 정확한 line + suggested patch (있으면) 표시.
- **AC-R3-3:** GIVEN issue refresh request, WHEN async check 실행, THEN SSE 로 진행률 표시 후 issues.updated event.

### F3.1: Plugin self-check 통합
<!-- specrail:attrs id=F3.1 -->
```yaml
status: Approved
parent-r: R3
```
<!-- /specrail:attrs -->

#### S3.1.1: `specrail check` 결과 파싱 + issue 형식 변환
<!-- specrail:attrs id=S3.1.1 -->
```yaml
status: Approved
parent-f: F3.1
```
<!-- /specrail:attrs -->

### F3.2: Cross-phase deterministic checks
<!-- specrail:attrs id=F3.2 -->
```yaml
status: Approved
parent-r: R3
solves-pains: [PAIN-DRIFT-1]
```
<!-- /specrail:attrs -->

#### S3.2.1: Orphan ID 검출
<!-- specrail:attrs id=S3.2.1 -->
```yaml
status: Approved
parent-f: F3.2
```
<!-- /specrail:attrs -->

#### S3.2.2: Dangling ref 검출
<!-- specrail:attrs id=S3.2.2 -->
```yaml
status: Approved
parent-f: F3.2
```
<!-- /specrail:attrs -->

#### S3.2.3: 상태 불일치 (예: Draft phase 에 Approved 인용)
<!-- specrail:attrs id=S3.2.3 -->
```yaml
status: Approved
parent-f: F3.2
```
<!-- /specrail:attrs -->

#### S3.2.4: Traceability 누락 (R→F→S→T 사슬 끊김)
<!-- specrail:attrs id=S3.2.4 -->
```yaml
status: Approved
parent-f: F3.2
```
<!-- /specrail:attrs -->

### F3.3: Unified issue inbox
<!-- specrail:attrs id=F3.3 -->
```yaml
status: Approved
parent-r: R3
```
<!-- /specrail:attrs -->

#### S3.3.1: Issue list + source/severity/phase filter
<!-- specrail:attrs id=S3.3.1 -->
```yaml
status: Approved
parent-f: F3.3
```
<!-- /specrail:attrs -->

#### S3.3.2: Accept/Reject patch (이슈에 patch 연결된 경우)
<!-- specrail:attrs id=S3.3.2 -->
```yaml
status: Approved
parent-f: F3.3
```
<!-- /specrail:attrs -->

---

## R4: AI quality review

<!-- specrail:attrs id=R4 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: [PAIN-AI-1]
```
<!-- /specrail:attrs -->

**Description:** AI 가 의미적 결함을 발견·patch 제안.
**해결하는 PAIN:** PAIN-AI-1
**해결하는 시나리오:** SCEN-2, SCEN-3
**Importance:** P0
**Status:** Approved


### Acceptance Criteria

- **AC-R4-1:** GIVEN issue inbox + "Run AI review" 클릭, WHEN AI session 시작, THEN claude CLI subprocess spawn (cwd = projectRoot) + SSE 로 토큰 stream.
- **AC-R4-2:** GIVEN AI 응답에 patch JSON 포함, WHEN parse 성공, THEN issue inbox 에 `ai-quality` source 카드 자동 추가.
- **AC-R4-3:** GIVEN inline rewrite, WHEN 선택 텍스트 + "AI: rewrite" click, THEN selection 범위 patch preview 표시.
- **AC-R4-4:** GIVEN claude CLI 미설치 또는 exit !=0, WHEN AI 호출 실패, THEN UI 에 분류된 에러 메시지 (설치 가이드 / stderr 마지막 80줄).
- **AC-R4-5:** GIVEN AI streaming 중 사용자 Stop, WHEN abort, THEN SIGTERM → 5s 후 SIGKILL.

### F4.1: AI review-scan (issue 주도)
<!-- specrail:attrs id=F4.1 -->
```yaml
status: Approved
parent-r: R4
solves-pains: [PAIN-AI-1]
```
<!-- /specrail:attrs -->

#### S4.1.1: Prompt template (review-scan: 13 phase 요약 + 결정적 issue inject)
<!-- specrail:attrs id=S4.1.1 -->
```yaml
status: Approved
parent-f: F4.1
```
<!-- /specrail:attrs -->

#### S4.1.2: claude CLI subprocess 어댑터 (execa, stream-json)
<!-- specrail:attrs id=S4.1.2 -->
```yaml
status: Approved
parent-f: F4.1
```
<!-- /specrail:attrs -->

### F4.2: Chat drawer
<!-- specrail:attrs id=F4.2 -->
```yaml
status: Approved
parent-r: R4
```
<!-- /specrail:attrs -->

#### S4.2.1: 우측 drawer UI, session persistent
<!-- specrail:attrs id=S4.2.1 -->
```yaml
status: Approved
parent-f: F4.2
```
<!-- /specrail:attrs -->

#### S4.2.2: 컨텍스트 자동 첨부 (현재 phase 또는 선택 ID)
<!-- specrail:attrs id=S4.2.2 -->
```yaml
status: Approved
parent-f: F4.2
```
<!-- /specrail:attrs -->

### F4.3: Inline rewrite (floating menu)
<!-- specrail:attrs id=F4.3 -->
```yaml
status: Approved
parent-r: R4
```
<!-- /specrail:attrs -->

#### S4.3.1: Selection 감지 + floating menu (rewrite/verify/ask)
<!-- specrail:attrs id=S4.3.1 -->
```yaml
status: Approved
parent-f: F4.3
```
<!-- /specrail:attrs -->

#### S4.3.2: Patch preview overlay
<!-- specrail:attrs id=S4.3.2 -->
```yaml
status: Approved
parent-f: F4.3
```
<!-- /specrail:attrs -->

### F4.4: PatchProposal lifecycle (3 origin → 단일 깔때기)
<!-- specrail:attrs id=F4.4 -->
```yaml
status: Approved
parent-r: R4
```
<!-- /specrail:attrs -->

#### S4.4.1: Patch propose (origin: issue-fix/chat/inline)
<!-- specrail:attrs id=S4.4.1 -->
```yaml
status: Approved
parent-f: F4.4
```
<!-- /specrail:attrs -->

#### S4.4.2: Patch JSON 파싱 (응답에서 patch 추출, zod validate)
<!-- specrail:attrs id=S4.4.2 -->
```yaml
status: Approved
parent-f: F4.4
```
<!-- /specrail:attrs -->

#### S4.4.3: Accept → atomic write; Reject → status only
<!-- specrail:attrs id=S4.4.3 -->
```yaml
status: Approved
parent-f: F4.4
```
<!-- /specrail:attrs -->

---

## R5: Direct edit (수동 모드)

<!-- specrail:attrs id=R5 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: []
```
<!-- /specrail:attrs -->

**Description:** 사용자가 markdown 본문·frontmatter 를 직접 수정.
**해결하는 PAIN:** PAIN-AI-1 (보조), 일반 작업 효율
**해결하는 시나리오:** SCEN-2 보조
**Importance:** P0
**Status:** Approved


### Acceptance Criteria

- **AC-R5-1:** GIVEN Edit 모드 toggle, WHEN 사용자가 본문 변경 후 cmd+s, THEN atomic write 시도; mtime mismatch 시 409 + conflict dialog.
- **AC-R5-2:** GIVEN frontmatter form, WHEN field 값 변경, THEN zod schema validate; 실패 시 inline error.
- **AC-R5-3:** GIVEN Edit 모드 + 미저장 변경, WHEN 사용자 navigate away 시도, THEN 확인 dialog.

### F5.1: CodeMirror 6 markdown editor
<!-- specrail:attrs id=F5.1 -->
```yaml
status: Approved
parent-r: R5
```
<!-- /specrail:attrs -->

#### S5.1.1: Read/Edit toggle + 키바인딩
<!-- specrail:attrs id=S5.1.1 -->
```yaml
status: Approved
parent-f: F5.1
```
<!-- /specrail:attrs -->

### F5.2: Frontmatter form (zod-driven)
<!-- specrail:attrs id=F5.2 -->
```yaml
status: Approved
parent-r: R5
```
<!-- /specrail:attrs -->

#### S5.2.1: Schema → form 자동 생성
<!-- specrail:attrs id=S5.2.1 -->
```yaml
status: Approved
parent-f: F5.2
```
<!-- /specrail:attrs -->

#### S5.2.2: 본문 YAML 블록과 양방향 sync
<!-- specrail:attrs id=S5.2.2 -->
```yaml
status: Approved
parent-f: F5.2
```
<!-- /specrail:attrs -->

### F5.3: Atomic write + conflict detection
<!-- specrail:attrs id=F5.3 -->
```yaml
status: Approved
parent-r: R5
```
<!-- /specrail:attrs -->

#### S5.3.1: write-file-atomic (tmp → fsync → rename)
<!-- specrail:attrs id=S5.3.1 -->
```yaml
status: Approved
parent-f: F5.3
```
<!-- /specrail:attrs -->

#### S5.3.2: mtime ETag 검증 (mismatch → 409)
<!-- specrail:attrs id=S5.3.2 -->
```yaml
status: Approved
parent-f: F5.3
```
<!-- /specrail:attrs -->

---

## R6: Live sync with filesystem

<!-- specrail:attrs id=R6 -->
```yaml
status: Approved
importance: P0
owner: PERSONA-1
solves-pains: []
```
<!-- /specrail:attrs -->

**Description:** 외부 편집을 dashboard 가 즉시 반영.
**해결하는 PAIN:** PAIN-CONTEXT-1 (간접), PAIN-DRIFT-1 (간접)
**해결하는 시나리오:** SCEN-1 (보조)
**Importance:** P0
**Status:** Approved


### Acceptance Criteria

- **AC-R6-1:** GIVEN dashboard open + 외부 vim 으로 phase 파일 저장, WHEN chokidar fire, THEN ≤ 500ms 내 UI 갱신.
- **AC-R6-2:** GIVEN dashboard self-write, WHEN watcher fire, THEN duplicate fetch skip (self-write flag).
- **AC-R6-3:** GIVEN SSE 연결 끊김, WHEN 재연결, THEN 마지막 event-id 부터 catch-up.

### F6.1: File watcher (chokidar)
<!-- specrail:attrs id=F6.1 -->
```yaml
status: Approved
parent-r: R6
```
<!-- /specrail:attrs -->

#### S6.1.1: docs/spec/ + changes/ 만 watch
<!-- specrail:attrs id=S6.1.1 -->
```yaml
status: Approved
parent-f: F6.1
```
<!-- /specrail:attrs -->

### F6.2: SSE push (project 당 단일 채널)
<!-- specrail:attrs id=F6.2 -->
```yaml
status: Approved
parent-r: R6
```
<!-- /specrail:attrs -->

#### S6.2.1: ServerEvent union (file.*, issues.*, patch.*, ai.*)
<!-- specrail:attrs id=S6.2.1 -->
```yaml
status: Approved
parent-f: F6.2
```
<!-- /specrail:attrs -->

#### S6.2.2: 클라이언트 React Query cache invalidation 매핑
<!-- specrail:attrs id=S6.2.2 -->
```yaml
status: Approved
parent-f: F6.2
```
<!-- /specrail:attrs -->

### F6.3: Conflict warning UI
<!-- specrail:attrs id=F6.3 -->
```yaml
status: Approved
parent-r: R6
```
<!-- /specrail:attrs -->

#### S6.3.1: 409 응답 → conflict dialog (외부 변경 보기 / 강제 적용 / 취소)
<!-- specrail:attrs id=S6.3.1 -->
```yaml
status: Approved
parent-f: F6.3
```
<!-- /specrail:attrs -->

---

## Importance × Status 분포

| | Draft | Approved | Implementing | Done |
|---|---|---|---|---|
| P0 | 0 | 43 | 0 | 0 |
| P1 | 0 | 9 | 0 | 0 |
| P2 | 0 | 0 | 0 | 0 |
| P3 | 0 | 0 | 0 | 0 |

(R/F/S 총 52개 모두 Approved. P0 가 MVP = SCEN-1/2/3 모두 cover.)

## Pain → Spec 매핑 (역추적)

| Pain ID | 해결 Spec | 차단 시나리오 |
|---|---|---|
| PAIN-2 | S1.2.1-3, S2.1.1-2 | S1 |
| PAIN-4 | S2.2.1-3, S3.2.1-4 | S1, S3 |
| PAIN-AI-1 | S4.1.1-2, S4.2.1-2, S4.3.1-2, S4.4.1-3 | S2, S3 |
| PAIN-DRIFT-1 | S3.2.1-4, S6.1.1, S6.2.1 | S3 |
| PAIN-CONTEXT-1 | S1.3.1, S6.2.2 | S1 |

## Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-3-1 | OQ-2-3 결의 — "5분 끊기면 graph 재구성" 별 feature (마지막 위치 session 복원) 필요? | maintainer | Y |
| OQ-3-2 | F4.3 inline rewrite 의 floating menu UX 가 conflict 일으킬 selection 패턴 (cmd+a 같은 것)? | maintainer | N |
| OQ-3-3 | F1.4 multi-project 등록 시 git submodule 또는 worktree 도 같은 project 로 인식? | maintainer | N |

<!-- specrail:attrs id=OQ-3-1 -->
```yaml
blocking: true
decider: maintainer
due: "Phase 6"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-3-2 -->
```yaml
blocking: false
decider: maintainer
due: "Phase 7"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-3-3 -->
```yaml
blocking: false
decider: maintainer
due: "Phase 11"
```
<!-- /specrail:attrs -->

## 다음 phase 인풋

- **Phase 4 (Domain)**: 모든 R/F/S + 명사 (Project, Phase, Issue, PatchProposal, AiSession, FileWatcher)
- **Phase 5 (User Flow)**: S* ID + 이름 (node 매핑)
- **Phase 8 (Architecture)**: R/F → container 매핑
- **Phase 10 (Test)**: 모든 AC (TC 매핑)
- **Phase 13 (Impl plan)**: P0 spec 43개 = MVP
