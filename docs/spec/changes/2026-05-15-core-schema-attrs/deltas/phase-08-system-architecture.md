---
phase: 8
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint (APPROVE)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 7 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 7 delta (OQ-7-CSA-2 marker formalization → 본 phase ARCH 등재 option)"
  - "docs/spec/08-system-architecture.md (current — ARCH-1~12, EXT-1~5)"
  - "proposal.md §6 Phase 8 + §7 plugin code 분포"
target-version: "docs/spec/08-system-architecture.md (post-merge)"
batch: "Phase 6·7·8 verifier-checkpoint batch"
---

# Phase 8 DELTA: System Architecture changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1~7 Approved/in batch.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode (re-confirmed at Phase 8) | **SCOPE EXPANSION** |
| Cognitive Patterns 활성화 | Engineering: Boring by default · Reversibility preference · Systems over heroes (새벽 3시 피곤한 사용자 위한 schema·codemod). |
| 자체 리뷰 면책 | verifier batch checkpoint 예정. |

---

## 1. Why (Phase 8 specific)

5 변경:

1. **신규 ARCH-13·14·15** — attrs migration이 plugin code 8 디렉토리(`src/markdown/`, `src/graph/`, `src/schema/`, `src/lint/`, `src/state/`, `src/spec/`, `bin/`, `schemas/`)에 분산. 3 새 container 분류로 system context 명확화.
2. **신규 EXT-6** — public schema contract (npm + GH raw URL)는 `specrail/dashboard`·third-party tool이 consume하는 *external surface*. Container outside plugin이 의존하므로 EXT 카테고리.
3. **§1 C4 L1 diagram update** — `specrail/dashboard`를 외부 consumer로 명시 (별 repo). 기존 diagram은 dashboard 미언급.
4. **ADR-CAND-13·14·15** — closed enum freezing, schema-version policy, marker family formalization 3 ADR candidate Phase 12 결정 대상으로 surface.
5. **attrs blocks 부착** — ARCH-1~12·EXT-1~5 모두 codemod contract.

---

## 2. What Changes

### 2.1 ADDED ARCH-13: Attrs Parser & Typed Edge Container

```markdown
### ARCH-13: Attrs Parser & Typed Edge Container

**Responsibility:** `<!-- specrail:attrs -->` block 파싱·YAML 디코딩·typed edge 생성. R-CSA의 data-plane.

**Interfaces:**
- `src/markdown/attrs.ts` — `parseAttrsBlocks(file)`·`AttrsBlock`·`attrsBatchParse`
- `src/graph/builder.ts` (확장) — `buildTypedEdges(attrsBlocks)` returning `TypedEdge[] {from, to, kind, sourceFile, line}`
- `src/spec/patterns.ts` (확장) — `R-[A-Z]+`·`F-R-[A-Z]+\.\d+`·`AC-R-[A-Z]+-\d+`·`FLN-\d+`·`FLE-\d+`·`PERSONA-\d+`·`SCEN-\d+`·`JNY-\d+\.\d+`·`ZN-[A-Z0-9-]+-\d+` 등록

**Dependencies:** Markdown Utilities container (frontmatter parser) · Frontmatter Schema Validator container (ID counter)
```

<!-- specrail:attrs id=ARCH-13 -->
```yaml
status: Approved
c4-level: 2
linked-r: [R-CSA]
linked-ext: [EXT-6]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.2 ADDED ARCH-14: Schema Validator Container

```markdown
### ARCH-14: Schema Validator Container

**Responsibility:** `schemas/attrs.schema.json` (JSON Schema 2020-12) + ajv compile + per-entity validation + edge-kind enum enforcement.

**Interfaces:**
- `schemas/attrs.schema.json` — public artifact (EXT-6 consumed)
- `schemas/edge-kinds.schema.json` — closed enum 8 kinds (frozen v0.1.0)
- `src/schema/validator.ts` — `validateAttrs(block)`·`validateEdgeKind(kind)`·`ajvCompile()`

**Dependencies:** Markdown Utilities · Lint Module
```

<!-- specrail:attrs id=ARCH-14 -->
```yaml
status: Approved
c4-level: 2
linked-r: [R-CSA]
linked-ext: [EXT-6]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.3 ADDED ARCH-15: Codemod Container

```markdown
### ARCH-15: Codemod Container

**Responsibility:** `specrail migrate` (idempotent rewrite + marker emission) · `specrail audit` (attrs coverage report).

**Interfaces:**
- `bin/specrail-migrate.ts` — `migrate(phase?)`·`emitReviewMarker(reason, entity)`
- `bin/specrail-audit.ts` — `auditCoverage()`·`acceptCodemodConflict(file)`
- `.specrail/migrate-report.json` — out-of-band conflict index

**Dependencies:** Attrs Parser · Schema Validator · State Machine · Lint Module
```

<!-- specrail:attrs id=ARCH-15 -->
```yaml
status: Approved
c4-level: 2
linked-r: [R-CSA]
linked-ext: [EXT-6]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.4 ADDED EXT-6: Public Schema Contract

```markdown
### EXT-6: Public Schema Contract

**Type:** publish artifact (npm + GitHub raw URL)
**Direction:** outbound (plugin이 publish, consumer가 fetch)
**Payload:** `schemas/attrs.schema.json` (JSON Schema 2020-12) · `schemas/edge-kinds.schema.json` · `schema-version` semver
**Consumers:** `specrail/dashboard` (별 repo) · third-party CI bot / IDE plugin
**Failure mode:** consumer가 stale schema fetch — `schema-version` header 미스매치 시 dashboard render side warning. plugin 측 영향 없음 (publish는 unidirectional).
**Privacy/Security:** schema는 공개 contract, 사용자 spec 내용 미포함. PII 없음.
**Resilience:** consumer가 fetch 실패해도 plugin은 정상 작동 (consumer-side concern).
```

<!-- specrail:attrs id=EXT-6 -->
```yaml
status: Approved
protocol: https-pull
failure-mode: consumer-side-cache-fallback
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.5 MODIFIED §1 C4 L1 — dashboard external consumer 추가 (additive diff)

기존 mermaid `flowchart TB` (`08-system-architecture.md:14-37`)을 **그대로 유지하고** Dashboard node + edge 한 줄 추가. 기존 labeled edge·dashed edge·`Plugin→CC` reverse edge 모두 보존 (verifier 지적 mermaid edge regression 해소):

```mermaid
flowchart TB
    Builder([Builder<br/>Persona])
    Plugin[("specrail Plugin<br/>(Claude Code skill collection)")]

    CC[/Claude Code<br/>EXT-1/]
    LLM[/LLM API<br/>EXT-2<br/>via Claude Code/]
    Git[/Git Hosting<br/>EXT-3/]
    Editor[/Editor·IDE<br/>(Markdown render)<br/>EXT-4/]
    Telem[/Telemetry endpoint<br/>EXT-5<br/>opt-in only/]
    Dashboard[/specrail/dashboard<br/>EXT-6<br/>별 repo · optional/]

    Builder -->|명령·자연어| CC
    CC -->|skill 호출| Plugin
    Plugin -->|tool call·prompt| CC
    CC -->|API| LLM
    Plugin -->|hook script| Git
    Builder -->|markdown 검토| Editor
    Editor -.read-only.- Plugin
    Plugin -.|opt-in metric|.-> Telem
    Plugin -->|publish schema| Dashboard
```

> **Additive change (verifier 지적 해소):** 본 delta는 기존 mermaid를 *대체*하지 않고 *2 line* (Dashboard node + `Plugin -->|publish schema| Dashboard` edge)만 추가. `Builder→CC` label "명령·자연어", `CC→Plugin` label "skill 호출", `Plugin→CC` reverse "tool call·prompt", `CC→LLM` not `Plugin→LLM` (Claude Code가 LLM 호출, plugin 직접 안 함 — 아키텍처 정확), `Editor-.read-only.- Plugin` dashed, `Plugin-.|opt-in metric|.-> Telem` dashed — 모두 보존.

### 2.6 MODIFIED 기존 ARCH·EXT — codemod-generated attrs (documented contract)

#### 2.6.1 ARCH-tier attrs template

```yaml
status: Approved
c4-level: <1|2|3>     # parameter
linked-r: [...]        # parameter
linked-ext: [...]      # parameter (optional)
last-modified: 2026-05-15
```

#### 2.6.2 ARCH parameter table (12 existing)

| ARCH | c4-level | linked-r | linked-ext |
|---|---|---|---|
| ARCH-1 | 1 | `[R1, R5]` | `[EXT-1]` |
| ARCH-2 | 1 | `[R2, R8]` | `[EXT-2]` |
| ARCH-3 | 1 | `[R6]` | `[EXT-3]` |
| ARCH-4 | 1 | `[R13]` | `[EXT-5]` |
| ARCH-5 | 1 | `[R7]` | `[EXT-4]` |
| ARCH-6 | 2 | `[R1]` | — |
| ARCH-7 | 2 | `[R6]` | — |
| ARCH-8 | 2 | `[R5]` | — |
| ARCH-9 | 2 | `[R8]` | — |
| ARCH-10 | 2 | `[R6]` | — |
| ARCH-11 | 2 | `[R2]` | — |
| ARCH-12 | 2 | `[R1]` | — |

#### 2.6.3 EXT-tier attrs template

```yaml
status: Approved
protocol: <kind>       # parameter
failure-mode: <prose>  # parameter
last-modified: 2026-05-15
```

#### 2.6.4 EXT parameter table (5 existing)

| EXT | protocol | failure-mode |
|---|---|---|
| EXT-1 | host (Claude Code skill) | plugin 작동 불가 (필수) |
| EXT-2 | LLM API (via CC) | 사용자가 다른 LLM 시도 (CC fallback) |
| EXT-3 | git protocol | local git 작동, push만 막힘 |
| EXT-4 | none (사용자 도구) | text editor 어떤 것이든 |
| EXT-5 | https POST | local queue 보존 + 재전송 |

### 2.7 ADDED §13 신설: ADR-CAND for Phase 12

```markdown
## 13. ADR-CAND (Phase 12 결정)

**ADR-CAND-13: Closed enum freezing policy**
attrs YAML edge kind을 v0.1.0에서 8 frozen 결정. 추가는 minor schema-version bump. 본 phase는 정책 *기록*, Phase 12가 정식 ADR. trigger: T-CSA.4 (builder typed edges) 구현 시점.

**ADR-CAND-14: Schema-version policy**
`schemas/attrs.schema.json`은 semver. v1.0 = first published schema release at plugin 0.2.0 (0.1.0 ships no schema per OQ-CSA-7). v0.5.0 ERROR cut 전까지 사용자 spec은 schema-version 미스매치 허용. Phase 11 telemetry가 schema-version metric 수집. trigger: T-CSA.13 (telemetry hook) 구현 시점.

**ADR-CAND-15: Marker family formalization**
`<!-- specrail:attrs -->`·`<!-- specrail:attrs-batch -->`·`<!-- specrail:attrs-review-required -->` 3 marker variant Phase 4 INV로 정식 등록 vs Phase 8 ARCH로 정식 등록. trigger: OQ-5-CSA-1·OQ-7-CSA-2 누적 발견 후 Phase 12 통합 결정.

```

### 2.8 MODIFIED §11 다음 phase 인풋 (append)

```markdown
**DELTA core-schema-attrs:**
- Phase 9 — NFR-CSA-* (parser perf, validator perf, codemod idempotency latency, schema fetch SLO)
- Phase 10 — TC-CSA-* (attrs parser·codemod·typed edge builder·idempotency·conflict marker test cases)
- Phase 11 — Operations: schema fetch endpoint 운영 (Phase 11 telemetry endpoint와 별개), schema-version metric
```

---

## 3. Impact (Phase 8 차원)

| 차원 | 변화 |
|---|---|
| 신규 ARCH | ARCH-13·14·15 (3) |
| 신규 EXT | EXT-6 (1) |
| ARCH attrs (기존 12) | codemod contract |
| EXT attrs (기존 5) | codemod contract |
| C4 L1 diagram | Dashboard 노드 추가 |
| 신규 ADR-CAND | 13·14·15 (Phase 12 결정 대상) |
| §11 다음 phase 인풋 | Phase 9·10·11 expectation 추가 |

---

## 4. Open Questions (Phase 8 차원)

**OQ-8-CSA-1 (Non-Blocking):** ARCH-13·14·15 분리 vs 단일 ARCH-13 "Attrs Subsystem"으로 통합? 분리하면 dependency graph 명확, 통합하면 simpler. 결정자: maintainer. 마감: T-CSA.1 implementation 시점.

**OQ-8-CSA-2 (Non-Blocking):** EXT-6 schema publish 채널 — npm package metadata embed vs separate `schemas` package vs GH raw URL? proposal §7.4가 "npm + GH raw URL" 양립으로 잠정. 결정자: maintainer + dashboard repo maintainer 협의. 마감: T-CSA.7 (publish schema) 전. (OQ-CSA-9와 dual-decision.)

---

## 5. Self-Check (Phase 8 DELTA용)

| Check | 결과 |
|---|---|
| ARCH-13·14·15 ID 충돌 검사 | ✓ `grep -E "^### ARCH-1[3-5]" docs/spec/08-system-architecture.md` empty (live ARCH-1~12만) |
| EXT-6 ID 충돌 | ✓ live EXT-1~5만 |
| ADR-CAND-13·14·15 ID 충돌 | live `08-system-architecture.md:238` "ADR-CAND-1~10" 있음 — `grep "ADR-CAND-1[1-5]"` empty 확인 |
| C4 L1 diagram update Dashboard node | ✓ §2.5 mermaid |
| dashboard 별 repo boundary 명시 | ✓ EXT-6 description "별 repo · optional" |
| attrs wrapper canonical form | ✓ `<!-- specrail:attrs id=ARCH-13 -->` ... `<!-- /specrail:attrs -->` (3 신규 ARCH + EXT-6 모두) |
| Edge kind enum 위반 | 0 (`linked-r`·`linked-ext`는 §5 schema 표 ARCH-* row optional, scalar metadata 명시) |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |
| Mode tag | SCOPE EXPANSION 단일 |
| Diagrams ≥ 2 (Phase 8 mandatory Context + Container + Sequence) | C4 L1 (§2.5) + 기존 ARCH-8~12 container detail prose (live `08-*.md:285+`) — sequence diagram 본 delta는 신설 없음 (기존 §8 Sequence Diagram 그대로). |
| Cognitive Patterns 활성화 흔적 | ✓ §0 + §1 boring-by-default (JSON Schema·YAML·HTML comment industry-standard) |

---

## 6. Lifecycle

```
Phase 8 delta: Proposed
  ↓ verifier batch checkpoint (6·7·8 종료)
Approved (batch)
  ↓
다음 batch → Phase 9·10·11 (NFR·Test·Operations)
```
