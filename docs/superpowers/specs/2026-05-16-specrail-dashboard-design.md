# specrail-dashboard — Design

**Status:** Approved (brainstorm)
**Date:** 2026-05-16
**Authors:** sungminoh, Claude
**Cycle:** Dashboard cycle (PRD §10 에서 분리·예고된 별 cycle)
**Source plugin spec:** `docs/spec/01-prd.md` (specrail v0.2.x)

---

## 0. Why this exists

`specrail` plugin 의 PRD §10 은 두 가지 PAIN을 dashboard cycle 로 명시적으로 미뤘다:

- **PAIN-2** 기억 의존 — "Phase 3 에서 R1 뭐였지?" 매번 ctrl-F
- **PAIN-4** 검토 cumbersome — dependency·status·산출물이 14 개 파일에 분산

Plugin 의 frontmatter 는 "미래 dashboard read 호환 design" 으로 만들어졌고 (PRD §1, §3), 본 cycle 이 그 호환 계약을 처음 소비한다. 즉 이 dashboard 자체가 specrail spec discipline 의 첫 dogfood 적용 사례이며, 동시에 plugin 의 frontmatter schema 가 실제로 review·edit workflow 를 받쳐주는지 검증한다.

## 1. Top-level decisions (locked)

| # | Decision | Rationale | Reversal cost |
|---|----------|-----------|---------------|
| 1 | **OSS local self-host** — `npx`-able, auth 없음 | PRD 가 "Local web dashboard" 로 정의. 팀 hosted 는 별 cycle | 중 (auth·multi-tenant 추가 시 큰 변경) |
| 2 | **AI = Claude Code CLI subprocess** (`claude -p`, stream-json) | 사용자 이미 가짐, API key 관리 0, plugin 과 동일 LLM 컨텍스트 | 저 (어댑터 인터페이스 뒤에 격리) |
| 3 | **v1 = view + 관계 + AI review/edit 모두** | 사용자 요구. 단일 `PatchProposal` 깔때기로 복잡도 흡수 | — |
| 4 | **Multi-project registry** (`~/.specrail-dashboard/registry.json`) | PRD Edge-2 (다중 project tab) 가 dashboard cycle 로 이동됨 | 저 |
| 5 | **Monorepo** — 현재 `specrail/` repo 안에 `packages/{core,plugin,dashboard}` | 공유 도메인(core) 한 곳, 버전 동기화 자연스러움 | 고 (이후 분리는 git history 분할 필요) |
| 6 | **Vite + React (SPA) + Hono server** | 장기 확장성·표준 Web 런타임 중립·hexagonal 친화 | 중 (Next.js 로 전환 가능, 비파괴) |
| 7 | **AI UX 3종 통합** — issue list + chat + inline | 사용자 요구. 모두 `PatchProposal` 로 수렴 | — |
| 8 | **Edit = direct write to `docs/spec/`** (DELTA UI 는 v2) | git 이 승인 layer, ceremony 최소 | 저 |
| 9 | **File watcher (chokidar) + SSE push** | 외부 편집 즉시 반영, AI streaming 과 동일 infra 재사용 | 저 |
| 10 | **Review = 3-tier**: plugin self-check + cross-phase deterministic + AI 품질 | source 라벨로 사용자 신뢰도 즉시 판단 | 저 |
| 11 | **배포 분리, slash command 연결** — `@specrail/dashboard` 별 npm package + plugin 이 `/specrail dashboard` slash command 로 `npx -y @specrail/dashboard@^0.x` 호출 | 버전·이슈 분리 유지하면서 사용자 UX 는 1-step | 저 |
| 12 | **시각 디자인 시스템은 별 cycle** — `/design-consultation` 산출물(DESIGN.md)로 대체 | UX/IA 와 visual design 은 별 결정 layer | — |

## 2. Architecture

### 2.1 Monorepo layout

```
specrail/
├─ pnpm-workspace.yaml                # workspaces: ["packages/*"]
├─ package.json
├─ packages/
│  ├─ core/                           # ★ 신설 — 도메인·순수 로직, runtime deps = zod·gray-matter·unified/remark
│  │  ├─ src/
│  │  │  ├─ frontmatter/              # parse, serialize, zod schema per phase
│  │  │  ├─ spec/                     # SpecDoc, Phase, IdRef 모델
│  │  │  ├─ checks/                   # cross-phase 결정적 검사 규칙
│  │  │  ├─ graph/                    # phase·ID → node/edge 계산
│  │  │  └─ patch/                    # PatchProposal, apply
│  │  └─ tests/                       # vitest, 100% in-memory
│  ├─ plugin/                         # 기존 src/, skills/, schemas/ 이동
│  │  └─ …
│  └─ dashboard/                      # ★ 신설
│     ├─ server/                      # Hono
│     │  ├─ adapters/                 # filesystem, claude-cli, registry, watcher
│     │  ├─ routes/                   # HTTP/SSE endpoints (thin)
│     │  ├─ services/                 # use cases
│     │  └─ main.ts                   # bootstrap
│     ├─ web/                         # Vite + React SPA
│     │  └─ src/{shell,features,components,lib,main.tsx}
│     ├─ bin/specrail-dashboard.ts    # npx entrypoint
│     ├─ e2e/                         # Playwright
│     └─ package.json
└─ docs/spec/                         # 기존 그대로 (plugin 의 spec)
```

### 2.2 Hexagonal layers & 단방향 의존

```
                       web (React SPA)
                            │ Hono RPC + SSE (타입 import only)
                       server/routes  (interface adapter)
                            │
                       server/services (use cases)
                            │
        ┌────────────┬──────┴──────┬─────────────┐
        ▼            ▼             ▼             ▼
      core      fs adapter    claude-cli    registry
      (pure)    (chokidar,    (execa,        (JSON@~/)
                fs/promises)  stream-json)
```

**규칙 (CI 로 강제):**

- `core` 는 외부 import 0 (zod 등 순수 lib 제외). filesystem·process·net 접근 금지.
- `plugin` → `core` 만 import.
- `dashboard/server` → `core` + 자기 adapters 만. **routes 는 services 만 호출**, services 만 adapters·core 조합.
- `dashboard/web` → `dashboard/server` 의 **타입만** import (Hono RPC client 추론용). 런타임 의존 없음.
- ESLint `import/no-restricted-paths` + tsconfig project references 로 dependency 위반 build-fail.

### 2.3 Core 도메인 객체

```ts
type ProjectId = string;                 // repo absolute path 의 sha256 short
type PhaseNumber = 1|2|3|4|5|6|7|8|9|10|11|12|13;
type SpecId = string;                    // "R1", "F1.2", "NFR-12", "S1.2.3" 등
type PatchProposalId = string;           // uuid v7
type TextRange = { startLine: number; startCol: number;
                    endLine: number; endCol: number };

interface Project {
  id: ProjectId; name: string; rootPath: string;
  hasSpecrail: boolean;                  // docs/spec/01-prd.md 존재
  lastOpenedAt: Date;
}

interface Phase {
  projectId: ProjectId; number: PhaseNumber; slug: string;
  filePath: string;
  frontmatter: PhaseFrontmatter;         // zod-validated, schema per phase
  body: string;                          // raw markdown
  parsedIds: SpecId[];                   // 이 phase 에서 정의된 ID
  parsedRefs: { from: SpecId; to: SpecId; line: number }[];
  mtimeMs: number;                       // 동시성 토큰
}

interface Issue {
  id: string; projectId: ProjectId;
  severity: 'error'|'warn'|'info';
  source: 'plugin-self-check' | 'cross-phase' | 'ai-quality';
  ruleId: string; message: string;
  location: { phase: PhaseNumber; line?: number; specId?: SpecId };
  suggestedPatch?: PatchProposalId;
}

interface PatchProposal {
  id: PatchProposalId; projectId: ProjectId; createdAt: Date;
  origin: 'issue-fix' | 'chat' | 'inline-rewrite';
  target: { phase: PhaseNumber; selection?: TextRange };
  hunks: { before: string; after: string }[];
  rationale: string;
  status: 'proposed' | 'accepted' | 'rejected';
  basedOnMtimeMs: number;                // 적용 시 mismatch 면 409
}

interface AiSession {
  id: string; projectId: ProjectId; phase?: PhaseNumber;
  origin: 'review-scan' | 'chat' | 'inline';
  messages: { role: 'user'|'assistant'; content: string; ts: Date }[];
  proposedPatches: PatchProposalId[];
  status: 'idle' | 'streaming' | 'done' | 'error';
}
```

**핵심 불변식:** 모든 파일 수정은 `PatchProposal.accept` 한 경로만 통과한다. 세 AI 진입점(issue·chat·inline) 모두 PatchProposal 을 만들고, 같은 accept handler 가 atomic write 한다. 이게 v1 정합성의 단일 깔때기.

## 3. Server API + 데이터 흐름

### 3.1 Entry & 보안 디폴트

```
npx @specrail/dashboard [--project=<path>] [--port=0] [--host=127.0.0.1] [--no-open]
                        [--no-update-check]
```

- 항상 `127.0.0.1` bind. `--host` 가 있고 0.0.0.0/외부 IP 면 시작 시 warning + 5초 카운트다운.
- Port 기본 `0` (free port). 결정되면 stdout 에 URL 출력 + 브라우저 자동 open.
- 시작 시 update check 1회 (npm registry HEAD). `--no-update-check` 로 끔.

### 3.2 HTTP 라우트

```
GET    /api/projects                              → Project[]
POST   /api/projects                              → upsert {rootPath}, 검증 후 등록
DELETE /api/projects/:id                          → unregister (파일 안 지움)
POST   /api/projects/:id/open                     → active 갱신, lastOpenedAt 갱신

GET    /api/projects/:id/phases                   → Phase 요약[] (number, slug, status, errorCount)
GET    /api/projects/:id/phases/:n                → Phase (full)
PUT    /api/projects/:id/phases/:n                → body+frontmatter 직접 저장 (수동 edit 모드)
                                                    body: { content, basedOnMtimeMs }
GET    /api/projects/:id/graph                    → { nodes[], edges[] }
GET    /api/projects/:id/issues                   → Issue[]
POST   /api/projects/:id/issues/refresh           → 결정적 검사 재실행 (async)

POST   /api/projects/:id/patches                  → propose
                                                    body: { origin, target, prompt }
                                                    response: { sessionId, patchIdsHint }
GET    /api/projects/:id/patches/:pid             → PatchProposal
POST   /api/projects/:id/patches/:pid/accept      → 적용 + file write
POST   /api/projects/:id/patches/:pid/reject      → status 변경

POST   /api/projects/:id/ai/sessions              → 새 session 생성
POST   /api/projects/:id/ai/sessions/:sid/messages→ 사용자 메시지 push, AI stream 시작
DELETE /api/projects/:id/ai/sessions/:sid         → abort + delete

GET    /api/projects/:id/events                   (SSE) 단일 채널
```

모든 mutation 라우트는 **CSRF double-submit** 강제. 첫 페이지 load 시 server 가 random `csrf` httpOnly cookie + 같은 값 meta tag, 클라이언트는 `X-CSRF` 헤더로 보냄.

### 3.3 단일 SSE 채널

```ts
type ServerEvent =
  | { type: 'file.changed' | 'file.added' | 'file.deleted';
      phase: PhaseNumber; reason: 'external'|'self-write' }
  | { type: 'issues.updated'; count: number }
  | { type: 'patch.proposed' | 'patch.accepted' | 'patch.rejected'; patchId: string }
  | { type: 'ai.token';  sessionId: string; delta: string }
  | { type: 'ai.tool';   sessionId: string; tool: string; args: unknown }
  | { type: 'ai.done';   sessionId: string; patchIds: string[] }
  | { type: 'ai.error';  sessionId: string; message: string };
```

클라이언트는 React Query cache key 와 event 를 매핑해 invalidate. `self-write` 는 즉시 fresh 라 invalidate skip 최적화 가능.

### 3.4 데이터 흐름 3 시나리오

**A. 외부 편집 → UI 갱신**
```
vim save → chokidar → fs adapter diff → core.parse(phase) → services.onFileChanged
  → cache 갱신 + cross-phase check enqueue → SSE file.changed
  → web invalidate → GET /phases/:n → 화면 갱신
```

**B. AI review-scan → patches**
```
POST /ai/sessions {origin:'review-scan'} → execa('claude', ['-p', prompt, '--output-format','stream-json'], {cwd:project.rootPath})
  → stdout chunk → parse → SSE ai.token (delta) + ai.tool
  → 응답에 patch JSON 감지 → core.parsePatches → services.createPatchProposal
  → SSE patch.proposed → web 의 issue list 에 카드 등장 (status: proposed)
  → 사용자 accept → POST /patches/:pid/accept → atomic write → SSE file.changed (self-write)
```

**C. Inline rewrite**
```
selection → POST /ai/sessions {origin:'inline', phase, selection}
  → 동일 streaming, target = selection range
  → diff overlay 로 inline preview → accept/reject
```

### 3.5 Atomic write & conflict 규약

- 모든 spec 파일 write 는 `write-file-atomic` 패턴: `<file>.tmp.<rand>` 작성 → `fsync` → `rename`.
- write 직전 `fs.stat().mtimeMs` 가 `PatchProposal.basedOnMtimeMs` 또는 `PUT /phases/:n` 요청의 `basedOnMtimeMs` 와 같아야 함. 다르면 **409 Conflict** + UI 에 "외부 편집과 충돌, 새로고침 또는 강제 적용" 다이얼로그.
- `services.applyPatch` 는 새 mtime 을 SSE event 에 동봉 → 같은 dashboard 의 다른 탭들도 동기화.

## 4. UI Shell + Features

### 4.1 3-pane 레이아웃

```
┌────────────────────────────────────────────────────────────────────┐
│ Top bar: [Project ▾ name (~/path)]  [⟳]  [AI: idle/streaming]      │
├──────────┬─────────────────────────────────────┬───────────────────┤
│ Left     │ Main pane (route-driven)            │ Right drawer      │
│ sidebar  │  /phases/:n  → phase view           │ (collapsible)     │
│ Phases   │  /graph      → graph view           │  • Issues tab     │
│  01 PRD● │  /issues     → issue inbox          │  • AI chat tab    │
│  02 …  ●│  /changes    → DELTA folder (RO)    │  • Refs tab       │
│  ⋮       │                                     │    (선택 ID 의     │
│ Sources  │                                     │     in/out refs)  │
└──────────┴─────────────────────────────────────┴───────────────────┘
```

- 사이드바 phase 옆 상태 아이콘: `●` clean / `▲` 이슈(색=severity) / `◷` 검사 진행 / `✱` patch 대기.
- Project switcher: 최근순 드롭다운 + "Add project…" (디렉토리 picker, 서버 측 validation 후 등록).
- 단축키: `g p` phase / `g g` graph / `g i` issues / `cmd+k` quick switcher (phase·ID 검색).

### 4.2 Phase view

```
Phase 03 — Features   status: Approved   v1.1   mtime 2026-05-12
Toolbar: [Read]/[Edit] toggle  [Run check]  [AI review section]
  // Run check = plugin self-check (이 phase) + cross-phase deterministic 둘 다 트리거.
  // AI review section = 현재 phase 만 대상으로 ai-quality review-scan.

▾ frontmatter (collapsible)
  phase: 3
  status: Approved   ← inline editable, zod-validated

# Features
## F1 — Spec discipline
…
- 의존: [R1] ← ID click-to-popover, hover preview

(text 선택 시 floating menu: AI rewrite / AI verify / Ask)
```

- **Read 모드:** remark/rehype 렌더, spec ID 자동 link-ify + hover preview + click-to-jump.
- **Edit 모드:** CodeMirror 6 markdown editor + frontmatter form (zod schema → auto-form). 본문 markdown 이 source of truth, frontmatter form 은 YAML 블록과 양방향 sync.
- **Save:** 자동 저장 없음. `cmd+s` 또는 toolbar. mtime conflict 시 toolbar 에 배너 + dialog.
- **AI 진입점 3개:** ① toolbar "AI review section" (현재 phase 전체), ② 선택 floating menu (inline rewrite), ③ 우측 chat 드로어 (대화, 자동 컨텍스트).

### 4.3 Graph view

- **React Flow** + `elkjs` layered layout (phase 좌→우).
- 노드 = SpecId, edge = ref.
- 필터: phase checkbox, ID prefix(R/F/S/U/IA/W/C/NFR/TC/OP/ADR/RISK/T), "N-hop from selected" slider (기본 1), "Orphans only" / "Dangling refs only".
- 노드 클릭 → 우측 Refs 탭 + "Open in phase view".
- 200+ 노드 시 phase-level collapsed view 폴백 (phase 노드 클릭 = expand).

### 4.4 Issue inbox

- 필터: All / Source / Severity / Phase.
- Row 펼치면 정확한 line + patch preview + Accept/Reject.
- 출처 라벨(`plugin-self-check` / `cross-phase` / `ai-quality`) 이 1급 시각 정보 — 사용자 신뢰도 즉시 판단.
- 우상단 [Run AI review] → review-scan AI session, 결과 stream.
- "Apply all" bulk 액션은 v1 제외 (오적용 위험).

### 4.5 AI chat 드로어

- 우측, phase/graph view 와 공존.
- 컨텍스트 자동 첨부: 현재 phase 또는 선택 ID 의 정의 + 직접 ref.
- 메시지에 patch 가 포함되면 인라인 diff 카드 → 동일 accept/reject.
- 세션은 project 별 영속, "Sessions" sidebar entry 에서 재오픈.

### 4.6 Visual design system

**TBD — `/design-consultation` 별 cycle 산출물(DESIGN.md)로 대체.**
§4.1–4.5 의 layout·인터랙션·정보 구조는 확정. 시각 토큰(spacing, color, typography), 컴포넌트 라이브러리 선택, 다크/라이트, icon set, 모션은 design-consultation 결과에 따른다. 구현 순서상 design-consultation 산출 후 styling 진입 — 그 전엔 unstyled/minimal 골격으로 기능 검증 가능 (writing-plans 에서 phase 분리).

## 5. AI 통합 디테일

### 5.1 Claude CLI 어댑터

```ts
interface ClaudeCli {
  stream(opts: { cwd: string; prompt: string; abortSignal: AbortSignal }):
    AsyncIterable<ClaudeChunk>;
}
type ClaudeChunk =
  | { type: 'text'; delta: string }
  | { type: 'tool_use'; tool: string; input: unknown }
  | { type: 'done'; stopReason: string };
```

- **구현:** `execa('claude', ['-p', prompt, '--output-format', 'stream-json'], { cwd, shell: false })`. stream-json line 단위 파싱.
- **`cwd` = target project root** 필수. 그 repo 의 CLAUDE.md·MCP·skill 컨텍스트가 그대로 적용된다 — dashboard 클릭 = 그 repo 컨텍스트의 AI 호출.
- **Abort:** SSE 끊김·사용자 Stop → `SIGTERM` → 5s 후 `SIGKILL`.
- **에러:** `claude` 미설치 → 설치 가이드 링크. timeout(기본 30분, configurable). exit !=0 → 마지막 stderr 80줄 UI 표시.

### 5.2 Prompt templates (origin 별)

세 origin 모두 응답 마지막에 patch JSON block 강제:

```
```json
{ "patches": [{ "phase": N,
                "hunks": [{ "before": "...", "after": "...", "rationale": "..." }] }] }
```
```

- **review-scan:** 13 phase 전체 list + 결정적 check 가 이미 잡은 이슈 inject(중복 회피 안내) + "찾은 모든 품질 이슈를 patch 로".
- **chat:** 현재 phase content + 대화 history + 사용자 메시지.
- **inline:** selection + 주변 컨텍스트 ±200 줄, "이 selection 만 다시 써라".

Token 최적화: review-scan 후속 호출은 변경된 phase 만 재첨부.

## 6. Persistence

```
<DATA_DIR>/                            # env-paths: macOS=~/Library/Application Support/specrail-dashboard,
                                       #            Linux=$XDG_DATA_HOME/specrail-dashboard,
                                       #            Windows=%APPDATA%/specrail-dashboard
├─ registry.json                       # Project[]
├─ projects/<projectId>/
│  ├─ sessions.sqlite                  # AiSession + messages + proposedPatches
│  ├─ patches/<pid>.json               # 큰 before/after 별 파일
│  └─ cache/{phases,issues}.json       # mtime-keyed
└─ logs/specrail-dashboard.log
```

- **JSON** (registry, cache, patches): 단순·인간 가독.
- **SQLite** (`better-sqlite3`, sessions): 대화 검색·pagination 필요.
- **마이그레이션:** 첫 0.1.0 부터 SQLite `schema_version` 테이블 + 마이그레이션 러너.
- OS path 는 `env-paths` 라이브러리로 (macOS/Linux/Windows 표준 경로 준수).

## 7. Security (확정 디폴트)

| 항목 | 디폴트 |
|------|--------|
| Bind | `127.0.0.1` only. `--host` 로만 변경 + warning + 5s 카운트다운 |
| Port | random free (`0`). `--port` 로 고정 |
| CSRF | double-submit cookie + `X-CSRF` 헤더, 모든 mutation 필수 |
| Path traversal | allowlist `<projectRoot>/docs/spec/**`, `<projectRoot>/changes/**`. `path.resolve` 후 `startsWith(root+sep)` 검증 |
| Project 등록 | `docs/spec/01-prd.md` 존재 검증 통과만 |
| Subprocess | `execa({shell:false})`, args 만 전달. shell interpolation 금지 |
| Process privilege | 사용자 권한, sudo 안내 안 함 |
| External telemetry | 없음 (opt-in 도 없음, 별 cycle 후보) |
| Update check | npm registry HEAD 1회, `--no-update-check` 로 끔 |

## 8. Test strategy

| Layer | 도구 | 목표 | 검증 |
|------|------|------|------|
| `core` 단위 | Vitest | 90%+ | frontmatter parse, check rules, patch apply, graph 계산. 100% in-memory |
| `server` 통합 | Vitest + Hono `app.request` | 80%+ | route×service. adapter mock (memfs, fake-cli, in-memory registry) |
| `web` 단위 | Vitest + RTL + MSW | 70%+ | 컴포넌트, hook, query 동작 |
| e2e | Playwright | 시나리오 8 | 실 server + 임시 git repo fixture + **mocked claude CLI** (canned JSON shell script) |
| Performance bench | `vitest bench` | regression gate | graph 500 노드 layout < 200ms, phase parse < 50ms |

**e2e must-pass scenarios:**

1. Add project → phase list 렌더 → phase 01 열기 → frontmatter 표시
2. 외부에서 phase 03 수정 → SSE 자동 갱신
3. Cross-phase check 실행 → dangling ref 등장 → 클릭 → 정의처 phase 이동
4. AI review-scan → patch stream → accept → 파일 변경 검증
5. Graph view → 노드 선택 → 1-hop filter → 우측 refs in/out
6. Inline rewrite → patch preview → reject → 원본 유지
7. Conflict: dashboard edit 중 외부 write → 저장 시 409 + 머지 선택 dialog
8. CSRF 위조 시도 → 403

## 9. 배포 / 릴리즈

- **`@specrail/dashboard`** 별 npm package. `bin: { "specrail-dashboard": "./dist/bin/specrail-dashboard.js" }`.
- **빌드 산출물:**
  - `dist/server/main.js` (esbuild bundle, externals: `better-sqlite3`, `chokidar`)
  - `dist/web/` (vite build, hashed assets)
  - Hono 가 production 에서 `dist/web/` 정적 서빙
- **CI** (GitHub Actions, 기존 specrail CI 옆):
  - lint(Biome) · typecheck · unit · integration · e2e(headless) · bench gate
  - PR 마다 `pnpm pack` artifact 업로드 (수동 검증)
  - tag push 시 npm publish (provenance attestation)
- **plugin slash command** (`packages/plugin`): `/specrail dashboard` →
  `execa('npx', ['-y', '@specrail/dashboard@^0.x', '--project', cwd])`.
  첫 실행 시 npm download(~수십초), 이후 캐시.
- **버전 정책:** 0.x semver. `packages/core` schema 호환성은 minor, dashboard·plugin 은 `^x.y` 의존.

## 10. Out of scope (v1)

다음 cycle 후보로 명시:

- DELTA workflow UI (proposal 생성·승인) — direct edit + git 대체
- 팀 공유 hosted 모드 (auth, multi-user, DB sync)
- 다중 LLM provider (Anthropic API 직접, OpenAI 등)
- bulk "apply all" 액션
- spec import/export (다른 spec 도구와 호환)
- 모바일·태블릿 (desktop 1280+ only)
- i18n (UI 한국어, 본문 mixed-script 표시만)
- 시각 디자인 시스템 — `/design-consultation` 별 cycle

## 11. Open risks & mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `claude` CLI 의 `--output-format stream-json` 스키마 변경 | 중 | 고 | 어댑터 1곳 격리, schema 변동 시 unit test로 즉시 감지. CLI version check 시 비호환 경고 |
| Patch JSON 파싱 실패 (AI 가 형식 어김) | 중 | 중 | few-shot + zod 검증, 실패 시 raw 응답 chat 에 노출 + "patch 추출 실패" 배지. fallback: 사용자가 수동 적용 |
| 큰 repo 에서 chokidar overhead | 저 | 중 | watch scope = `docs/spec/`·`changes/` 만. polling fallback 옵션 |
| SQLite WAL 파일이 `.specrail-dashboard` 와 동시 실행 충돌 | 저 | 중 | per-project lockfile, second instance 는 "이미 실행중" 안내하고 종료 |
| Plugin slash command 첫 호출의 npx 지연이 사용자에게 의문 | 중 | 저 | slash command 가 "Downloading dashboard…" progress 표시, 이후 캐시되면 즉시 |
| Multi-project state 의 user-level 위치 (`~/.specrail-dashboard/`) 가 OS 별 권장 위치와 불일치 | 저 | 저 | `env-paths` 사용 (macOS: `~/Library/Application Support/specrail-dashboard`, Linux: XDG, Windows: AppData) |

## 12. Build sequence (writing-plans 가 상세화할 윤곽)

1. **Repo monorepo 화** — pnpm workspaces, 기존 src/skills/schemas 를 `packages/plugin` 으로 이동, root build/test 스크립트 정비. Plugin 동작은 100% 보존.
2. **`packages/core` 추출** — frontmatter parse/schema, cross-phase checks, graph 계산, patch apply 를 plugin 에서 떼어내 core 로. plugin 은 core 를 import 하도록 변경. Tests green.
3. **Dashboard server skeleton** — Hono + 라우트 stub + adapters (filesystem, registry) + SSE 인프라 + CSRF + path validation. unit/integration test.
4. **Dashboard web skeleton (unstyled)** — Vite + React + Hono RPC client + React Query + 3-pane shell + project switcher + phase list + phase view (read-only).
5. **File watcher + SSE 연동** — 외부 편집 → UI 자동 갱신 검증.
6. **Cross-phase deterministic checks + issue inbox UI** — 결정적 검사만 먼저 (AI 빼고). source 라벨, accept/reject 인프라.
7. **Phase view edit mode + atomic write + conflict 처리** — 수동 edit 까지 완결.
8. **AI 통합** — claude-cli 어댑터, 3 origin prompt, patch JSON 파싱, streaming. issue list 에 ai source 카드, chat 드로어, inline rewrite floating menu.
9. **Graph view** — React Flow + ELK + filter + N-hop + 노드↔phase view 네비.
10. **`/design-consultation`** — DESIGN.md 산출 후 visual styling 입힘.
11. **e2e Playwright** — 8 시나리오 + canned-CLI 픽스처.
12. **Distribution** — `bin/specrail-dashboard.ts` + esbuild + vite production build + npm publish 인프라.
13. **Plugin slash command** — `/specrail dashboard` 추가 + 가이드 문서.

각 단계 끝에 commit·테스트 green 게이트. 단계 사이 의존성은 위 순서 그대로 (4→5→6 등).
