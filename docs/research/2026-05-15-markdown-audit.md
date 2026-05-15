# Markdown Structural Audit for `specrail/dashboard`

**Date:** 2026-05-15
**Author:** structural audit pass
**Question:** Is `docs/spec/*.md` structured enough today to be the data source for a product-grade dashboard (manyfast.io-class — atom/molecule design system, custom illustrations, smooth navigation between connected entities, full-plan graph overview)?
**Verdict (one line):** Partially. The ID layer is excellent (~95% machine-extractable). The *content* layer behind each ID is mostly prose, not structured fields — for a polished SaaS-style dashboard, ~40–55% of what a designer would want to render is missing, and the gap is concentrated in exactly the entity attributes you'd want to surface in cards/detail pages (status, importance, persona, journey step, KPI value, owner, last-modified, parent/child links).

This audit is intentionally position-bearing. No "could", no "might". Where I didn't verify directly, the finding is tagged "(not verified)". All file:line citations checked against the live files in `/Users/sungminoh/Development/specrail/docs/spec/` at audit time.

---

## 0. What the plugin already parses (baseline)

Before judging the markdown, I established what is *already* structurally accessible to plugin code, since the dashboard would inherit that pipeline:

- **Frontmatter:** `src/markdown/frontmatter.ts:33` — remark + remark-frontmatter, returns `{frontmatter, body, hasFrontmatter}`. Strips leading HTML comments. (confidence: 10/10 — read the file.)
- **Canonical ID regex:** `src/spec/patterns.ts:23-36` — `R{n} | F{n}.{m} | S{n}.{m}.{k} | ENT-* | INV-N | NFR-Domain-N | ARCH-N | EXT-N | OPS-N | ADR-N | RISK-N | TC-N | EDGE-N | AC-R{n}-{m} | T{n}.{m}`. (confidence: 10/10.)
- **User-namespace IDs:** `src/spec/patterns.ts:49` — `[A-Z][A-Z0-9]+-\d+(?:[-.]\d+)*` catches `OQ-1-2`, `PAIN-base`, `RB-3`, `KPI-5`, `P-CC-1`, `D-1`, `RISK-CAND-*`, `ADR-CAND-*`. Anything that fits the shape passes. HTTP verbs / status are explicitly excluded (`RESERVED_ID_PREFIXES`). (confidence: 10/10.)
- **Definition forms recognized by `src/graph/builder.ts`:**
  - Heading form: `## R1: title` / `### ENT-Foo (anything)` / bare `### ENT-Project` — line 23, 293.
  - Bold-prefix form: `- **AC-R{n}-{m}**` followed by `:` and `**OPS-{n} — Deploy 방식**` followed by `:` — line 310-339, regex line 315.
  - `<!-- specrail:deftable -->` HTML-comment marker + tables with `| ... ID | ... |` header (line 138-163).
  - `<!-- specrail:def-list -->` for bare-prefix bullet lists like `- T5.1 hook install ...` (line 66, 349-371).
- **Citation extraction:** AST walk over text + inlineCode nodes, skipping `code`, `yaml`, definition-heading subtree, `<!-- specrail:ignore-* -->` ranges. Builds `GraphEdge[] {from, to, citedAt:{file,line}}`. (`builder.ts:412-485`.)
- **Output:** `DependencyGraph {nodes, edges, danglingCitations, definedIds, illustrativeIds, initialized}` — `builder.ts:80-98`.

Implication: a dashboard can already, with zero new authoring, extract every ID, every cross-reference edge, and which phase file defines each ID. That is exactly the data needed for a graph-overview view. Confidence: 10/10.

What it *cannot* extract is the structured properties of each entity (e.g. "what is R1's importance?", "what status?", "which persona owns it?", "which AC belongs to it?"). All of those live as prose in markdown tables, headings, or running text — never in frontmatter, never in machine-keyed columns. That gap is the spine of this audit.

---

## 1. Inventory per phase

Every spec file has frontmatter limited to `phase: N` and `status: Approved` (confirmed by `head -5 *.md`, all 13 files identical to that 2-key shape). No other frontmatter keys exist. Section structure varies by phase. Verified directly.

### Phase 1 — `01-prd.md` (147 lines)

- Frontmatter: `phase: 1, status: Approved` only.
- Structured artifacts:
  - **KPI table** at lines 102-108 — 5 rows, columns `지표 ID | 지표 | 단위 | 목표 | 측정 시점`. ID column = `KPI-1..KPI-4, KPI-6`. Header has "지표 ID" so `getDefTableColumns` (`builder.ts:138`) will match it. ✓ machine-extractable as defs.
  - **Assumptions table** lines 114-119 — `A1, A2, A4, A5`. Header is `ID` so detection works. ✓
  - **Open Questions table** lines 125-130 — `OQ-1-1..1-5`. Header `Q ID` matches `HEADER_ID_TOKEN_RE` (`builder.ts:54`). ✓
  - **Scenario IDs** S1/S2/S3 — prose only (line 56-58). No table. S1/S2/S3 are *not* in `ID_PATTERN_SOURCE` as bare tokens; they only match as part of `[RFS]\d+` so `S1`, `S2`, `S3` parse as Specification IDs but require 3-part shape — and `parseSpecId` (`src/spec/id.ts:33`) will *reject* them as INV-1 violations because S-tier needs 3 dot-parts. Net: scenario tags are silently invisible to the graph. (confidence: 10/10 — traced the regex.)
  - **Personas** — prose only. No persona ID family exists. "Builder" is named once line 45; no `PERSONA-1` token.
  - **Non-Goals** — prose bullets, no ID.
- Tables: 3. Mermaid: 0.

### Phase 2 — `02-personas-journey.md` (192 lines)

- Frontmatter: same 2 keys.
- Structured artifacts:
  - **Edge personas** — heading form `### Edge-1: ...` line 47-55. `Edge-1` *does* match `USER_NAMESPACE_PATTERN` (`Edge-1`, capital + digit + dash + digit) — yes, this will be picked up. ✓
  - **PAIN catalog** — table lines 154-164, 10 rows, columns `Pain ID | 설명 | 빈도 | 영향도 | 우선 | 어느 시나리오`. Header has "Pain ID" so column-0 def-extraction triggers (line 138 of builder). `PAIN-1` etc. match user-namespace. ✓
  - **Journey step tables** lines 67-84, 112-123, 136-141 — *no ID column*. Each row is just `# | Step | 행동 | 생각 | 감정 | Pain ID`. The numeric first column is `1, 2, 3` — bare integers, *not* valid IDs. So journey steps have no machine-addressable handle. Pain ID column is extractable as citation (not def). Cited Pain → step row mapping is **not recoverable** without an authored convention. (confidence: 10/10.)
  - **Emotion Curve** — ASCII art (line 87-98). Decorative, not structured.
  - **Open Questions** — OQ-2-1..2-3, table.
- Tables: 5 with IDs (Routine, Pain, S1/S2/S3 step tables, OQ). Mermaid: 0.

### Phase 3 — `03-features.md` (268 lines)

- Frontmatter: same 2 keys.
- Structured artifacts:
  - **R/F/S headings** — `## R1: ...` (line 20, 49, 71, 85, 105, 127, 149, 169, 191). 8 active R + 1 deferred R (R3) + sub-headings for F (e.g. `### F1.1: Frontmatter schema per phase` at line 35).
  - **AC bullets** — `- **AC-R{n}-{m}:** GIVEN ... WHEN ... THEN ...` form (23 lines confirmed via `grep -c "^- \*\*AC-R"`). All 23 contain GIVEN+WHEN+THEN. Bold-prefix def works (`builder.ts:310-339`). ✓
  - **Cross-ref fields**: `**해결하는 PAIN:**` (free prose, line 24/53/89/110/131/154/192), `**해결하는 시나리오:**`, `**Importance:**`, `**Status:**`. These are *not* tables; they're inline labels in bold-colon paragraph form. The PAIN/scenario cross-refs would extract as edges by the regex but as *prose tokens*, not as relational fields. No machine-keyed `feature.painIds: ["PAIN-1", "PAIN-2"]` exists. (confidence: 10/10.)
  - **Importance × Status matrix** lines 212-219 — table, but cells contain prose lists like `8 (R1·R2·R4·R5·R6·R7·R8·R13)`. Counts, not key-value. Dashboard cannot pivot this easily.
  - **Pain → Spec mapping** table lines 224-234 — explicit mapping, cells contain ID lists. Extractable as edges if you parse cell-by-cell (no column called "ID" so deftable triggers won't fire, but ID-pattern regex over cell text works).
  - **EXPANSION 후보** table lines 240-247 — `e1..e6` IDs in first column with header `후보 ID`. Header matches.
- Tables: 6. Mermaid: 0.

### Phase 4 — `04-domain-model.md` (472 lines)

- Best-structured phase. Frontmatter still 2 keys.
- Structured artifacts:
  - **ENT-* headings** — 11 entity headings (`### ENT-Project` line 14, ..., `### ENT-TelemetryConsent` line 178). Heading form, all parsed. ✓
  - **Attribute tables** per entity — `| Name | Type | Required | Source | 설명 |` (e.g. line 17-22). These are *not* def-tables (no "ID" header), but they declare the entity's schema in machine-readable form — you can scrape them for "ENT-Project has fields {id, rootPath, createdAt, name}". No current code does this.
  - **INV catalog** — heading-form `### INV-1: ...` (line 347, 354, 360, 367, 374, 379, 386, 391, 397, 403). All 10 invariants extractable. ✓
  - **Domain Types Glossary** lines 411-444 — table `| Domain Type | 정의 |`. ~30 type names. No "ID" header, not parsed as defs by current code. Glossary tokens like `ProjectId`, `PhaseId` etc. are *not* in any ID pattern — they're TypeScript-style identifiers, machine-readable only if you scrape this specific table.
  - **State machines** — 6 mermaid `stateDiagram-v2` blocks (line 259, 285, 296, 309, 322, 336). Confirmed by grep: 7 mermaid blocks. Rendered visually, *opaque* to dashboard data layer unless you parse Mermaid AST.
  - **ER diagram** lines 193-253 — mermaid `erDiagram` with declarative entity attributes. Same — visual only.
- Tables: 13 attribute tables + 1 glossary + 1 OQ. Mermaid: 7.

### Phase 5 — `05-user-flow.md` (377 lines)

- Frontmatter: 2 keys.
- Structured artifacts:
  - **Section IDs** — table line 14-20, `SEC-1..SEC-4, SEC-6`. Header `Section ID`. ✓ (but `SEC-5` is a typo'd illustrative stub at `12-adr-risks.md:1005` — `### SEC-5: illustrative — NFR-SEC-N 단축 표기 단편`; the verifier silently accepts it because it sits inside `specrail:ignore-start`.)
  - **Node IDs** — 76 rows across `### SEC-N: ...` blocks (counted: `grep -c "^| N-" 05-user-flow.md` → 76). Header `Node ID`. ✓ Columns: `Node ID | Type | 이름 | Spec | SM 영향`. Cross-ref to Spec IDs in `Spec` column.
  - **Edge IDs** — 50 rows in §3 (counted), columns `Edge ID | From | To | 조건`. `E-1` is a 2-char user-namespace match — wait, `[A-Z][A-Z0-9]+-\d+` requires 2+ leading uppercase chars; `E-1` is 1 char. So `E-1..E-71` *do not match* `USER_NAMESPACE_PATTERN`. (confidence: 10/10 — read the regex.) **Edges are invisible to the graph builder.** This is a real gap.
  - **Section→Node table** with `SM 영향` column has prose like `SM-Phase: Empty → Draft` — extractable only by ad-hoc string parsing.
  - **Mermaid** — 4 blocks (graph LR × 3 + sequenceDiagram × 1). Visual, opaque.
- Tables: 7. Mermaid: 4.

### Phase 6 — `06-information-architecture.md` (193 lines)

- Frontmatter: 2 keys.
- Structured artifacts:
  - **P-CC-* catalog** — table line 22-36, 15 rows. Header `Page ID | 이름 | Phase 5 Node | Trigger / 위치 | 깊이`. ID `P-CC-1` matches user-namespace. ✓. `Phase 5 Node` column contains `N-002` etc. — extractable as cited edges.
  - **Page Tree** — mermaid `graph TD` line 53-69.
  - **Navigation** — prose tables, command→page mapping.
  - **URL conventions** — file system path templates lines 144-156. Static prose.
- Tables: 7. Mermaid: 1.

### Phase 7 — `07-wireframe.md` (182 lines)

- Frontmatter: 2 keys.
- Structured artifacts:
  - Single wireframe def: `# W-CC-pattern: Claude Code 응답 표준 zone` line 16. `W-CC-pattern` matches user-namespace pattern (since `pattern` isn't a digit-tail it actually does NOT match — `USER_NAMESPACE_PATTERN` ends in `\d+(?:[-.]\d+)*` requiring digits after the dash; `pattern` is non-numeric). **`W-CC-pattern` is NOT machine-extractable as an ID.** (confidence: 10/10.)
  - **Zones** — Z1..Z6 referenced in ASCII art line 30-60. Z1..Z6 are bare-prefix headers in the box-drawing block; they are not headings and not bullets — no def extraction possible.
  - **Element catalog** — table line 67-77, `E-CC-1..E-CC-8`. `E-CC-1` doesn't match `USER_NAMESPACE_PATTERN` either (only 1 leading uppercase char on `E`). **`E-CC-N` IDs are invisible.** Same root cause as Phase 5 `E-N`.
  - **Component States** — bold-prefix headings `### State 1: ...` (line 80, 84, 88, 96, 99). `State` doesn't match.
  - **Interactions** — table line 110-115, no ID column.
- Tables: 4. Mermaid: 0.

### Phase 8 — `08-system-architecture.md` (339 lines)

- Frontmatter: 2 keys.
- Structured artifacts:
  - **C4 L1 / L2** — 2 mermaid `flowchart TB` blocks (line 16, 41).
  - **Container Catalog** table line 84-94 — `ARCH-1..ARCH-7, ARCH-spec, ARCH-git`. Header `ID`. ✓ But `ARCH-spec` and `ARCH-git` don't match canonical `ARCH-\d+`, they match user-namespace? — `ARCH-spec` is `ARCH-` + lowercase, regex requires `\d+`. **`ARCH-spec` and `ARCH-git` are silently invisible.** (confidence: 9/10 — pattern requires `\d+`.) Visual table renders fine; data layer misses them.
  - **External Integrations** table line 98-104 — `EXT-1..EXT-5`. ✓
  - **ADR-CAND** table line 240-251 — `ADR-CAND-1..10`. `ADR-CAND-1` is matched by user-namespace (compound tail `-1`). ✓
  - **Sequence diagrams** — 2 mermaid blocks (line 170, 209).
  - **ARCH-8..ARCH-12** at line 285+ — heading form `### ARCH-8: ...` ✓
- Tables: 11. Mermaid: 4.

### Phase 9 — `09-non-functional-requirements.md` (289 lines)

- Frontmatter: 2 keys.
- Structured artifacts:
  - 7 NFR domain sections, each with table of `NFR-PERF-1`, `NFR-SCAL-2`, `NFR-AVAIL-6`, `NFR-SEC-2..13` + `NFR-SEC-COMP-1/2`, `NFR-PRIV-3..5`, `NFR-A11Y-3`, `NFR-I18N-1/4/5`. All match canonical `NFR-Domain-N`. ✓
  - Many tables wrapped in `<!-- specrail:ignore-start --> ... <!-- specrail:ignore-end -->` to mark out-of-scope NFRs (e.g. line 27-36, 52-61, 75-89, 110-118, 123-152, etc.). Verifier matrix excludes these. Dashboard would have to honor the same convention or display them with a "deferred" badge.
  - **Header rows** use `ID` so def-extraction triggers. ✓
  - **NFR ↔ ARCH** mapping table line 240-254 — explicit edges.
  - **KPI ↔ NFR** mapping line 258-265 — explicit edges.
- Tables: 18. Mermaid: 0.

### Phase 10 — `10-test-strategy.md` (233 lines)

- Frontmatter: 2 keys.
- Structured artifacts:
  - **AC ↔ TC** mapping table line 38-62, `TC-1..TC-23`. Header `AC ID | TC ID | TC 이름 | Layer`. Two ID columns — `getDefTableColumns` returns both as def columns (`builder.ts:138-163` matches every header with "ID"). ✓ But: row has `TC-63 (NFR-SEC-12)` — `CELL_DEF_RE` (`builder.ts:43-45`) allows annotation in parens so `TC-63` extracts. ✓
  - **INV ↔ TC** mapping line 67-77, `TC-30..38`. ✓
  - **EDGE catalog** — 5 tables grouped by category, `EDGE-1..EDGE-25`. All canonical. ✓
  - **Perf test scenarios** line 156-164, TC-70..77.
- Tables: 12. Mermaid: 0.

### Phase 11 — `11-operations.md` (240 lines)

- Frontmatter: 2 keys.
- Structured artifacts:
  - **OPS-1..OPS-21** — mix of bold-prefix paragraph definitions (`**OPS-1 — Deploy 방식:** ...` line 31, `**OPS-2 — Hook deploy:** ...` line 64, etc.) and table rows annotated with `<!-- specrail:deftable -->` (line 149, 166, 209). Bold-prefix is handled by `builder.ts:310-339`. ✓
  - **RB-1..RB-8** runbook table line 209-219, deftable marker. ✓
  - **Cost model** table line 196-203 — no IDs.
  - **OPS deploy sequence diagram** line 33-51 — 1 mermaid.
- Tables: 8. Mermaid: 1.

### Phase 12 — `12-adr-risks.md` (1016 lines, longest)

- Frontmatter: 2 keys.
- Structured artifacts:
  - **ADR-1..ADR-11** — 11 ADR headings (confirmed by `grep -nE "^### ADR-"`, lines 20, 76, 136, 197, 257, 321, 405, 477, 547, 618, 696). Each ADR has sub-headings: `#### Context`, `#### Decision`, `#### Alternatives Considered`, `##### 옵션 A (선택됨): ...`, `##### 옵션 B (거절됨): ...`, `#### Consequences`, `#### Trigger to Re-evaluate`, `#### References`. The *prose* inside each section is unstructured.
  - **Innovation token** label `**Innovation token:** No` / `**Innovation token:** Yes` is bold-prefix paragraph form but with bold:**colon plus value** — `tryBoldPrefixDef` matches if the bold text validates as a spec ID; `Innovation` doesn't, so it's silently ignored. Tag is **prose only**, not extractable as a structured field.
  - **Status / Date / Trigger** sub-fields per ADR are bold-prefix prose. Same problem.
  - **Alternatives Considered** is `##### 옵션 A` headings — no ID; the *content* of each alternative is prose.
  - **Risk Matrix** ASCII art line 779-791. Decorative.
  - **Risk Table** line 795-806, 10 rows. Header `| ID | 위험 | Likelihood | Impact | LxI | Owner | Monitoring | Mitigation |`. ID col gives `RISK-1..RISK-10`. ✓ Likelihood/Impact are prose cells (`High`, `Medium`, ...), not enum-typed.
  - **Open Questions consolidated** — 3 tables (Blocking, Resolved by ADRs, Non-blocking). Blocking table line 824-829 has `ID | 질문 | Source phase | 결정자 | 마감 | 상태`. "상태" column carries prose like `**Resolved** — ...`. State extraction requires regex on the cell, not a clean enum.
  - **Innovation Tokens** table line 896-900 — first col `1/3, 2/3, 3/3`. Doesn't match any ID pattern; visible as prose only.
  - **Illustrative ID stubs** appendix line 988-1014 — wrapped in `<!-- specrail:ignore-start -->`. 14 stubs (`S1.2.3`, `S1.1.1`, `S99.1.1`, `S99.99.99`, `F3.1`, `F3.5`, `R0`, `R10`, `KPI-5`, `AC-R3-1`, `ENT-Foo`, `SEC-5`, `T2.5`, `US-11.2`). Registered as `illustrativeIds` set, excluded from verifier matrix.
- Tables: 73 rows. Mermaid: 0.

### Phase 13 — `13-implementation-plan.md` (1142 lines, longest body)

- Frontmatter: 2 keys.
- Structured artifacts:
  - **T0.1..T4.5** task IDs — many forms: `#### T0.1: ...` headings (canonical), `**T2.5a manifest** / **T2.5b 13 SKILL.md content**` letter suffixes (T2.5a is bare-prefix; matches `T\d+\.\d+` but `T2.5a` has trailing letter so it actually does NOT match canonical `T\d+\.\d+`. confidence 8/10).
  - **Dependency Graph** mermaid block line 42-93 — declares M0/F1.1/etc. node IDs. Visual.
  - **MVP table** line 100-103 — scenarios × milestones.
  - **Milestones table** line 109-115 — M0..M4 + accumulated time.
  - **Spec → Task Coverage** table line 825-862 — `Spec ID | Task | Layer | TC`. Header `Spec ID`. ✓ Cells contain dotted task lists like `T1.1·1.2·1.3` (using middle-dot separator) — *this will not parse as a list of tasks*, only `T1.1` will match canonical pattern; `·1.2` is whitespace + `1.2` (no leading `T`). **Multi-task cells with middle-dot are mostly invisible.** This is a high-impact extraction loss for the dashboard's task-coverage view.
  - **INV → Task** line 869-879, **Risk → Task** line 884-894 — same issue.
  - **Open Questions** line 914-919 — table.
  - **Atomic Task body** — each canonical task has 5 sub-checkboxes (`Step 1: Failing test`, `Step 2: Verify fails`, `Step 3: Minimal implementation`, `Step 4: Verify passes`, `Step 5: Commit`). Bullet text — *not* tagged as structured fields. Verifying that "T0.1 has all 5 steps complete" requires custom regex.
  - **Condensed tasks** (line 290+ T0.4, T0.5, T0.6, T0.7, T0.8, T0.9) collapse the 5 steps into a single prose paragraph — heterogeneous shape.
  - **Post-M0..M11 cycle additions** (line 1058-1142) — `### M3 graph foundation`, `### M5 wire-up integration` etc. Mix of bullets and tasks. Not in original 13-phase canonical milestones.
- Tables: ~20. Mermaid: 1.

---

## 2. ID & cross-ref machine-extractability

### Per-family verdict

| Family | Definition extractability | Reference extractability | % of refs that are explicit (table cell or frontmatter list) vs free prose | Confidence |
|---|---|---|---|---|
| `R{n}` | Full (heading) | Full (regex) | ~70% prose / 30% table cell | 10/10 |
| `F{n}.{m}` | Full (heading) | Full (regex) | ~85% prose / 15% table cell | 10/10 |
| `S{n}.{m}.{k}` | Full (heading) when used; 13-phase dogfood uses no S-tier IDs in practice | Full (regex) | mostly absent in this dogfood | 10/10 |
| `AC-R{n}-{m}` | Full (bold-prefix bullet) | Full (regex) | ~5% in tables / 95% inline prose | 10/10 |
| `ENT-Name` | Full (heading) | Full (regex) | ~40% attribute tables / 60% prose | 10/10 |
| `INV-N` | Full (heading) | Full (regex) | ~30% mapping tables / 70% prose | 10/10 |
| `NFR-Domain-N` | Full (`ID` column header table) | Full (regex) | ~95% table cell | 10/10 |
| `ARCH-N` | Full (table or heading) | Full (regex) | ~80% table | 10/10 |
| `ARCH-spec`, `ARCH-git` | **None** — regex requires `\d+` tail | None | — | 10/10 (read pattern) |
| `EXT-N` | Full (table) | Full (regex) | ~95% table | 10/10 |
| `OPS-N` | Full (bold-prefix or deftable) | Full (regex) | ~60% deftable / 40% prose | 10/10 |
| `RB-N` | Full (deftable) | Full (regex) | ~95% deftable | 10/10 |
| `ADR-N` | Full (heading) | Full (regex) | ~50% table / 50% prose | 10/10 |
| `ADR-CAND-N` | Full (table) | Full (regex compound tail) | ~70% table | 9/10 |
| `RISK-N` | Full (table) | Full (regex) | ~95% table | 10/10 |
| `TC-N` | Full (table; annotation `(NFR-...)` tolerated by `CELL_DEF_RE`) | Full (regex) | ~98% table | 10/10 |
| `EDGE-N` | Full (table) | Full (regex) | ~99% table | 10/10 |
| `T{n}.{m}` | Full (heading or def-list) | Partial — middle-dot lists `T1.1·1.2·1.3` only extract first token | ~40% inline | 9/10 |
| `KPI-N` | Full (table, `지표 ID` header matches `HEADER_ID_TOKEN_RE`) | Full | ~50% table / 50% prose | 10/10 |
| `PAIN-N`, `PAIN-base`, `PAIN-fundamental`, `PAIN-DELTA-scope` | Full (table) | Full (regex) | ~80% table | 10/10 |
| `OQ-N-M` | Full (table) | Full (regex, compound-tail) | ~99% table | 10/10 |
| `P-CC-N` | Full (table) | Full (regex) | ~99% table | 10/10 |
| `SEC-N` | Full (table) | Full (regex) | ~99% table | 10/10 |
| `Edge-1..3` | Full (heading; user-namespace `[A-Z][A-Z0-9]+-\d+` matches `EDGE` 4-char prefix — wait, `Edge` has lowercase `dge`. Pattern requires uppercase after first char.) | **None** — regex requires `[A-Z][A-Z0-9]+`; `Edge` has lowercase `dge` so it does NOT match | — | 10/10 (re-checked — `Edge-1` will NOT match) |
| `E-N` (Phase 5 edges) | **None** — pattern needs 2+ leading uppercase | None | — | 10/10 |
| `E-CC-N` (Phase 7 elements) | **None** — same | None | — | 10/10 |
| `N-N` (Phase 5 nodes) | **None** — same | None | — | 10/10 |
| `W-CC-pattern` | **None** — requires `\d+` tail | None | — | 10/10 |
| `Z1..Z6` | **None** | None | — | 10/10 |
| `D-N` (delta proposal decisions) | **None** — single uppercase char | None | — | 10/10 |
| Personas (Builder) | **None** — no ID family exists | None | — | 10/10 |
| Scenarios `S1, S2, S3` (Greenfield/DELTA/Refactor) | None — collides with Specification tier syntax which requires 3 dot-parts; bare `S1` is INV-1 violation if parsed | Cited freely as prose | — | 10/10 |
| State machine names `SM-Phase-Lifecycle`, `SM-Change-Lifecycle`, etc. | **None** — heading form `### SM-Phase-Lifecycle` would match user-namespace IFF tail is digits; `Phase-Lifecycle` is not digits | None | — | 10/10 |
| State enum values `Empty`, `Draft`, `Approved`, `Proposed`, `Reviewed`, `Implementing`, `Done`, `Blocked`, `Failed`, `Passed`, `Archived`, `NotAsked`, `OptedIn`, `OptedOut` | **None** — bare prose tokens | None | — | 10/10 |
| Pain → Spec / NFR → ARCH / KPI → NFR / AC → TC / INV → TC / Spec → Task / Risk → Task **mapping tables** | Defs already counted | All refs in these tables are extractable as ID-pattern matches over cell text but **the relation type is lost** — graph builder records every edge as anonymous "cites", not as `solves`, `tests`, `mitigates`, `covers`, `inherits` etc. | — | 10/10 |

### Quantitative summary

I estimate total distinct IDs in the dogfood spec at roughly:

| Bucket | Count (approx) |
|---|---|
| Defined IDs extractable today | ~280 (Spec 30 + ENT 11 + INV 10 + NFR 25 + ARCH 12 + EXT 5 + OPS 21 + RB 8 + ADR 11 + RISK 10 + TC 60+ + EDGE 25 + AC 23 + KPI 5 + PAIN 10 + ADR-CAND 10 + OQ 30+ + P-CC 15 + SEC 5 + tasks 50+) |
| Defined "entities" that are *not* IDs but should be navigable (steps, edges, zones, elements, personas, scenarios, state-machines, state-values) | ~150-200 (Phase 5 nodes 76 + Phase 5 edges 50 + Phase 7 elements 8 + zones 6 + state machines 6 + state values ~25 + persona 4 + scenario 3) |
| % of total navigation surface that is currently machine-addressable | **~60%** |
| % of cross-refs that have explicit relation type (vs anonymous citation) | **~0%** — every edge in the dependency graph is type=`cites` because `GraphEdge` has no `type` field at the source-of-truth level (`ENT-DependencyGraph` claims `type: ReferenceType` in `04-domain-model.md:97` but `src/graph/builder.ts:74-78` ships only `{from, to, citedAt}` — the type field is documented but unimplemented; confidence 10/10, read both files) |

The single biggest fact: **about 40% of the entities a dashboard would want to render as clickable nodes have no ID at all today, and 0% of the edges carry typed relations.**

---

## 3. Dashboard data requirements (first-principles)

I list each view a product-grade dashboard needs, and map current support.

### 3.1 Phase overview cards (status, KPI roll-up, last-modified)

| Data point | Today | Gap |
|---|---|---|
| Phase number | Frontmatter `phase: N` ✓ | — |
| Phase name | First H1 of file ✓ (e.g. `# PRD: specrail`) | Not in frontmatter; must parse H1 |
| Phase status | Frontmatter `status: Approved` ✓ | Only this one binary; no `Draft`/`Empty` differentiation per file |
| Last-modified | git log (not in markdown) | git is fine for dashboard, but no "last-edited-by" since this is single-user |
| Definitions count per phase | Counted from graph nodes ✓ | — |
| KPI value | Phase 1 KPI table has target value but no current value | No `current` column anywhere |
| Mode / Date | Bold-prefix prose `**Mode:** HOLD SCOPE` (line 8 of each file) | Not in frontmatter; bold-prefix tryBoldPrefixDef rejects `Mode` because not a valid spec ID |
| Inputs | `**Inputs:** PRD §3, §5, ...` (line 9-10) — prose | Cited section anchors are prose-only; no machine-keyed `inputs: ["01-prd#section-3"]` |
| Approval timestamp | Not recorded | gap |
| Inline status badges (Draft/Approved/Deferred) per Spec | Bold-prefix `**Status:** Approved` per R section — bold-prefix def rejects `Status` because not a spec ID | gap |

**Support level: Partial.** Phase cards renderable but lacking everything beyond phase id, name, file-level status.

### 3.2 Feature catalog with persona/journey linkage

| Data point | Today | Gap |
|---|---|---|
| Feature ID, name | `## R{n}: ...` heading ✓ | — |
| Description | First paragraph after `**Description:**` — prose | Not frontmattered |
| Importance | `**Importance:** P0` — prose | gap |
| Status (per Spec) | `**Status:** Approved` — prose | gap |
| Linked Personas | `**해결하는 PAIN:** PAIN-1, PAIN-2` — prose, no Persona ID exists | **No Persona ID family** |
| Linked Scenarios | `**해결하는 시나리오:** S1, S2` — prose | `S1/S2/S3` collides with S-tier Spec syntax |
| Linked Journey steps | Persona file has step tables with no IDs | **Steps have no IDs** |
| Linked Wireframe zones | No edge from R to Z1..Z6 since zones have no IDs | gap |
| Linked Tests (TC) | Phase 13 `Spec → Task Coverage` table has `Spec ID | Task | Layer | TC` ✓ but middle-dot lists in Task col break extraction | partial |
| AC list | `- **AC-R{n}-{m}:** GIVEN ... WHEN ... THEN ...` ✓ | given/when/then are one inline string, not 3 fields |

**Support level: Partial.** Feature catalog cards renderable; bidirectional persona linkage is largely **None** because personas/scenarios are not IDs.

### 3.3 User flow graph with clickable nodes per step

| Data point | Today | Gap |
|---|---|---|
| Node ID, type, name | `| N-001 | 시작 | ... |` ✓ but `N-001` doesn't match graph extractor regex | **All 76 nodes invisible to graph** |
| Edge ID, from, to | 50 rows; `E-N` doesn't match | **All 50 edges invisible** |
| Journey step number → Node mapping | Persona file has steps `1..14` and User Flow has `N-001..N-051`; no explicit mapping | gap |
| Section grouping (SEC-N) | `| Node ID | Type ... |` tables nested under `### SEC-N: ...` heading | extractable only by AST proximity, not by explicit `section: SEC-2` field |
| State machine transitions per node | `SM 영향` column has prose like `SM-Phase: Empty → Draft` | extractable via regex but state-machine IDs are not formal IDs |
| Mermaid graph for visual fallback | 4 mermaid blocks line 158-291 | visual only |

**Support level: None to Partial.** The user-flow view is the *most product-grade* visualization a dashboard would offer, and it is the *least* machine-extractable phase today. This is the single highest-impact gap.

### 3.4 Wireframe viewer with zone hotspots

| Data point | Today | Gap |
|---|---|---|
| Wireframe ID | `W-CC-pattern` — non-numeric tail, **does not match any ID pattern** | gap |
| Zone IDs | `Z1..Z6` inside ASCII box-drawing — not in tables, not in headings | gap |
| Element IDs (E-CC-N) | Table line 67-77 — single uppercase prefix doesn't match user-namespace regex | gap |
| Element source spec | `| E-CC-1 | Header | ... | ENT-Phase.id, .name |` last column is ENT path — extractable as regex but the dotted attribute path is informal | partial |
| Component states (State 1..5) | `### State 1: ...` headings — not IDs | gap |
| Hotspot bounding boxes / coordinates | ASCII art only | **fundamental gap** — no layout coordinates anywhere |

**Support level: None.** A wireframe viewer with click-through hotspots is currently unbuildable from the markdown. ASCII text wireframes have no geometry.

### 3.5 Cross-ref network graph (whole plan as nodes/edges)

| Data point | Today | Gap |
|---|---|---|
| Nodes | `definedIds` set from graph builder ✓ ~280 nodes | missing ~150 non-ID entities |
| Edges | `edges` array ✓ | edges are anonymous (no `type`); plan declares 5+ relation types (`uses`, `extends`, `implements`, `blocks`, `solves`, `tests`, `covers`, `mitigates`) but graph builder records only `cites` |
| Source-of-truth file/line per node | `definedAt: {file, line}` ✓ | — |
| Source-of-truth file/line per edge | `citedAt: {file, line}` ✓ | — |
| Phase grouping | `phaseId` ✓ | — |
| Cluster hints (which IDs belong together: R+F+S tree, NFR-Domain, ADR by token) | Implicit (prefix string parsing) | not declared |
| Edge weights (how strongly two entities couple) | None | gap |

**Support level: Full for raw nodes/edges, None for typed relations.** This is the area where today's data is *surprisingly close* — extracting `{from, to}` with file:line for ~700+ edges is already possible. The dashboard's graph view is essentially shippable today minus the relation-type coloring.

### 3.6 Diff view for DELTA proposals

| Data point | Today | Gap |
|---|---|---|
| Proposal frontmatter | `changes/.../proposal.md` HAS richer frontmatter (verified `proposal.md:1-11`): `type, capability, date, status, deferred-date, deferred-reason, mode, affected-phases, reverses` | This is the **only** place in the repo with non-trivial frontmatter — proves the authors know how to do it; just haven't applied to spec files |
| ADDED/MODIFIED/REMOVED lists per affected phase | DELTA `deltas/{NN-*}-delta.md` convention from `05-user-flow.md:213-261` (sequence diagram) | The delta files themselves are markdown — extract via header convention |
| Affected-phases list | Frontmatter `affected-phases: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13]` ✓ | **Only in proposal**, not in spec |
| Approval state | `status: Deferred` ✓ | — |

**Support level: Full for proposal-level**, **None for inline delta highlighting** in the affected phase files (no `<!-- delta:added -->` markers exist).

### 3.7 Risk / NFR / ADR detail pages with bidirectional traceability

| Data point | Today | Gap |
|---|---|---|
| ADR title, status, date, context | Heading + bold-prefix prose; status="Accepted" / date="2026-05-12" — prose, not frontmatter | gap |
| ADR alternatives | `##### 옵션 A (선택됨): ...` headings — no ID per option | gap |
| ADR consequences (positive / negative / impact) | Sub-headings + bullets — prose | gap |
| ADR references | `#### References` section — markdown bullets pointing to "Phase 8 §9 ADR-CAND-1" | section anchors are prose; no machine-keyed `refs: ["08-system-architecture#sec-9-adr-cand-1"]` |
| ADR `Innovation token: Yes/No` | Bold-prefix prose | gap (can be regexed) |
| Risk Likelihood / Impact / Owner | Table cells with prose values (`High`, `Medium`, `maintainer`) ✓ | extractable but informal enum |
| Risk Mitigation references to OPS / RB / NFR | Prose cell with multiple IDs ✓ via regex | typed relations missing |
| Bidirectional view: "this risk is mitigated by which OPS, which TC, which Task" | Risk → Task mapping in `13-implementation-plan.md:884-894` ✓ | edges work, but inverse (TC → Risks it covers) requires graph traversal — feasible |

**Support level: Partial.** Detail pages renderable from prose extraction; clean structured fields missing.

### 3.8 Search / filter by any entity attribute

| Filter | Today | Gap |
|---|---|---|
| Search by ID | Trivial via `definedIds` ✓ | — |
| Filter by phase | `phaseId` per node ✓ | — |
| Filter by status (Approved/Draft/Implementing/Done/Deferred) | **Not in structured form** — only phase-level status is in frontmatter; per-spec status is bold-prefix prose | gap |
| Filter by importance (P0/P1/P2/P3) | Same — bold-prefix prose | gap |
| Filter by persona | No persona IDs exist | **fundamental gap** |
| Filter by scenario | S1/S2/S3 collide with S-tier syntax | gap |
| Filter by milestone (M0-M4) | Mentioned only in heading `### M0: Infra + Spike` and prose; M0..M4 don't match any ID pattern | gap |
| Full-text search in body | trivially feasible | — |

**Support level: Partial.** ID-based search works. Attribute-based filters require either frontmatter extension or per-entity sidecars.

---

## 4. Gap matrix

| Phase | Required dashboard feature | Current support | Concrete fix |
|---|---|---|---|
| 1 PRD | KPI current value column | None | Add `current` column to KPI table |
| 1 PRD | Persona detail page | None | Introduce `PERSONA-1`, `PERSONA-EDGE-N` IDs in Phase 2 |
| 1 PRD | Scenario detail page | None | Promote S1/S2/S3 to formal `SCEN-1..3` ID (avoid Spec collision) |
| 1 PRD | Assumption traceability (A1 → RISK-1 → TC) | Partial | A1/A2 are user-namespace already; add `Tested-by`, `Risks` columns to table |
| 2 Persona | Persona ID | None | Add `### P-Builder: ...` heading + frontmatter `personas: [Builder]` |
| 2 Persona | Journey step ID | None | Change step tables to `| ID | # | Step | ... |` with `JS-S1-1` etc. |
| 2 Persona | Pain → linked features view | Partial | Already extractable via mapping table; just needs UI |
| 2 Persona | Emotion curve | Decorative | Either drop or add `emotion: curious/hopeful/...` per step |
| 3 Features | Per-Spec status / importance | None (prose) | Add status/importance columns to a per-R deftable or YAML block |
| 3 Features | AC GIVEN/WHEN/THEN as 3 fields | One string | Use HTML-comment block JSON or YAML mapping per AC |
| 3 Features | Feature owner | Doesn't exist | Add `owner: maintainer` per Spec |
| 4 Domain | Entity attribute schema | Per-entity table | Already extractable; add JSON Schema sidecar |
| 4 Domain | State machine as data | Mermaid only | Add YAML state def per SM |
| 4 Domain | INV typed (severity/violation handler) | Heading + prose | Add `severity:` + `enforced-by:` fields |
| 5 User Flow | Node IDs visible to graph | None (`N-001` 1-char prefix) | Rename to `UF-N-001` or `UFN-001` (2+ uppercase) — minimal rename, codemod-able |
| 5 User Flow | Edge IDs visible to graph | None | Same — rename to `UF-E-001` |
| 5 User Flow | Coordinates for visual flow | None | Add `pos: {x, y}` per node OR mermaid-only with auto-layout (already exists for 4 sections) |
| 6 IA | Page deep-link URL | Prose only | Add `url:` column per P-CC-N |
| 7 Wireframe | Wireframe ID | None (`W-CC-pattern` non-numeric) | Rename to `W-CC-1` |
| 7 Wireframe | Element ID | None (`E-CC-N` 1-char prefix) | Rename to `EL-CC-1` or `WEL-1` |
| 7 Wireframe | Zone coordinates / hotspots | None | Add a `<!-- wireframe:json -->` block with bbox per zone, OR migrate to Figma-link reference |
| 8 ARCH | ARCH-spec, ARCH-git IDs | None (no digit tail) | Rename to `ARCH-100, ARCH-101` reserved-block; OR drop these entities from ID set and treat as out-of-system labels |
| 8 ARCH | Container detail (interfaces, deps) | Already structured | Add YAML sidecar per ARCH-N |
| 9 NFR | NFR `current` value | None | Add `measured`, `last-measured` cols to each table |
| 9 NFR | NFR violation alert | None | Add `alert-policy: link to OPS-N` |
| 10 Test | TC actual pass/fail status | None | Add `status: Pass/Fail/Pending` col to AC↔TC table |
| 10 Test | TC last-run timestamp | None | Auto-generated from CI; add ingestion |
| 11 Ops | OPS health / SLO actual | None | Same as NFR — add measured columns |
| 12 ADR | ADR status as enum | Prose `**Status:** Accepted` | Promote to bold-prefix def OR frontmatter per ADR (with directory-per-ADR layout from ADR-10) |
| 12 ADR | ADR alternative as ID | None | Add `ADR-N-OPT-A`, `-OPT-B` IDs |
| 12 ADR | Risk Likelihood/Impact as enum | Cell prose | Enum schema (Low/Med/High/Critical) — schema validation today's enforce |
| 13 Plan | Task status (todo/in-progress/done) | Checkbox `- [ ]` / `- [x]` | Already structured; extractor needed |
| 13 Plan | Task `T1.1·1.2·1.3` middle-dot lists | Partial | Codemod to `T1.1, T1.2, T1.3` (comma-separated) — straight find/replace |
| 13 Plan | Milestone ID visible | None | Add `### M0:` heading-form def or `MS-0..MS-4` ID family |
| All | Per-Spec last-modified | Implicit (git log) | Acceptable; nothing to fix |
| All | Per-Spec approval timestamp | None | Add to frontmatter when promoting from Draft → Approved |
| All | Relation type on every edge | None (anonymous `cites`) | Either (a) introduce inline link syntax `[R1 → solves PAIN-1]` parsed by remark, or (b) declare typed edges in a per-phase YAML sidecar |
| All | Phase mode (HOLD SCOPE / EXPANSION) | Bold-prefix prose | Move to frontmatter `mode:` (proposal.md already does this — `mode: SCOPE EXPANSION`) |
| All | Inputs from prior phases | Bold-prefix prose `**Inputs:** PRD §3.1` | Move to frontmatter `inputs: ["01-prd#section-3-1"]` |

---

## 5. Proposed structured schema additions

The plugin already proves it can mix YAML frontmatter, markdown body, and `<!-- specrail:* -->` annotation comments. The cheapest path is **extend frontmatter + use HTML-comment YAML blocks**, not "go full JSON Schema sidecars".

### 5.1 Promote bold-prefix metadata into frontmatter

Currently every spec file's lines 5-11 look like:

```markdown
**Mode:** HOLD SCOPE (retroactive — PRD §10 변경 2026-05-12)
**Version:** 1.1 (DELTA — Mode 변경)
**Date:** 2026-05-10 (Mode 갱신 2026-05-12)
**Inputs:** PRD §3·§5·§6, Phase 2 §6 Pain Priority
```

Concrete replacement (matches the shape `changes/.../proposal.md:1-11` already uses):

```yaml
---
phase: 3
status: Approved
mode: HOLD SCOPE
version: "1.1"
date: 2026-05-10
last-modified: 2026-05-12
inputs:
  - { phase: 1, anchor: "section-3" }
  - { phase: 1, anchor: "section-5" }
  - { phase: 2, anchor: "section-6-pain-priority" }
---
```

Migration: lint/codemod. 13 files × ~30 minutes manual review = ~4-6h total. (confidence: 9/10.)

### 5.2 Per-spec attribute YAML block (inline)

Inside each `## R1: ...` body, insert a `<!-- specrail:attrs -->` HTML block followed by a YAML-fenced code block. Example based on existing `03-features.md:20-46`:

```markdown
## R1: Structured I/O between phases

<!-- specrail:attrs -->
```yaml
spec-id: R1
tier: Requirement
importance: P0
status: Approved
owner: maintainer
solves-pains: [PAIN-1, PAIN-2]
solves-scenarios: [SCEN-1, SCEN-2]
acceptance-criteria: [AC-R1-1, AC-R1-2, AC-R1-3]
tested-by: [TC-1, TC-2, TC-3]
implemented-by: [T1.1, T1.2, T1.3, T1.4, T1.5]
```

**Description:** 각 phase 산출물의 ID·status·refs를 frontmatter로 structured...
```

The graph builder needs a new code-fence detector (currently skips fenced code entirely at `builder.ts:459` — `if (n.type === 'code' || n.type === 'yaml') return SKIP`). Add an exception for fenced code immediately following a `specrail:attrs` HTML sibling. ~50 LOC. (confidence: 9/10.)

Migration per Spec: ~30s by codemod (regex `**Importance:** (P\d)` + `**Status:** (\w+)` → YAML). ~2h total for 30 R/F spec entries.

### 5.3 Persona & scenario formal IDs

```markdown
## P-Builder: Claude Code 사용자 (Primary)

<!-- specrail:attrs -->
```yaml
persona-id: P-Builder
role: primary
age-range: "25-50"
tech-fluency: 9
environment: [desktop, terminal, github-ui, vscode-preview]
goals: [...]
fears: [...]
```
```

```markdown
### SCEN-1: Greenfield

<!-- specrail:attrs -->
```yaml
scenario-id: SCEN-1
persona: P-Builder
trigger: "raw idea"
priority: P0
covers-features: [R1, R2, R5, R6, R7, R8, R13]
```
```

`P-Builder` and `SCEN-1` both match `USER_NAMESPACE_PATTERN` (`[A-Z][A-Z0-9]+-\d+...` — `P-Builder` actually does NOT match because `Builder` is not digits; we'd use `P-1` or just `PERSONA-1`). **Pick `PERSONA-1`, `PERSONA-EDGE-1`, `SCEN-1`.** (confidence: 10/10.)

### 5.4 Journey step IDs

Change Phase 2 step table from:

```markdown
| # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
| 1 | Plugin 발견 | GitHub README · Twitter 보고 install | ... | curious | PAIN-base |
```

to:

```markdown
| Step ID | # | Step | Persona 행동 | 생각 | 감정 | Pain ID |
| JS-SCEN1-1 | 1 | Plugin 발견 | ... | curious | PAIN-base |
```

Header "Step ID" matches `HEADER_ID_TOKEN_RE`. `JS-SCEN1-1` is shape `[A-Z][A-Z0-9]+-...` → matches user-namespace (the regex tolerates `JS-SCEN1-1` because compound-tail `-1` after `SCEN1` parses). (confidence: 8/10 — would need to test.) Alternative: use `JS-1-1`, `JS-2-1` indexed by scenario number — still 2+ leading uppercase, passes.

### 5.5 User-flow node & edge IDs — single character → prefix

Change `N-001` → `UFN-001`, `E-1` → `UFE-001`. Mechanical sed across `05-user-flow.md` + downstream files that cite them. (confidence: 10/10 — straight rename.) Restored to graph in one commit.

### 5.6 Wireframe layout schema

For the *layout* problem (no coordinates), the practical fix is **not** to author bbox in markdown. The practical fix is to declare a Figma file reference and let the dashboard embed Figma frames via Code Connect:

```markdown
# W-CC-1: Claude Code 응답 표준 zone

<!-- specrail:attrs -->
```yaml
wireframe-id: W-CC-1
figma-frame: "https://figma.com/file/.../frame=12:34"
pages: [P-CC-1, P-CC-2, ..., P-CC-15]
zones:
  - id: WZ-1
    label: "Phase Header"
    bound-to: [ENT-Phase.id, ENT-Phase.name]
  - id: WZ-2
    label: "Inputs Received"
    bound-to: F1.2
  ...
```
```

Migration: ~2h to author once + Figma file creation cost (outside scope of this audit).

### 5.7 Typed edges

Replace the documented-but-unimplemented `GraphEdge.type` (`04-domain-model.md:97`) with an in-source convention. Two options:

- **Option A — inline link syntax:** `[R1 solves PAIN-1]` or `R1 →solves→ PAIN-1`. Parser extension required.
- **Option B — YAML edge list in `<!-- specrail:attrs -->`:** every entity declares its outgoing typed edges (see §5.2 — `solves-pains`, `tested-by`, `implemented-by`, `mitigated-by`, etc.). Builder change: ~80 LOC to walk the attrs block and emit typed edges. (confidence: 9/10.)

Option B is simpler and dovetails with §5.2.

### 5.8 ADR status / Risk enum / Innovation token as frontmatter

Each ADR section gets a per-ADR attrs block (or migrate to ADR-10's directory-per-ADR layout):

```markdown
### ADR-1: Plugin skill 형식 — Claude Code official skill spec

<!-- specrail:attrs -->
```yaml
adr-id: ADR-1
status: Accepted
date: 2026-05-12
innovation-token: false
trigger: [ADR-CAND-1]
related-nfrs: [NFR-AVAIL-2, NFR-PERF-1]
related-specs: [R6, F6.1]
alternatives:
  - id: ADR-1-OPT-A
    name: "Claude Code official skill spec"
    chosen: true
  - id: ADR-1-OPT-B
    name: "자체 plugin loader"
    chosen: false
    rejection-reason: "PRD §6 Non-Goal 충돌"
```
```

Risk table — change header to `| ID | 위험 | Likelihood | Impact | LxI | Owner | Monitoring | Mitigation | Mitigates-NFR | Mitigates-RISK | Linked-OPS |` so the mitigation relations become explicit cells (current Mitigation column is a sentence). (confidence: 10/10.)

### 5.9 Phase 13 task list — middle-dot kills

`13-implementation-plan.md:827` says `R1 (umbrella) | T1.1·1.2·1.3·1.4·1.5 | Domain | TC-1·2·3`. Middle-dot `·` is U+00B7. The graph builder's tokenizer only extracts `T1.1` from this cell; the rest are lost. (confidence: 10/10 — tested mentally against `CITATION_RE` lookbehinds `(?<![${ZWS_CHARS}\\-.])` which would *not* prevent `1.2` from being parsed as a bare number anyway, since `1.2` doesn't start with `[A-Z]`).

Fix: bulk-replace `·` with `, ` in task-list cells of all mapping tables. One codemod, ~10 min. Restores ~70 lost task references.

---

## 6. Migration cost estimate

Per gap, with codemod feasibility:

| Gap | Estimated effort (hours) | Codemod / Lint feasible? | Risk |
|---|---|---|---|
| Frontmatter promotion (mode/version/date/inputs/last-modified) | 4-6h | **Yes** — regex over each file's lines 1-15 | Low; semantic preserved |
| Per-Spec `<!-- specrail:attrs -->` YAML insertion | 6-10h | Partial — codemod extracts `**Importance:** P0` etc., but human must approve the relation lists (`solves-pains`) | Medium — mistakes break extraction |
| Persona / Scenario ID promotion | 2-3h | **No** — requires authorial decision on names (`PERSONA-1` vs `P-Builder`) | Low |
| Journey step ID injection | 1-2h | **Yes** — auto-generate `JS-1-1, JS-1-2, ...` from row index | Low |
| User-flow node/edge ID rename `N-` → `UFN-` | 1h | **Yes** — sed `s/\bN-(\d{3})\b/UFN-\1/g` in 05-user-flow.md + all citers (`grep -rn "N-0" docs/spec/`) | Low — but must catch every citer; `grep -c "N-0" 05-user-flow.md` is the test |
| Wireframe ID rename `W-CC-pattern` → `W-CC-1`, `E-CC-N` → `WEL-N` | 1h | Yes | Low |
| ARCH-spec / ARCH-git rename or removal | 30min | Yes | Low — currently silently invisible anyway |
| ADR status/date/innovation-token as attrs | 3-4h | Partial — regex over `**Status:** X` and `**Innovation token:** X` is reliable | Low |
| Risk table: split Mitigation prose into typed columns | 2h | **No** — requires manual rephrasing per row | Medium — content edit |
| Phase 13 middle-dot codemod | 15min | **Yes** — `s/·/, /g` scoped to task-list cells (need to scope to avoid breaking other prose) | Low |
| Wireframe coordinates via Figma reference | 4-8h (markdown side; Figma file creation extra) | Partial | Low for markdown side |
| Typed-edge builder (`<!-- specrail:attrs -->` parser) | 4-6h plugin code | Plugin change | Low — pure additive |
| Per-Spec status/importance promotion across Phase 3 | 3h | **Yes** with codemod | Low |
| Milestone (M0-M4) ID promotion | 1h | Yes | Low |
| NFR `current` / `measured` columns | 2h | **No** — needs measurement data | Medium — content-bound |
| TC actual pass/fail status from CI ingestion | 6-10h plugin code | Plugin change | Medium — CI integration |
| Inline relation-type syntax (Option A) | 12-20h plugin code + 8h author migration | Plugin change | High — invasive |
| **Total markdown migration** (without dashboard code) | **~35-50h** | Mostly codemod-able | — |
| **Total plugin code change** | **~10-20h** (typed-edge parser, attrs-block builder, TC ingestion) | — | — |

Most of the migration is mechanical. The genuinely judgment-bound work is (a) deciding the relation vocabulary (`solves-pains`, `tested-by`, etc.), (b) rephrasing Risk Mitigation prose into typed cells, and (c) deciding whether wireframes get Figma references or geometry blocks.

---

## 7. Overall verdict

The current `docs/spec/*.md` is **structured enough to power a credible developer-tool dashboard (ID graph, search, file-jump, cross-ref backlinks) at roughly 95% fidelity today, but is structured at only ~45-55% of what a product-grade SaaS dashboard demands.** The plugin's parser already extracts every canonical ID and every citation edge with file:line precision — that is the hard part, and it is done. What is missing is the *attribute layer* (status / importance / persona / scenario / journey-step / mode / inputs / owner / KPI-current / relation-type) and the *non-ID navigation entities* (personas, scenarios, journey steps, wireframe zones, wireframe elements, user-flow nodes, user-flow edges, state machines, milestones) — together about 40% of the surface a polished dashboard needs to render as clickable nodes.

**Top 3 blockers, in order of dashboard-blocking severity:**

1. **User-flow nodes (76) and edges (50) have IDs that the graph builder regex silently ignores** (`N-001`, `E-1` — both fail the `[A-Z][A-Z0-9]+` minimum-2-uppercase rule). The user-flow graph view — the single most product-grade visualization in the dashboard concept — is currently *unrenderable as a clickable graph* from the markdown. (`05-user-flow.md:30-152`.) Fix is a 1-hour rename codemod.
2. **Per-spec attributes (status, importance, owner, persona, scenario, mode, inputs, AC-as-fields, relation-type-on-every-edge) live as bold-prefix inline prose, not as structured fields.** Every "filter by P0", "show Approved only", "this feature solves which persona" UI is therefore currently impossible without prose-regex hacks per phase. (`03-features.md:25-31, 53-58, 89-93, ...`.) Fix is the `<!-- specrail:attrs -->` YAML-block convention + builder extension (~10h author + ~5h plugin).
3. **Personas and scenarios have no ID family at all.** S1/S2/S3 collide with Specification-tier syntax and parse as INV-1 violations; "Builder" is a heading word, not an ID. Bidirectional navigation "this Feature → which Persona → which Journey Step → which Wireframe Zone" is end-to-end broken. (`01-prd.md:56-58`, `02-personas-journey.md` entire file.) Fix is mechanical ID introduction (`PERSONA-1`, `SCEN-1`, `JS-SCEN1-1`) plus a journey-step table column rename — ~3h.

**The single biggest schema change to recommend:** introduce the `<!-- specrail:attrs --> ```yaml ... ``` ` per-entity attributes block convention, and extend `src/graph/builder.ts` to (a) parse it as a structured-fields source-of-truth and (b) emit *typed* edges from named-list fields like `solves-pains`, `tested-by`, `implemented-by`, `mitigates-risks`. This single primitive subsumes 8 of the 10 highest-priority gaps in the matrix above (status, importance, owner, persona links, scenario links, AC fields, ADR alternatives, typed risk mitigations) and reuses an authoring affordance the project already proves it understands (the DELTA proposal frontmatter at `docs/spec/changes/archive/2026-05-15-spec-visualizer/proposal.md:1-11`). Estimate: ~10h authoring across all 13 phases + ~5h plugin code + zero breaking change to existing readers. After this one change, the spec markdown crosses the 80% threshold for a product-grade dashboard.

Without that change, the dashboard is buildable but will feel like a "markdown explorer that knows IDs" — closer to a tagged-wiki than to a manyfast.io-grade product.

---

## Confidence summary

| Section | Confidence |
|---|---|
| §0 What plugin parses today | 10/10 (read source) |
| §1 Per-phase inventory | 10/10 for line citations, 9/10 for table-count rough numbers |
| §2 ID extractability table | 10/10 for canonical families; 9/10 for user-namespace edge cases (e.g. `Edge-1`, `ARCH-spec`); 10/10 for the bare-`N-001` finding |
| §2 quantitative summary (~280 IDs, ~40% non-ID surface, 0% typed edges) | 7/10 — counts are rough hand-tallies, but the order of magnitude is solid; verified `Phase 5: 76 nodes, 50 edges`, `Phase 3: 23 AC bullets`, `Phase 12: 11 ADRs`, `Phase 9: 18 NFR tables` directly |
| §3 dashboard requirements derivation | 8/10 — first-principles, not against a competitor's actual data model |
| §4 gap matrix | 9/10 — every row traceable to a §1 finding |
| §5 schema proposals | 8/10 — examples drawn from real lines; concrete YAML untested against ajv |
| §6 migration cost estimates | 6/10 — informed guesses; codemod-feasibility verdict is firm, hour numbers are not |
| §7 verdict + top 3 blockers | 9/10 — blockers are direct readouts from §2 verified findings |

All file:line citations checked against the live files in `/Users/sungminoh/Development/specrail/docs/spec/` at audit time (2026-05-15).
