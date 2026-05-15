---
phase: 9
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint (fix iteration 2)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 8 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 8 delta §2.7 ADR-CAND-13/14/15"
  - "docs/spec/09-non-functional-requirements.md (current — 63 NFR ids, 7 domains)"
  - "proposal.md §6 Phase 9 (NFR-VIZ-* dashboard 본 delta scope 외)"
target-version: "docs/spec/09-non-functional-requirements.md (post-merge)"
batch: "Phase 9·10·11 verifier-checkpoint batch"
---

# Phase 9 DELTA: NFR changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1~8 Approved/in batch.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode | **SCOPE EXPANSION** |
| Scope | dashboard NFR-VIZ-* 별 repo. core repo는 NFR-CSA-* 7 신규 + 기존 63 NFR attrs. |
| 자체 리뷰 면책 | verifier batch checkpoint 예정. |

---

## 1. Why (Phase 9 specific)

audit verdict + R-CSA AC가 측정가능한 NFR로 변환되어야 함. proposal §6 Phase 9 outline의 NFR-VIZ-* 9개는 dashboard 별 repo의 NFR. core repo는 schema·codemod·validator 자체의 NFR:

1. parser perf (attrs.ts 파일당)
2. validator perf (전 spec)
3. codemod idempotency
4. schema fetch SLO (EXT-6)
5. schema integrity (tampering 방지)
6. telemetry schema-version privacy (anonymous)
7. a11y — codemod·audit CLI 출력의 colour-blind safety + screen reader

---

## 2. What Changes

### 2.1 ADDED NFR-CSA-* (7 new)

#### 2.1.1 NFR-CSA-PERF-1: attrs parser per-file latency

```markdown
| NFR-CSA-PERF-1 | attrs parser per-file | ms | < 50 (p95, 100-entity file) | T-CSA.12 perf bench (Playwright timing) | hook ERROR (T-CSA.8 lint gate) |
```

<!-- specrail:attrs id=NFR-CSA-PERF-1 -->
```yaml
status: Approved
target: 50
unit: millisecond
measure-method: "T-CSA.12 perf bench — 100-entity spec file × parseAttrsBlocks(file) wall clock, p95 over 50 runs"
violates-action: "hook ERROR — pre-commit lint 차단"
linked-arch: [ARCH-13]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

#### 2.1.2 NFR-CSA-PERF-2: validator full-spec

```markdown
| NFR-CSA-PERF-2 | ajv validator full-spec | ms | < 500 (13 phase × 평균 30 entity) | T-CSA.12 perf bench | WARN |
```

<!-- specrail:attrs id=NFR-CSA-PERF-2 -->
```yaml
status: Approved
target: 500
unit: millisecond
measure-method: "T-CSA.12 perf bench — 전체 docs/spec/*.md × validator.ts ajv compile + validate, wall clock p95"
violates-action: WARN
linked-arch: [ARCH-14]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

#### 2.1.3 NFR-CSA-PERF-3: codemod idempotency

```markdown
| NFR-CSA-PERF-3 | codemod idempotency (re-run delta) | byte | 0 | T-CSA.12 RED test (T-CSA.5 codemod 2회 실행 후 git diff) | hook ERROR |
```

<!-- specrail:attrs id=NFR-CSA-PERF-3 -->
```yaml
status: Approved
target: 0
unit: byte
measure-method: "T-CSA.5 codemod 2회 실행 후 `git diff` byte count"
violates-action: "hook ERROR — codemod 자체가 reject"
linked-arch: [ARCH-15]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

#### 2.1.4 NFR-CSA-AVAIL-1: schema publish endpoint SLO

```markdown
| NFR-CSA-AVAIL-1 | schemas/attrs.schema.json GitHub raw URL fetch SLO | % | 99.5 (월간) | GitHub status page (외부 의존) | consumer-side cache fallback (EXT-6) |
```

<!-- specrail:attrs id=NFR-CSA-AVAIL-1 -->
```yaml
status: Approved
target: 99.5
unit: percent
measure-method: "GitHub raw URL availability (external dependency — plugin 측 측정 안 함)"
violates-action: "consumer-side cache fallback — EXT-6 failure mode 일관"
linked-arch: [ARCH-14]
linked-ext: [EXT-6]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

#### 2.1.5 NFR-CSA-SEC-1: schema integrity

```markdown
| NFR-CSA-SEC-1 | schema artifact tampering 방지 | — | git tag signature (maintainer 측) | OSS git commit signing | consumer alarm (mismatched signature) |
```

<!-- specrail:attrs id=NFR-CSA-SEC-1 -->
```yaml
status: Approved
target: "git tag signature"
unit: signature
measure-method: "maintainer git tag 서명 검증 (OSS 공개 key)"
violates-action: "consumer-side alarm — fetch 시 signature 검증 실패"
linked-arch: [ARCH-14]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

#### 2.1.6 NFR-CSA-PRIV-1: telemetry schema-version privacy

```markdown
| NFR-CSA-PRIV-1 | schema-version telemetry key의 PII 포함 가능성 | bool | false (semver 숫자만) | T-CSA.13 telemetry payload 단위 test | WARN |
```

<!-- specrail:attrs id=NFR-CSA-PRIV-1 -->
```yaml
status: Approved
target: false
unit: bool
measure-method: "T-CSA.13 RED test — payload schema validate against PII-detector"
violates-action: WARN
linked-r: [R13, R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

#### 2.1.7 NFR-CSA-A11Y-1: CLI 출력 colour-blind safety

```markdown
| NFR-CSA-A11Y-1 | `specrail audit`·`specrail migrate` CLI 출력 colour-blind safety | bool | true | manual smoke test (Coblis simulator) | non-blocking, lint WARN |
```

<!-- specrail:attrs id=NFR-CSA-A11Y-1 -->
```yaml
status: Approved
target: true
unit: bool
measure-method: "manual smoke test — Coblis colour-blind simulator로 CLI output 검토"
violates-action: "non-blocking WARN"
linked-arch: [ARCH-15]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.2 MODIFIED 기존 63 NFR — codemod-generated attrs (documented contract)

#### 2.2.1 NFR-tier attrs template

```yaml
status: Approved          # all existing NFR: Approved
target: <existing>         # parameter — 표 column에서 그대로
unit: <existing>           # parameter
measure-method: <existing> # parameter
violates-action: <existing> # parameter
linked-arch: [...]         # parameter — Phase 8 ARCH cross-ref
linked-r: [...]            # parameter — PRD R cross-ref
last-modified: 2026-05-15
```

#### 2.2.2 NFR parameter source

기존 §1~§7 표 (현 `09-non-functional-requirements.md` 5-column format)에 attrs block은 *각 row 직후 부착* — codemod (T-CSA.5 step `--phase=9`)이 표 row를 oracle로 attrs block scaffolding. 7 domain × 평균 9 NFR ≈ 63 attrs block. 별도 parameter table 작성하지 않음 — 표 자체가 source-of-truth.

> 본 approach는 Phase 8 ARCH·EXT와 다름 (저기는 12 ARCH·5 EXT 직접 enumerate). 이유: NFR 63개는 inline parameter table 시 delta 1000+ line. NFR row 자체가 이미 structured (5 column), codemod이 그 row를 attrs로 transform. 머지 시 row·attrs 양립.

### 2.3 ADDED §10 신설: NFR-CSA ↔ ARCH 매핑

```markdown
## 10. NFR-CSA ↔ ARCH 매핑 (DELTA core-schema-attrs)

| NFR-CSA | ARCH | 비고 |
|---|---|---|
| NFR-CSA-PERF-1 | ARCH-13 | parser latency |
| NFR-CSA-PERF-2 | ARCH-14 | validator latency |
| NFR-CSA-PERF-3 | ARCH-15 | codemod idempotency |
| NFR-CSA-AVAIL-1 | ARCH-14, EXT-6 | schema fetch SLO |
| NFR-CSA-SEC-1 | ARCH-14 | schema integrity |
| NFR-CSA-PRIV-1 | ARCH-4 (Telemetry Client) | schema-version privacy |
| NFR-CSA-A11Y-1 | ARCH-15 | CLI a11y |
```

### 2.4 MODIFIED §9 PRD KPI ↔ NFR 매핑 (append)

```markdown
**DELTA core-schema-attrs:**
- KPI-7 (Phase 1 delta) — attrs coverage. 직접 측정 NFR 없음 (KPI 자체가 percentage). NFR-CSA-PERF-1·2가 KPI-7 측정 인프라 의존성.
```

---

## 3. Impact (Phase 9 차원)

| 차원 | 변화 |
|---|---|
| 신규 NFR | 7 (NFR-CSA-PERF-1~3, AVAIL-1, SEC-1, PRIV-1, A11Y-1) |
| 기존 NFR attrs | 63 (codemod, row-based oracle) |
| §10 신설 | NFR-CSA ↔ ARCH 매핑 |
| §9 append | KPI-7 매핑 |

---

## 4. Open Questions (Phase 9 차원)

**OQ-9-CSA-1 (Non-Blocking):** NFR-CSA-AVAIL-1 (GitHub raw URL fetch SLO 99.5%)이 외부 GitHub status에 의존 — plugin maintainer는 측정만, 보장 불가. 별 channel (Cloudflare CDN cache, npm mirror) 추가 필요? 결정자: maintainer + dashboard repo maintainer (consumer side cache fallback과 dual-design). 마감: T-CSA.7 (publish schema) 전.

---

## 5. Self-Check (Phase 9 DELTA용)

| Check | 결과 |
|---|---|
| 7 신규 NFR 측정 단위·목표·measure-method 명시 | ✓ (`status`·`target`·`unit`·`measure-method`·`violates-action` 모두) |
| `linked-arch` field — Phase 8 ARCH-13/14/15 + EXT-6 cross-ref | ✓ |
| `linked-r: [R-CSA]` cross-ref | ✓ (Phase 3 forward-reference) |
| Edge kind enum compliance | ✓ `linked-arch`·`linked-r`·`linked-ext` 모두 proposal §5 NFR-N row optional (verifier 지적 후 proposal §5 패치 — 본 delta가 그 확장의 첫 consumer) |
| ID 충돌 — NFR-CSA-* live spec 미존재 | ✓ `grep -E "NFR-CSA-" docs/spec/09-non-functional-requirements.md` empty |
| Mermaid mandatory? | Phase 9 NFR phase는 mermaid mandatory 아님 (principles §Diagrams: Phase 4·5·8) — pass |
| dashboard NFR-VIZ-* 제외 명시 | ✓ §0 |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |
| Mode tag | SCOPE EXPANSION 단일 |
| attrs wrapper canonical | ✓ 7 신규 NFR 모두 `<!-- specrail:attrs id=NFR-CSA-* -->` 형식 |

---

## 6. Lifecycle

```
Phase 9 delta: Proposed
  ↓ verifier batch checkpoint (9·10·11)
Approved (batch)
  ↓
다음 → Phase 10 delta (Test Strategy)
```
