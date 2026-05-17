# Phase-Specific Frontmatter Fields

Reference: R5 HIGH#1 — per-phase schema differentiation (round 5).

All phase schemas share a common envelope (`phase`, `status`, `mode`, `refs`, `approvedAt`).
Each phase additionally declares **phase-specific properties** that signal the expected content structure.

> Conservative policy: all phase-specific fields are **declared but not required**.
> `additionalProperties: true` is kept so existing documents validate without modification.
> A document that omits these fields still passes schema validation.

---

## Common Envelope (all phases)

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `const integer` | Phase number (1–13) |
| `status` | `enum` | `Empty` \| `Draft` \| `Approved` |
| `mode` | `enum` | `SCOPE_EXPANSION` \| `SELECTIVE_EXPANSION` \| `HOLD_SCOPE` \| `SCOPE_REDUCTION` |
| `refs` | `string[]` | Cross-phase ID references (R/F/S/ENT/INV/NFR/ARCH/EXT/OPS/ADR/RISK/TC/EDGE/AC-R/T) |
| `approvedAt` | `string` | ISO 8601 timestamp of explicit user approval |

---

## Phase 1: PRD

Source of truth for all subsequent phases. Captures vision, problem, target, core value, KPIs, non-goals.

| Field | Type | Description |
|-------|------|-------------|
| `kpi` | `object[]` | Key Performance Indicators — success metrics from PRD §4 (DAU, retention, conversion targets) |
| `personas` | `object[]` | Primary persona summaries — who the product is built for (PRD §3.1) |
| `risks` | `object[]` | Assumption risks identified during framing (PRD §7 Assumption table) |

---

## Phase 2: Persona & Journey

Deepens personas from categories to specific people. Maps emotional journey per scenario.

| Field | Type | Description |
|-------|------|-------------|
| `personas` | `object[]` | Persona cards — deeply specified (role, tools, goals, fears, daily context) |
| `journeys` | `object[]` | Journey maps — one per core scenario, tracking emotion/thought/action per step |
| `painPriority` | `object[]` | Pain Priority table — P0/P1/P2 ranked pain points with persona/scenario references |

---

## Phase 3: Functional Specification

3-tier specification: Requirement → Feature → Specification with Acceptance Criteria.

| Field | Type | Description |
|-------|------|-------------|
| `features` | `object[]` | Feature list — R→F→S 3-tier breakdown; each entry is a Requirement with nested Features and Specifications |
| `requirements` | `object[]` | Flat Requirement list (R-IDs) for quick reference and cross-phase linking |

---

## Phase 4: Domain Model

Domain entities, attributes, relationships, state machines, and invariants. Technology-agnostic.

| Field | Type | Description |
|-------|------|-------------|
| `entities` | `object[]` | Domain entities (ENT-* IDs) with attributes, state machines, and AC references |
| `relationships` | `object[]` | Entity relationships (1:1, 1:N, N:M) between domain entities |
| `invariants` | `object[]` | System invariants (INV-* IDs) — rules that must never be violated |

---

## Phase 5: User Flow

All user paths to goals, modelled as Section → Node → Edge graph.

| Field | Type | Description |
|-------|------|-------------|
| `flows` | `object[]` | User flow sections — each contains nodes (start/page/action/section-top) and edges with conditions |

---

## Phase 6: Information Architecture

Page hierarchy and navigation strategy. 1:1 mapping with Phase 5 page nodes.

| Field | Type | Description |
|-------|------|-------------|
| `screens` | `object[]` | Page/screen catalog (P-* IDs) — 1:1 mapping to Phase 5 page nodes, with hierarchy depth |
| `navigationStrategy` | `string` | Primary navigation pattern: sidebar / tab / drawer / stack / etc. |

---

## Phase 7: Wireframe

Information layout per page. Covers element specs and 4 component states.

| Field | Type | Description |
|-------|------|-------------|
| `wireframes` | `object[]` | Wireframe specs (W-* IDs, 1:1 with P-* from phase 6) — layout zones, element specs, 4 states (Loading/Empty/Error/Success) |

---

## Phase 8: System Architecture

C4 model (L1 Context, L2 Container), external integrations, auth model. Abstract only — concrete technology decisions deferred to Phase 12.

| Field | Type | Description |
|-------|------|-------------|
| `components` | `object[]` | Abstract system components (ARCH-* IDs) — C4 L2 containers (services, datastores, clients). No concrete vendor names. |
| `decisions` | `object[]` | ADR-CAND-* deferred decisions identified during architecture design (resolved in phase 12) |
| `integrations` | `object[]` | External integrations (EXT-* IDs) — third-party systems, APIs, and services |

---

## Phase 9: Non-Functional Requirements

7 quality domains, all measurable. Covers Performance, Scalability, Availability, Security (STRIDE), Privacy, Accessibility (WCAG), i18n.

| Field | Type | Description |
|-------|------|-------------|
| `requirements` | `object[]` | NFR list (NFR-{DOMAIN}-* IDs) — each must have measurable target + measurement point |

---

## Phase 10: Test Strategy

AC↔TC mapping, test pyramid (default 70/20/10), edge case catalog, performance test scenarios.

| Field | Type | Description |
|-------|------|-------------|
| `testCases` | `object[]` | Test cases (TC-* IDs) — each linked to AC / INV / NFR ID; specifies test type and pyramid tier |
| `coverage` | `object` | Test pyramid coverage targets — e.g. `{ unit: 70, integration: 20, e2e: 10 }` |

---

## Phase 11: Operations

Environments, deploy strategy, observability (Logs/Metrics/Traces), alerts, backup/DR, feature flags, cost. Abstract tool references only.

| Field | Type | Description |
|-------|------|-------------|
| `runbooks` | `object[]` | Operational runbooks (OPS-* IDs) — deploy strategy, DR/backup procedures, on-call playbooks |
| `monitoring` | `object[]` | Observability specs — Logs / Metrics / Traces per ARCH component, alert policies tied to PRD KPI / NFR |

---

## Phase 12: ADR + Risks

Resolves all ADR-CAND from previous phases. Risk register with Likelihood × Impact matrix.

| Field | Type | Description |
|-------|------|-------------|
| `decisions` | `object[]` | Architecture Decision Records (ADR-* IDs) — each has one chosen option, rejected alternatives with reasons, consequences |
| `risks` | `object[]` | Risk register (RISK-* IDs) — L×I matrix with mitigation plans. Empty array if no identified risks. |

---

## Phase 13: Implementation Plan

Atomic tasks ready for Claude Code execution. No TBD/placeholders allowed.

| Field | Type | Description |
|-------|------|-------------|
| `tasks` | `object[]` | Atomic implementation tasks (T*.* IDs) — each has exact file path, complete code block, exact test command + expected output |
| `acceptanceCriteria` | `object[]` | Phase-level acceptance criteria linking T-tasks to AC/TC IDs — verifies MVP is shippable |
| `milestones` | `object[]` | Milestone groupings of tasks (M0 = MVP, M1 = polish, etc.) with dependency graph summary |
