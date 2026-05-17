---
phase: 7
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["06-information-architecture.md", "05-user-flow.md", "04-domain-model.md"]
note: "Information layout only — visual design (color/typography/icon/spacing token) 은 /design-consultation 별 cycle 산출물(DESIGN.md) 에 위임."
---

# Wireframe

**Mode:** HOLD SCOPE (inherited)
**Inputs:** Phase 6 P-CC-1..P-CC-11 + P-CC-404/500, Phase 5 Edges, Phase 4 Entity attributes
**Primary device:** desktop 1280+ (PRD §5 — mobile out of scope)
**Date:** 2026-05-17

## 0. Pattern — 3-pane shell (W-CC-SHELL, inherited)

<!-- specrail:attrs id=W-CC-SHELL -->
```yaml
status: Approved
surface: dashboard
zone-count: 5
element-count: 7
inherited-by: [W-CC-PHASE, W-CC-GRAPH, W-CC-ISSUES, W-CC-EDIT, W-CC-CHANGES]
```
<!-- /specrail:attrs -->

```
┌──────────────────────────────────────────────────────────────────────┐
│ ZN-SHELL-TOP-1 — project switcher · refresh · AI status                │ <- top bar
├────────────┬─────────────────────────────────────┬───────────────────┤
│ ZN-SHELL-1-  │ ZN-SHELL-MAIN-1                       │ ZN-SHELL-DRAWER-1   │
│ SIDEBAR    │                                     │ (collapsible)     │
│            │  (route-driven content from         │                   │
│ Phase list │   P-CC-4 / 5 / 6 / 7 / 8 / 9)       │ tabs: Issues /    │
│  01 PRD ●  │                                     │ Chat / Refs       │
│  02 …  ●   │                                     │                   │
│  ⋮         │                                     │                   │
│ Sources    │                                     │                   │
│  Changes   │                                     │                   │
└────────────┴─────────────────────────────────────┴───────────────────┘
              ZN-SHELL-STATUS-1 (bottom, optional — connection·SSE state)
```

### Zones

<!-- specrail:attrs id=ZN-SHELL-TOP-1 -->
```yaml
page: P-CC-3
purpose: "프로젝트 컨텍스트·실행 중 AI 상태·새로고침 한 자리"
visible-to-state: ["loaded"]
linked-feature: F1.4
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-SHELL-SIDEBAR-1 -->
```yaml
page: P-CC-3
purpose: "13 phase + Changes + Issues entrypoint, status 아이콘 (clean/issue/checking/patch-pending)"
visible-to-state: ["loaded"]
linked-feature: F1.1
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-SHELL-MAIN-1 -->
```yaml
page: P-CC-3
purpose: "route-driven content area"
visible-to-state: ["loaded", "loading", "error"]
zone-order: 3
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-SHELL-DRAWER-1 -->
```yaml
page: P-CC-3
purpose: "Issues/Chat/Refs 3 tab, 사용자 collapsible"
visible-to-state: ["loaded"]
zone-order: 4
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-SHELL-STATUS-1 -->
```yaml
page: P-CC-3
purpose: "SSE 연결 상태, 마지막 file change 시간, version"
visible-to-state: ["loaded"]
zone-order: 5
status: Approved
```
<!-- /specrail:attrs -->

### Elements (shell-wide)

<!-- specrail:attrs id=E-CC-1 -->
```yaml
status: Approved
kind: dropdown
parent-zone: ZN-SHELL-TOP-1
source-data: "ENT-Project (정렬: lastOpenedAt desc)"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-2 -->
```yaml
status: Approved
kind: icon-button
parent-zone: ZN-SHELL-TOP-1
source-data: "수동 invalidate"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-3 -->
```yaml
status: Approved
kind: badge
parent-zone: ZN-SHELL-TOP-1
source-data: "ENT-AiSession.status (idle/streaming/error)"
```
<!-- /specrail:attrs -->

### Component States

| State | 표시 |
|---|---|
| Loading (project switch) | sidebar skeleton 13 줄, main spinner |
| Empty (registry projects = 0) | redirect to P-CC-2 (handled by router) |
| Error (project 404) | redirect to P-CC-1 + toast |
| Success | 위 layout |

---

## 1. W-CC-PLIST — Project list (P-CC-1)

<!-- specrail:attrs id=W-CC-PLIST -->
```yaml
status: Approved
surface: dashboard
zone-count: 2
element-count: 3
```
<!-- /specrail:attrs -->

**들어오는:** FLE-3 (브라우저 open, projects ≥ 1). **나가는:** FLE-6 (project select → app shell)

```
┌──────────────────────────────────────────────────────────┐
│ ZN-PLIST-HEADER-1  Title "Your projects"  [+ Add project]  │
├──────────────────────────────────────────────────────────┤
│ ZN-PLIST-CARDS-1                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ specrail (~/Dev/specrail)                           │  │
│  │ last opened 2 min ago · 5 issues                    │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ my-product (~/Dev/myproduct)                        │  │
│  │ last opened 3 days ago · clean                      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-PLIST-HEADER-1 -->
```yaml
page: P-CC-1
purpose: "title + add CTA"
visible-to-state: ["loaded", "empty"]
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-PLIST-CARDS-1 -->
```yaml
page: P-CC-1
purpose: "registered projects card list"
visible-to-state: ["loaded"]
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading | 3 skeleton cards |
| Empty | redirect P-CC-2 (router) |
| Error | toast "registry read failed" + retry |
| Success | card list, click → FLE-6 |

---

## 2. W-CC-ADD — Add project picker (P-CC-2)

<!-- specrail:attrs id=W-CC-ADD -->
```yaml
status: Approved
surface: dashboard
zone-count: 2
element-count: 4
```
<!-- /specrail:attrs -->

```
┌──────────────────────────────────────────────────────────┐
│ ZN-ADD-HEADER-1  "Add a specrail project"                  │
├──────────────────────────────────────────────────────────┤
│ ZN-ADD-FORM-1                                               │
│  [Path: ____________________________________] [Browse…]  │
│  ⓘ docs/spec/01-prd.md 존재 검증 후 등록                  │
│  [Cancel]                              [Add project]     │
└──────────────────────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-ADD-HEADER-1 -->
```yaml
page: P-CC-2
purpose: "title + helper text"
visible-to-state: ["loaded"]
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-ADD-FORM-1 -->
```yaml
page: P-CC-2
purpose: "path 입력 + validation + actions"
visible-to-state: ["loaded", "validating", "error"]
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading (validating) | spinner inside [Add project] |
| Empty | input pristine |
| Error (INV-PROJECT-1 fail) | inline "Not a specrail project — docs/spec/01-prd.md missing" |
| Success | navigate to P-CC-3 |

---

## 3. W-CC-PHASE — Phase view (P-CC-4)

<!-- specrail:attrs id=W-CC-PHASE -->
```yaml
status: Approved
surface: dashboard
inherits-from: W-CC-SHELL
zone-count: 3
element-count: 6
```
<!-- /specrail:attrs -->

```
ZN-SHELL-MAIN-1 안:
┌──────────────────────────────────────────────────────────┐
│ ZN-PHASE-TOOLBAR-1  Phase 03 — Features  status: Approved  │
│   [Read]/[Edit] toggle · [Run check] · [AI review section]│
├──────────────────────────────────────────────────────────┤
│ ZN-PHASE-FRONTMATTER-1 (collapsible)                       │
│   phase: 3 · status: Approved · …                        │
├──────────────────────────────────────────────────────────┤
│ ZN-PHASE-BODY-1                                             │
│   # Features                                              │
│   ## R1: Spec view & navigation                           │
│   - F1.2 의존 [R1](▾ R1: …)  ← ID hover popover           │
│   …                                                       │
│   (text 선택 시 floating: AI rewrite · verify · ask)       │
└──────────────────────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-PHASE-TOOLBAR-1 -->
```yaml
page: P-CC-4
purpose: "phase 메타 + 모드 toggle + 일괄 액션"
visible-to-state: ["loaded"]
linked-feature: F5.1
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-PHASE-FRONTMATTER-1 -->
```yaml
page: P-CC-4
purpose: "frontmatter zod-validated form"
visible-to-state: ["loaded", "edit"]
linked-feature: F5.2
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-PHASE-BODY-1 -->
```yaml
page: P-CC-4
purpose: "markdown body — remark/rehype 렌더 또는 CodeMirror editor"
visible-to-state: ["loaded", "edit", "conflict"]
linked-feature: F1.1
zone-order: 3
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-4 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-PHASE-TOOLBAR-1
source-data: "POST /api/projects/:id/issues/refresh — plugin self-check + cross-phase"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-5 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-PHASE-TOOLBAR-1
source-data: "POST /api/projects/:id/ai/sessions origin=review-scan phase=N"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-6 -->
```yaml
status: Approved
kind: hover-popover
parent-zone: ZN-PHASE-BODY-1
source-data: "core.spec.lookupById(id) → 첫 200자"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-7 -->
```yaml
status: Approved
kind: floating-menu
parent-zone: ZN-PHASE-BODY-1
source-data: "selection event → AI rewrite / verify / ask 옵션"
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading | toolbar visible, body skeleton 10 줄 |
| Empty (phase file 0 byte) | "Phase N placeholder — /specrail phase N 실행" |
| Error (frontmatter zod 실패) | top banner "frontmatter invalid — line X" + raw mode toggle |
| Success | 위 layout |
| Conflict (외부 편집 도중 save) | top banner "외부 변경 감지 — Compare / Force / Cancel" → P-CC-10 modal |

---

## 4. W-CC-GRAPH — Graph view (P-CC-5)

<!-- specrail:attrs id=W-CC-GRAPH -->
```yaml
status: Approved
surface: dashboard
inherits-from: W-CC-SHELL
zone-count: 2
element-count: 4
```
<!-- /specrail:attrs -->

```
ZN-SHELL-MAIN-1 안:
┌────────────────┬─────────────────────────────────────────┐
│ ZN-GRAPH-FILT-1  │ ZN-GRAPH-CANVAS-1                          │
│                │                                          │
│ Phases ☑ all   │     ┌──┐    ┌──┐                         │
│ Prefix         │     │R1│───▶│F1│                         │
│  ☑ R F S       │     └──┘    └──┘                         │
│  ☑ NFR TC      │                ▼                         │
│ N-hop: [1] ─── │              ┌──────┐                    │
│ ☐ Orphans only │              │S1.1.1│                    │
│ ☐ Dangling only│              └──────┘                    │
└────────────────┴─────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-GRAPH-FILT-1 -->
```yaml
page: P-CC-5
purpose: "filter (phase/prefix/N-hop/orphan/dangling)"
visible-to-state: ["loaded"]
linked-feature: F2.2
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-GRAPH-CANVAS-1 -->
```yaml
page: P-CC-5
purpose: "React Flow + elkjs layered layout"
visible-to-state: ["loaded", "loading", "empty"]
linked-feature: F2.2
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-8 -->
```yaml
status: Approved
kind: slider
parent-zone: ZN-GRAPH-FILT-1
source-data: "core.graph.nhop(selectedId, n)"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-9 -->
```yaml
status: Approved
kind: graph-node
parent-zone: ZN-GRAPH-CANVAS-1
source-data: "core.graph.nodes() — SpecId 라벨, severity 색"
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading | canvas spinner |
| Empty (no IDs) | "Phase 작성 후 graph 표시" |
| Error (elk layout 실패) | fallback list view |
| Success | 위 layout |
| 200+ nodes | phase-level collapsed view (S2.2.3) |

---

## 5. W-CC-ISSUES — Issue inbox (P-CC-6)

<!-- specrail:attrs id=W-CC-ISSUES -->
```yaml
status: Approved
surface: dashboard
inherits-from: W-CC-SHELL
zone-count: 2
element-count: 5
```
<!-- /specrail:attrs -->

```
ZN-SHELL-MAIN-1 안:
┌──────────────────────────────────────────────────────────┐
│ ZN-ISSUES-FILTER-1  [All ▾] [Source ▾] [Severity ▾]        │
│                   [Phase ▾]            [Run AI review]   │
├──────────────────────────────────────────────────────────┤
│ ZN-ISSUES-LIST-1                                            │
│  ⚠ NFR-12 has no measurable acceptance criterion         │
│     source: ai-quality   phase: 09  ▸ Suggested patch    │
│  ✖ F1.2 references R3 not defined in phase 1             │
│     source: cross-phase  phase: 03  ▸ Suggested patch    │
│  ⋯                                                        │
└──────────────────────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-ISSUES-FILTER-1 -->
```yaml
page: P-CC-6
purpose: "필터 + AI review trigger"
visible-to-state: ["loaded"]
linked-feature: F3.3
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-ISSUES-LIST-1 -->
```yaml
page: P-CC-6
purpose: "Issue rows w/ source-label, expand to patch preview"
visible-to-state: ["loaded", "empty"]
linked-feature: F3.3
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-10 -->
```yaml
status: Approved
kind: list-row
parent-zone: ZN-ISSUES-LIST-1
source-data: "ENT-Issue (sort: severity desc, source group)"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-11 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-ISSUES-FILTER-1
source-data: "POST /api/projects/:id/ai/sessions origin=review-scan"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-12 -->
```yaml
status: Approved
kind: inline-diff
parent-zone: ZN-ISSUES-LIST-1
source-data: "ENT-PatchProposal.hunks → unified diff view"
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading (검사 중) | top progress bar + "Running checks…" |
| Empty (no issues) | "Clean ✓" with last-check timestamp |
| Error (check 실패) | row entry source=internal-error |
| Success | issue list |

---

## 6. W-CC-EDIT — Edit mode (P-CC-7)

<!-- specrail:attrs id=W-CC-EDIT -->
```yaml
status: Approved
surface: dashboard
inherits-from: W-CC-PHASE
zone-count: 3
element-count: 3
```
<!-- /specrail:attrs -->

P-CC-4 와 동일 layout, ZN-PHASE-BODY-1 가 CodeMirror editor 로 교체. Toolbar 의 [Edit] 강조 + Save 버튼 노출.

<!-- specrail:attrs id=E-CC-13 -->
```yaml
status: Approved
kind: editor
parent-zone: ZN-PHASE-BODY-1
source-data: "ENT-Phase.body (raw markdown)"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-14 -->
```yaml
status: Approved
kind: form
parent-zone: ZN-PHASE-FRONTMATTER-1
source-data: "ENT-Phase.frontmatter (zod schema/phase)"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-15 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-PHASE-TOOLBAR-1
source-data: "PUT /api/projects/:id/phases/:n {content, basedOnMtimeMs}"
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading | editor read-only spinner overlay |
| Empty | editor 빈 새 phase |
| Error (zod 위반) | inline frontmatter 필드별 에러 |
| Success (dirty) | Save 활성 |
| Saving | spinner inside Save |
| Conflict (409) | redirect P-CC-10 |

---

## 7. W-CC-CHAT — Chat drawer (P-CC-8)

<!-- specrail:attrs id=W-CC-CHAT -->
```yaml
status: Approved
surface: dashboard
inherits-from: W-CC-SHELL
zone-count: 3
element-count: 3
```
<!-- /specrail:attrs -->

```
ZN-SHELL-DRAWER-1 (우측) 안 Chat tab:
┌─────────────────────┐
│ ZN-CHAT-HEADER-1       │
│ Session #abc · phase │
│ Sessions ▾    [×]    │
├─────────────────────┤
│ ZN-CHAT-MESSAGES-1    │
│ U: 이 NFR 의 측정… │
│ A: 측정 단위 누락…  │
│    ┌─patch card─┐   │
│    │ -before    │   │
│    │ +after     │   │
│    │ [Accept]   │   │
│    └────────────┘   │
├─────────────────────┤
│ ZN-CHAT-INPUT-1       │
│ [_____________]Send │
│              [Stop] │
└─────────────────────┘
```

<!-- specrail:attrs id=ZN-CHAT-HEADER-1 -->
```yaml
page: P-CC-8
purpose: "session selector + close"
visible-to-state: ["loaded"]
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-CHAT-MESSAGES-1 -->
```yaml
page: P-CC-8
purpose: "AiMessage stream, inline diff card 포함"
visible-to-state: ["loaded", "streaming"]
linked-feature: F4.2
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-CHAT-INPUT-1 -->
```yaml
page: P-CC-8
purpose: "user message + send/stop"
visible-to-state: ["loaded"]
linked-feature: F4.2
zone-order: 3
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-16 -->
```yaml
status: Approved
kind: message-bubble
parent-zone: ZN-CHAT-MESSAGES-1
source-data: "ENT-AiMessage (markdown 렌더)"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-17 -->
```yaml
status: Approved
kind: inline-diff
parent-zone: ZN-CHAT-MESSAGES-1
source-data: "ENT-PatchProposal — accept/reject 메커니즘 issues inbox 와 공통"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-18 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-CHAT-INPUT-1
source-data: "POST /api/projects/:id/ai/sessions/:sid/messages"
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading (initial) | message list skeleton |
| Empty (new session) | "컨텍스트 자동 첨부됨: phase N — 무엇을 검토할까요?" |
| Error (CLI 실패) | error message bubble + 재시도 |
| Success (streaming) | token append, Send → Stop transition |
| Done | Stop → Send 복귀, Accept/Reject patch cards 활성 |

---

## 8. W-CC-CHANGES — Changes folder RO (P-CC-9)

<!-- specrail:attrs id=W-CC-CHANGES -->
```yaml
status: Approved
surface: dashboard
inherits-from: W-CC-SHELL
zone-count: 2
element-count: 1
```
<!-- /specrail:attrs -->

DELTA changes/ 폴더 read-only 표시. RO 명시 — edit UI 없음.

<!-- specrail:attrs id=ZN-CHANGES-LIST-1 -->
```yaml
page: P-CC-9
purpose: "changes/{date-topic}/ entries, status 표시"
visible-to-state: ["loaded", "empty"]
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-CHANGES-PROPOSAL-1 -->
```yaml
page: P-CC-9
purpose: "selected change 의 proposal.md rendered"
visible-to-state: ["loaded"]
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-19 -->
```yaml
status: Approved
kind: list-row
parent-zone: ZN-CHANGES-LIST-1
source-data: "fs.readdir(<projectRoot>/docs/spec/changes/)"
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading | row skeleton 3 |
| Empty | "No DELTA proposals yet" |
| Error | "changes/ 디렉토리 없음 또는 읽기 실패" |
| Success | list + selected proposal rendered |

---

## 9. W-CC-CONFLICT — Conflict dialog (P-CC-10)

<!-- specrail:attrs id=W-CC-CONFLICT -->
```yaml
status: Approved
surface: dashboard
zone-count: 1
element-count: 4
```
<!-- /specrail:attrs -->

```
[modal overlay]
┌──────────────────────────────────────────────────────────┐
│ ZN-CONFLICT-DIALOG-1                                        │
│ ⚠ 파일이 외부에서 변경되었습니다 (mtime mismatch)         │
│                                                            │
│  Last seen mtime: 2026-05-17T14:23:11Z                    │
│  Current mtime:  2026-05-17T14:25:09Z                     │
│                                                            │
│  변경 사항:                                                │
│  ┌──── unified diff (your edit vs disk) ───┐              │
│  │ + …                                       │              │
│  │ - …                                       │              │
│  └──────────────────────────────────────────┘              │
│                                                            │
│  [Compare in detail]  [Discard my changes]                │
│  [Cancel]                            [Force overwrite]    │
└──────────────────────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-CONFLICT-DIALOG-1 -->
```yaml
page: P-CC-10
purpose: "외부 변경 인지 + 해결 선택"
visible-to-state: ["loaded"]
linked-feature: F6.3
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-20 -->
```yaml
status: Approved
kind: inline-diff
parent-zone: ZN-CONFLICT-DIALOG-1
source-data: "사용자 in-memory body vs server fs body"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-21 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-CONFLICT-DIALOG-1
source-data: "PUT /api/projects/:id/phases/:n {basedOnMtimeMs: <current>}"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-22 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-CONFLICT-DIALOG-1
source-data: "client state discard → re-fetch ENT-Phase"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-23 -->
```yaml
status: Approved
kind: link
parent-zone: ZN-CONFLICT-DIALOG-1
source-data: "open external diff tool (system git-mergetool 또는 link to GitHub compare)"
```
<!-- /specrail:attrs -->

### Component States
단일 modal — Loading/Empty 없음. Error 시 modal 안에서 retry 또는 cancel.

---

## 10. W-CC-CMDK — Quick switcher (P-CC-11)

<!-- specrail:attrs id=W-CC-CMDK -->
```yaml
status: Approved
surface: dashboard
zone-count: 2
element-count: 2
```
<!-- /specrail:attrs -->

```
[modal overlay, cmd+k]
┌─────────────────────────────────────────┐
│ ZN-CMDK-INPUT-1                            │
│ > _____________________________________  │
├─────────────────────────────────────────┤
│ ZN-CMDK-RESULTS-1                          │
│  Phase 03 — Features                     │
│  R3 Deterministic quality checks         │
│  NFR-PERF-2 graph layout time            │
│  …  (max 10, fuzzy match)               │
└─────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-CMDK-INPUT-1 -->
```yaml
page: P-CC-11
purpose: "fuzzy query input"
visible-to-state: ["loaded"]
linked-feature: F1.3
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=ZN-CMDK-RESULTS-1 -->
```yaml
page: P-CC-11
purpose: "match list, keyboard nav (↑↓⏎)"
visible-to-state: ["loaded", "empty"]
linked-feature: F1.3
zone-order: 2
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-24 -->
```yaml
status: Approved
kind: list-row
parent-zone: ZN-CMDK-RESULTS-1
source-data: "fuse.js index (phases + parsedIds)"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-25 -->
```yaml
status: Approved
kind: input
parent-zone: ZN-CMDK-INPUT-1
source-data: "query string"
```
<!-- /specrail:attrs -->

### Component States
| State | 표시 |
|---|---|
| Loading (index build) | "Indexing…" 후 result list |
| Empty (no match) | "No match" |
| Success | result list, ⏎ → navigate |

---

## 11. W-CC-NOTFOUND — Not found (P-CC-404)

<!-- specrail:attrs id=W-CC-NOTFOUND -->
```yaml
status: Approved
surface: dashboard
zone-count: 1
element-count: 1
```
<!-- /specrail:attrs -->

```
┌──────────────────────────────────────────────────────────┐
│  404 — Project or phase not found                         │
│  [Go to projects]                                          │
└──────────────────────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-NOTFOUND-1 -->
```yaml
page: P-CC-404
purpose: "fallback for unknown route or missing project"
visible-to-state: ["loaded"]
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-26 -->
```yaml
status: Approved
kind: link
parent-zone: ZN-NOTFOUND-1
source-data: "router.navigate('/')"
```
<!-- /specrail:attrs -->

---

## 12. W-CC-ERROR — System error (P-CC-500)

<!-- specrail:attrs id=W-CC-ERROR -->
```yaml
status: Approved
surface: dashboard
zone-count: 1
element-count: 2
```
<!-- /specrail:attrs -->

```
┌──────────────────────────────────────────────────────────┐
│  500 — Server error                                       │
│  Error id: abc-123                                         │
│  [Reload]     [Copy log path]                              │
└──────────────────────────────────────────────────────────┘
```

<!-- specrail:attrs id=ZN-ERROR-1 -->
```yaml
page: P-CC-500
purpose: "uncaught 5xx 또는 client unhandled"
visible-to-state: ["loaded"]
zone-order: 1
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-27 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-ERROR-1
source-data: "window.location.reload()"
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=E-CC-28 -->
```yaml
status: Approved
kind: button
parent-zone: ZN-ERROR-1
source-data: "clipboard.write(env-paths log path)"
```
<!-- /specrail:attrs -->

---

## Responsive

본 cycle: desktop 1280+ only (PRD §6 Non-Goal #4). sub-1280 또는 mobile breakpoint 없음. 따라서 2-breakpoint matrix 생략.

## Open Questions

<!-- specrail:attrs id=OQ-7-1 -->
```yaml
decider: maintainer
due: "Phase 8"
blocking: true
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-7-2 -->
```yaml
decider: maintainer
due: "Phase 8"
blocking: false
```
<!-- /specrail:attrs -->

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-7-1 | E-CC-23 의 "open external diff tool" 가 실제로 가능? (browser 에서 native git mergetool 호출은 불가) — alternative: dashboard 안 내장 side-by-side diff view | maintainer | Y |
| OQ-7-2 | W-CC-CMDK 의 cmd+k 가 OS 단축키와 충돌 (Spotlight)? Linux/Windows 는 ctrl+k 사용? | maintainer | N |

## 다음 phase 인풋

- **Phase 8 (Architecture):** ZN/E-CC 의 source-data 가 API 호출·core 모듈 매핑 — backend routes.
- **Phase 10 (Test):** 4 component states 각각 e2e 시나리오 후보.
- **Phase 11 (Operations):** P-CC-500 의 log path · error id 형식.
