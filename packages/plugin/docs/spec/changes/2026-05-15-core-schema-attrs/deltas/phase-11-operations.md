---
phase: 11
capability: core-schema-attrs
status: Approved
approved-date: 2026-05-15
approver: user (smoh2044@gmail.com) — batch-with-verifier checkpoint (fix iteration 2)
mode: SCOPE EXPANSION
inherited-mode: yes (Phase 10 level re-confirmed)
date: 2026-05-15
inputs:
  - "Phase 8 delta §2.4 EXT-6 (public schema contract)"
  - "Phase 9 delta NFR-CSA-AVAIL-1·SEC-1·PRIV-1"
  - "docs/spec/11-operations.md (current — OPS-1~10 in 10 sections)"
  - "proposal.md §6 Phase 11"
target-version: "docs/spec/11-operations.md (post-merge)"
batch: "Phase 9·10·11 verifier-checkpoint batch"
---

# Phase 11 DELTA: Operations changes for `core-schema-attrs`

> Strategy: `../proposal.md`. Phase 1~10 Approved/in batch.

---

## 0. Provenance & Mode

| Field | Value |
|---|---|
| Mode | **SCOPE EXPANSION** |
| Scope clarification | proposal §6 Phase 11 outline의 "Hybrid — passive skills + 사용자 측 localhost webapp"는 dashboard 별 repo 결정과 incompatible. 본 delta는 **plugin core의 passive 성격 유지** + EXT-6 publish endpoint 운영만 추가. user-localhost env 신설은 *별 repo `specrail/dashboard`의 Phase 11 책임*. |
| 자체 리뷰 면책 | verifier batch checkpoint 예정. |

---

## 1. Why (Phase 11 specific)

EXT-6 (Phase 8) public schema contract가 operations side에 영향:

1. **Schema publish endpoint** — npm package + GitHub raw URL 2 채널. 두 곳 모두 publish protocol 명시 필요 (OPS-CSA-1).
2. **Schema-version telemetry metric** — 기존 telemetry endpoint(EXT-5)에 `schema-version` key 추가 (T-CSA.13 proposal §7.8). Privacy 검증은 Phase 9 NFR-CSA-PRIV-1.
3. **schema fetch downtime runbook** — consumer-side(별 repo `specrail/dashboard`·third-party)가 schema fetch 실패 시 plugin maintainer response policy.

---

## 2. What Changes

### 2.1 ADDED OPS-CSA-1: Schema publish endpoint

```markdown
**OPS-CSA-1 — Schema publish:**
- npm package `specrail` 안 `schemas/` 디렉토리 포함 (publish 시 자동 attach).
- GitHub raw URL `https://raw.githubusercontent.com/{org}/specrail/{tag}/schemas/attrs.schema.json` — git tag-based, immutable per version.
- 매 release (T-CSA.14 0.1.0 → 0.2.0 → ...)마다 두 채널 모두 publish. CI 검증 (npm pack + curl GH).
```

<!-- specrail:attrs id=OPS-CSA-1 -->
```yaml
status: Approved
env: maintainer-ci
linked-arch: [ARCH-14]
linked-ext: [EXT-6]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.2 MODIFIED OPS-5 (Telemetry stream, opt-in) — schema-version key 추가

기존 OPS-5 (`11-operations.md:94`) payload field set:

**Before:**
```text
- ts, anonProjectHash, phase, action (인용·정의), counts, durationMs (선택)
```

**After:**
```text
- ts, anonProjectHash, phase, action, counts, durationMs (선택), **schema-version (semver, 예: 1.0)**
```

attrs block:

<!-- specrail:attrs id=OPS-5 -->
```yaml
status: Approved
env: user-anonymous + maintainer-endpoint
linked-arch: [ARCH-4]
linked-ext: [EXT-5]
linked-r: [R13, R-CSA]
last-modified: 2026-05-15
note: "DELTA 2026-05-15 — schema-version key 추가됨 (Phase 11 delta §2.2). last-modified 자체가 변경 audit."
```
<!-- /specrail:attrs -->

Privacy: NFR-CSA-PRIV-1 (Phase 9)이 semver number-only를 강제. PII 위험 없음.

### 2.3 ADDED §13 신설: Schema fetch downtime runbook

```markdown
## 13. Schema fetch downtime runbook (DELTA core-schema-attrs)

consumer (dashboard·third-party)가 `schemas/attrs.schema.json` fetch 실패 시:

1. **Consumer side (지침 only — plugin scope 외):**
   - Cached schema 사용 (consumer 측 cache fallback — EXT-6 failure mode 명시)
   - 사용자에게 stale-schema warning 표시

2. **Plugin maintainer side (책임):**
   - GitHub raw URL 가용성은 GitHub status에 의존 — maintainer 직접 보장 불가.
   - npm 가용성은 npm registry status에 의존.
   - **권장 대응:** SLO 위반 (NFR-CSA-AVAIL-1, 99.5%/월) 감지 시 mirror channel (Cloudflare CDN, jsDelivr CDN) 추가 검토. ADR-CAND-15 (Phase 12)로 surface.
```

attrs block:

<!-- specrail:attrs id=OPS-CSA-2 -->
```yaml
status: Approved
env: consumer-side + maintainer-monitoring
linked-nfr: [NFR-CSA-AVAIL-1]
linked-ext: [EXT-6]
linked-r: [R-CSA]
last-modified: 2026-05-15
```
<!-- /specrail:attrs -->

### 2.4 MODIFIED §1 Environments — append "schema publish channels"

```markdown
**DELTA core-schema-attrs:**
| 채널 | 역할 | 가용성 | 외부 의존 |
|---|---|---|---|
| npm registry | `specrail` package + schemas/ | npm SLO (99.9% historical) | npm Inc. |
| GitHub raw URL | per-tag immutable schema fetch | GitHub raw SLO (99.5%) | GitHub |
```

본 절은 **사용자 측 환경 추가 아님** (proposal §6 Phase 11 "user-localhost env" outline 명시 reject — dashboard 별 repo 책임). plugin 측 publish 환경만.

### 2.5 MODIFIED 기존 OPS-1~10 — codemod attrs

OPS-tier attrs template:

```yaml
status: Approved
env: <maintainer-ci | maintainer-endpoint | user-anonymous | local>
linked-arch: [...]
linked-ext: [...]   # optional
last-modified: 2026-05-15
```

codemod이 §1~§7 표 + bold-prefix paragraph (OPS-1·2·3·5·6·7 형식, `11-operations.md:31, 64, 72, 94, 107, 111`)를 oracle로 attrs scaffolding. row-based source-of-truth (Phase 9·10 동형).

---

## 3. Impact (Phase 11 차원)

| 차원 | 변화 |
|---|---|
| 신규 OPS | OPS-CSA-1·2 (2) |
| OPS-5 telemetry payload | schema-version key 추가 |
| 기존 10 OPS attrs | codemod |
| §13 신설 | Schema fetch downtime runbook |
| §1 Environments append | npm + GH publish channel |
| user-localhost env | **명시 reject** (dashboard 별 repo Phase 11 책임) |

---

## 4. Open Questions (Phase 11 차원)

**OQ-11-CSA-1 (Non-Blocking):** Schema publish channel 추가 (Cloudflare CDN, jsDelivr CDN) 필요 시점 — NFR-CSA-AVAIL-1 SLO 위반 감지 후 vs 사전 redundancy 구축? 결정자: maintainer. 마감: 0.1.0 release 후 첫 monthly review.

**OQ-11-CSA-2 (Non-Blocking):** Schema-version metric을 Plausible vs PostHog vs 자체 endpoint — ADR-CAND-7 결정 의존 (live `11-operations.md:72`). 본 delta 머지를 막지 않음.

---

## 5. Self-Check (Phase 11 DELTA용)

| Check | 결과 |
|---|---|
| OPS-CSA-1·2 신규 + ID 충돌 없음 | ✓ live OPS-1~10만 |
| OPS-5 modification — schema-version key 추가 (privacy NFR-CSA-PRIV-1 일관) | ✓ |
| user-localhost env 거절 명시 | ✓ §0 + §2.4 |
| §13 신설 runbook actionable (consumer side + maintainer side 양쪽 명시) | ✓ |
| Edge kind compliance | ✓ `linked-arch`·`linked-r`·`linked-ext`·`linked-nfr` 모두 proposal §5 OPS-N row optional scalar metadata (verifier 지적 후 §5 OPS-N row 확장 패치) |
| `grep -iE "TBD\|TODO\|implement later"` | 0 |
| Mode tag | SCOPE EXPANSION 단일 |
| attrs wrapper canonical | ✓ 2 신규 OPS 모두 `<!-- specrail:attrs id=OPS-CSA-* -->` |
| dashboard 별 repo Phase 11 책임 명시 | ✓ §0 + §2.4 |

---

## 6. Lifecycle

```
Phase 11 delta: Proposed
  ↓ verifier batch checkpoint (9·10·11 종료)
Approved (batch)
  ↓
다음 batch → Phase 12·13 + tasks.md
```
