---
phase: 6
status: Approved
mode: HOLD_SCOPE
version: "1.0"
date: 2026-05-17
approved-date: 2026-05-17
approver: user (smoh2044@gmail.com)
approval-method: "사용자 '모든 페이즈 계속 진행' 일괄 승인"
inputs-from: ["03-features.md (single-user, no Permission Matrix)", "05-user-flow.md §2 페이지 Node"]
---

# Information Architecture

**Mode:** HOLD SCOPE (inherited)
**Inputs:** Phase 3 (single-user, no Permission Matrix), Phase 5 페이지 Node
**Date:** 2026-05-17

## 1. Page Catalog

본 dashboard 는 single-user web app. URL 은 React Router (client-side). depth 는 logical (UX tree) — 모두 한 SPA shell 안 view 전환.

<!-- specrail:attrs id=P-CC-1 -->
```yaml
surface: dashboard
trigger: "npx @specrail/dashboard 또는 /specrail dashboard 후 projects > 0"
parent-section: SEC-1
flow-node: FLN-4
features: [F1.4]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-2 -->
```yaml
surface: dashboard
trigger: "registry projects = 0 → onboarding"
parent-section: SEC-1
flow-node: FLN-5
features: [F1.4]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-3 -->
```yaml
surface: dashboard
trigger: "active project 선택됨 → app shell"
parent-section: SEC-2
flow-node: FLN-10
features: [F1.1]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-4 -->
```yaml
surface: dashboard
trigger: "shell 내 sidebar 의 phase N click 또는 /phase/:n"
parent-section: SEC-2
flow-node: FLN-11
features: [F1.1, F1.2, F5.1]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-5 -->
```yaml
surface: dashboard
trigger: "shell 내 /graph 또는 g g shortcut"
parent-section: SEC-3
flow-node: FLN-20
features: [F2.2, F2.3]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-6 -->
```yaml
surface: dashboard
trigger: "shell 내 /issues 또는 g i shortcut"
parent-section: SEC-4
flow-node: FLN-30
features: [F3.3]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-7 -->
```yaml
surface: dashboard
trigger: "phase view 의 [Edit] toggle"
parent-section: SEC-6
flow-node: FLN-51
features: [F5.1, F5.2]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-8 -->
```yaml
surface: dashboard
trigger: "shell 의 우측 chat 드로어 open"
parent-section: SEC-5
flow-node: FLN-42
features: [F4.2]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-9 -->
```yaml
surface: dashboard
trigger: "shell 내 /changes — read-only DELTA folder view"
parent-section: SEC-2
flow-node: FLN-10
features: []
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-10 -->
```yaml
surface: dashboard
trigger: "save 시 mtime mismatch → 409 → modal"
parent-section: SEC-6
flow-node: FLN-53
features: [F5.3, F6.3]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-11 -->
```yaml
surface: dashboard
trigger: "cmd+k anywhere"
parent-section: SEC-2
flow-node: FLN-14
features: [F1.3]
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-404 -->
```yaml
surface: dashboard
trigger: "unknown route 또는 project not found"
parent-section: SEC-1
flow-node: FLN-4
features: []
status: Approved
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=P-CC-500 -->
```yaml
surface: dashboard
trigger: "server 5xx 또는 client unhandled exception"
parent-section: SEC-1
flow-node: FLN-4
features: []
status: Approved
```
<!-- /specrail:attrs -->

| Page ID | 이름 | Phase 5 Node | URL Pattern | 깊이 |
|---|---|---|---|---|
| P-CC-1 | Project list | FLN-4 | `/` (projects ≥ 1) | 1 |
| P-CC-2 | Add project picker | FLN-5 | `/onboarding` 또는 modal | 1 |
| P-CC-3 | App shell (3-pane) | FLN-10 | `/p/:projectId` | 2 |
| P-CC-4 | Phase view | FLN-11 | `/p/:projectId/phase/:n` | 3 |
| P-CC-5 | Graph view | FLN-20 | `/p/:projectId/graph` | 3 |
| P-CC-6 | Issue inbox | FLN-30 | `/p/:projectId/issues` | 3 |
| P-CC-7 | Edit mode (phase) | FLN-51 | `/p/:projectId/phase/:n?edit=1` | 4 |
| P-CC-8 | Chat drawer | FLN-42 | `/p/:projectId/phase/:n#chat` (드로어, route 변동 X) | 3 |
| P-CC-9 | Changes folder (RO) | FLN-10 | `/p/:projectId/changes` | 3 |
| P-CC-10 | Conflict dialog (409) | FLN-53 | modal overlay | - |
| P-CC-11 | Quick switcher (cmd+k) | FLN-14 | modal overlay | - |
| P-CC-404 | Not found | - | * fallback | - |
| P-CC-500 | System error | - | * fallback | - |

## 2. Page Tree

```mermaid
graph TD
    Root[/] --> P1[P-CC-1 Project list]
    Root --> P2[P-CC-2 Add project picker]
    P1 --> P3[P-CC-3 /p/:projectId App shell]
    P2 --> P3
    P3 --> P4[P-CC-4 phase/:n]
    P3 --> P5[P-CC-5 /graph]
    P3 --> P6[P-CC-6 /issues]
    P3 --> P9[P-CC-9 /changes RO]
    P4 --> P7[P-CC-7 ?edit=1]
    P4 --> P8[P-CC-8 #chat 드로어]
    P5 --> P8
    P6 --> P8
    Root -.-> P404[P-CC-404]
    Root -.-> P500[P-CC-500]
    P4 -.-> P10[P-CC-10 Conflict modal]
    P7 -.-> P10
    Root -.-> P11[P-CC-11 cmd+k modal]
```

깊이 4 (P-CC-7) 가 최대. 평탄화 한계 준수.

## 3. Navigation Strategy

### Top-level (active project 선택 후)
- **데스크톱:** 좌측 sidebar (phase list 14 entries: 1~13 + Changes), top bar (project switcher + AI status), 우측 collapsible drawer (Issues / Chat / Refs tabs).
- **Project switcher:** top bar 드롭다운, 최근순 + "Add project…".
- **단축키:** `g p` phase view, `g g` graph, `g i` issues, `cmd+k` quick switcher, `cmd+s` save (Edit 모드).
- **Breadcrumb:** depth 3 이상에서만 표시 (예: `specrail / Phase 5 / Edit`). depth 1-2 는 sidebar 가 위치 정보 제공.

### Sub-page tabs (drawer 내)
- 우측 drawer 의 3 tab: Issues (P-CC-6 와 sync), AI chat (P-CC-8), Refs (FLN-23 선택 결과 표시).
- Drawer 는 route 변경 X — query param 또는 hash 만.

### Modal overlays
- P-CC-10 Conflict dialog, P-CC-11 Quick switcher 는 route stack 의 마지막 위 overlay.
- ESC 또는 외부 click 시 해당 modal 만 닫힘, 뒤 page state 보존.

## 4. Deep Link Patterns

| Pattern | 의미 | 인증 요구 |
|---|---|---|
| `/` | Project list (registry projects ≥ 1) 또는 onboarding (= 0) | 없음 (localhost) |
| `/onboarding` | Add project picker | 없음 |
| `/p/:projectId` | App shell, default = 마지막 active phase | localhost + CSRF cookie + project 존재 검증 |
| `/p/:projectId/phase/:n` | Phase view (n=1..13) | 위 + n 범위 검증 |
| `/p/:projectId/phase/:n?edit=1` | Edit mode | 위 |
| `/p/:projectId/phase/:n#chat` | Chat drawer auto-open | 위 |
| `/p/:projectId/graph` | Graph view | 위 |
| `/p/:projectId/issues` | Issue inbox | 위 |
| `/p/:projectId/changes` | DELTA folder RO | 위 |

**Project ID 검증:** route guard 가 `GET /api/projects/:id` 호출 → 404 면 `/` 로 redirect. URL 의 projectId 가 노출되는 것은 SHA256 hash 라 path 누설 위험 0.

**State 외 URL:** drawer open 상태, quick switcher open, modal 등은 URL 에 반영 안 함 (`?edit=1` 만 예외 — 책갈피·외부 공유 용도).

## 5. Empty / Error States

| 조건 | Page | 표시 |
|---|---|---|
| registry projects = 0 | P-CC-2 onboarding | "첫 project 등록" 가이드 + 디렉토리 picker |
| projectId 404 | P-CC-1 + toast | "Project not found, 새로 등록하세요" |
| phase N 의 frontmatter zod 검증 실패 | P-CC-4 + 상단 banner | "frontmatter 손상 — vim 으로 수정" + raw view |
| claude CLI 미설치 | P-CC-6 의 Run AI review 클릭 시 modal | "Claude Code 설치 필요" + 가이드 링크 |
| SSE 연결 끊김 | top bar indicator + 5s 재연결 | "재연결 중…" |
| network/server 5xx | P-CC-500 | "서버 오류 — 새로고침" + 로그 위치 |

## 6. Role Gating

**해당 없음.** Single-user product (PRD §3.3). All pages accessible.

## 7. Open Questions

<!-- specrail:attrs id=OQ-6-1 -->
```yaml
decider: maintainer
due: "Phase 7"
blocking: false
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-6-2 -->
```yaml
decider: maintainer
due: "Phase 13"
blocking: true
```
<!-- /specrail:attrs -->

<!-- specrail:attrs id=OQ-6-3 -->
```yaml
decider: maintainer
due: "Phase 11"
blocking: false
```
<!-- /specrail:attrs -->

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-6-1 | Drawer 의 3 tab (Issues/Chat/Refs) 동시 시각화 vs 한 번에 하나만 | maintainer | N |
| OQ-6-2 | URL hash (#chat) 대신 query param 사용 (북마크 호환성) | maintainer | Y |
| OQ-6-3 | Phase view URL `/p/:id/phase/:n` 의 `:n` 가 number vs slug (`prd`, `features`) | maintainer | N |

## 8. 다음 phase 인풋

- **Phase 7 (Wireframe):** P-CC-1 ~ P-CC-11 각 페이지의 zone layout + element 사양.
- **Phase 8 (Architecture):** URL pattern → route handler 매핑 + CSRF/path validation 적용 지점.
- **Phase 10 (Test):** Deep link 패턴 e2e 검증 (P-CC-4 ?edit=1 부터 P-CC-10 conflict 까지).
