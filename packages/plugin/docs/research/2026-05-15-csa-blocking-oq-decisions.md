---
type: decision-recommendation
basis: docs/spec/changes/2026-05-15-core-schema-attrs/proposal.md §10 (Blocking OQ)
author: architect agent (opus, read-only) — first-principles analysis
date: 2026-05-15
status: Proposed
ethos: principles.md §ETHOS L1/L2/L3, §Boring by default, §Reversibility preference
---

# Blocking OQ Decisions for `core-schema-attrs` — First-Principles Recommendation

> 본 문서는 architect agent의 read-only 분석 결과. 사용자 결정 전 단계.
> 6개 Blocking OQ에 대해 position-bearing 단일 결정 + first-principles 근거 + 거절 대안 + 역호환성 평가.
> Innovation token 소비: **0/3** — 모든 결정이 JSON Schema·YAML·HTML-comment marker family·OpenAPI/GraphQL 패턴 등 industry-standard에 안착.

---

## Executive Summary

| OQ | 결정 | Confidence |
|---|---|---|
| OQ-CSA-1 | attrs YAML을 entity heading **직후, prose 이전**에 배치 | 9/10 |
| OQ-CSA-2 | **`FLN-N` / `FLE-N`** (named prefix ≥ 2 uppercase 보장) | 9/10 |
| OQ-CSA-3 | **v0.1.0~0.3.0 WARN · v0.4.0 ERROR** — §4.3 dual-parse window와 대칭 | 8/10 |
| OQ-CSA-5 | **closed enum 8 kinds** (`solves`·`linked-features`·`parent`·`tested-by`·`covers-ac`·`mitigates`·`linked-arch`·`depends-on`) frozen at v0.1.0 | 7/10 |
| OQ-CSA-8 | **`PERSONA-N`** (`PER-N` 의미 모호로 거절) | 9/10 |
| OQ-CSA-10 | **in-band `<!-- specrail:attrs-review-required reason="..." -->` marker + `.specrail/migrate-report.json` index + lint ERROR** (always blocking) | 8/10 |

---

## OQ-CSA-1 — attrs YAML 위치

**Decision:** entity heading 직후, prose 이전.

**Confidence:** 9/10.

**Layer:** L1 + L3.

**First-principles 근거:**
- **L1 precedent:** JSDoc·Python docstring·Rust doc comment·Java annotation·Markdown frontmatter — 산업 모든 metadata-with-entity 컨벤션은 *heading-adjacent*. Section-end placement는 사실상 precedent 없음.
- **L3 a — Grep ergonomics:** `grep -A 12 '^## R1:' 03-features.md`가 canonical "R1 contract 읽기" 명령. heading-immediate면 YAML이 항상 처음 10줄 안. section-end면 section 길이가 phase별로 다름 (R1은 `03-features.md:20-46` 26줄, ADR-1은 `12-adr-risks.md:20-75` 55줄) → `grep -A N`이 일관성 깨짐.
- **L3 b — Parser locality:** `src/graph/builder.ts:23` `HEADING_DEF` 자연스러운 확장 = heading 노드 직후의 HTML sibling 1개만 scan (5 lines AST walk). section-end는 다음 H##까지 unbounded lookahead → 30+ lines + variable depth edge case.
- **L3 c — Authoring drift:** section 중간에 sub-bullet 추가 시 attrs block이 section 중간으로 밀려나는 silent drift. audit `:182, 596-600`의 `T2.5a`·middle-dot `·` 실패 패턴 동형.

**Antithesis 수용:** "prose 전에 YAML이 reading flow를 끊는다"는 실재. 그러나 5-10줄 fenced block은 시각적으로 분리 가능. status 확인은 prose에서 더 느림. Net: readability 비용 작음, ergonomics·parser·drift-prevention 이득 structural.

**Rejected:**
- *Section-end:* §위 L3 a/b/c 모두 실패. ADR 50줄 prose 뒤에서 status 확인은 매번 scroll.
- *Both (top+bottom):* source-of-truth 이중화. conflict resolution rule 필요. 거절.
- *Frontmatter only:* phase당 30+ entity. 안 됨.

**Implementation note:** §3.2 "warning" 문구를 "lint ERROR"로 강화. heading 직후가 invariant.

**Reversibility:** **Two-way door.** regex extract → next-heading-minus-1 anchor 로 codemod 가능.

---

## OQ-CSA-2 — Flow node 명명

**Decision:** **`FLN-N` (Flow Node)** / **`FLE-N` (Flow Edge)**.

**Confidence:** 9/10.

**Layer:** L1 + L3.

**First-principles 근거:**
- **L1:** repo의 모든 ID family는 3+ char unambiguous prefix(`ENT-`·`INV-`·`NFR-`·`ARCH-`·`RISK-`·`EDGE-`·`OPS-`·`ADR-`·`KPI-`·`PAIN-`·`PERSONA-` 제안). 단문자는 `R/F/S/T`의 dotted-tail family — 별개 카테고리.
- **L1 industry:** Kubernetes kind·OpenAPI tag·AWS ARN 모두 multi-char 명확 prefix. 단문자 prefix는 alphabet-exhausted 카테고리(IUPAC) 전용.
- **L3 — 3가지 kill 제약:**
  1. **`N-N` (0-pad 제거만):** 단문자 prefix는 `USER_NAMESPACE_PATTERN` (`src/spec/patterns.ts:49`) `[A-Z][A-Z0-9]+` 2+ leading 요구 통과 못함. floor 낮추면 prose의 `A-1`·`B-2`·`Z-1` 같은 false-positive 폭증 (`docs/research/...audit.md:226`).
  2. **`FN-N`:** Feature tier `F{n}.{m}` (`src/spec/id.ts:8`)와 시각·구문 충돌. `parseSpecId` 가 `FN1`을 malformed Spec ID로 시도. `S1/S2/S3 vs S-tier` 충돌(audit §1.5) 재현. 거절.
  3. **`FLN-N`/`FLE-N`:** 3-letter, floor clear, mnemonic, `EDGE-N`·`ARCH-N` 스타일과 평행. 비용 = 76 노드 × 3 citation × 2 extra char ≈ 1.2KB markdown. trivial.

**Close-call 비교 (UFN vs FLN):** UFN(User Flow Node)도 모든 invariant 통과. tie-breaker — `FL*` 짧고 paired (`FLN`+`FLE`)·audit doc이 명시적으로 endorse (`proposal §4.2`). 7/10 second-best는 UFN/UFE.

**Rejected:**
- *`N-N`:* regex floor invariant 파괴. concrete failure.
- *`FN-N`:* Feature tier 충돌. 거절.
- *`UFN-`/`UFE-`:* 작은 차이, 비채택.

**Implementation note:** §4.2 lock. `src/spec/patterns.ts:23-36` `ID_PATTERN_SOURCE`에 `|FLN-\\d+|FLE-\\d+` 추가 — canonical ID로 승격.

**Reversibility:** **One-way door** (76 node + 50 edge + cross-ref 일괄 rewrite 후). Trigger to reconsider: `FL*` 충돌하는 신규 family — 현재 없음.

---

## OQ-CSA-3 — required attrs 위반 severity 타이밍

**Decision:** **v0.1.0~v0.3.0 WARN · v0.4.0 ERROR** (proposal §4.3 dual-parse window와 동기화).

**Confidence:** 8/10.

**Layer:** L1 (Cognitive Patterns: Incremental over revolutionary, Reversibility preference).

**First-principles 근거:**
- **L1 — Incremental over revolutionary:** immediate ERROR = big-bang migration. v0.1.0 install에서 모든 미마이그레이션 entity가 CI fail. principle 위반.
- **L1 — Reversibility:** WARN은 reversible (downgrade·CI gate 점진 시행). ERROR는 그 release 동안 one-way.
- **L3 — Coherence 강제:** proposal §4.3은 legacy `S\d` → `SCEN-N` dual-parse를 v0.1.0~0.3.0 동안 시행. attrs-completeness만 즉시 ERROR면 *한 release 안에 두 strictness 레벨*. authors가 "v0.1.0는 strict인가 migration release인가" 혼란. 두 transition을 v0.4.0에 동기화하는 게 자연.

**Antithesis 수용:** "WARN은 무시된다. 사용자는 마이그레이션 안 하고 v0.4.0 도착 시 망함" 정당함. **Mitigation 3종:** (a) `specrail audit` 출력에 count badge ("12 entities missing required attrs"), (b) per-release CHANGELOG에 v0.4.0 ERROR transition 명시, (c) `specrail migrate` codemod로 attrs scaffolding → WARN 기계적 해소.

**8/10 not 9/10 근거:** v0.4.0 release timing이 2026 안인지 vs slip 여부. v0.2.0 release 시점에 `specrail audit`이 dogfood entity 30%+ 미해소면 v0.3.0으로 escalate. trigger condition 명시.

**Rejected:**
- *Immediate ERROR:* user spec break on install. §4.3과 불일치. 거절.
- *WARN forever:* contract 무력화. dashboard가 required attrs 신뢰 불가. 거절.

**Implementation note:** §3.2 문구 lock. WARN 메시지에 `specrail migrate --fix` 제안 포함 의무화.

**Reversibility:** **Two-way door** within v0.1.0–v0.3.0. v0.4.0 cut에서 one-way.

---

## OQ-CSA-5 — typed edge kind enum

**Decision:** **Closed enum of 8 kinds, frozen at v0.1.0:**

| kind | source | target | 의미 |
|---|---|---|---|
| `solves` | R, F, S | PAIN | requirement가 pain을 해결 |
| `linked-features` | R | F | parent → child feature 분해 |
| `parent` | F, S, T | R, F, T | upward 계층 |
| `tested-by` | R, F, S, AC, INV, NFR | TC, EDGE | coverage edge |
| `covers-ac` | TC | AC | tested-by 역방향 (TC 측 authored) |
| `mitigates` | OPS, ARCH, RB | RISK, NFR | risk/NFR mitigation |
| `linked-arch` | R, F, NFR, EXT | ARCH | requirement/NFR → architecture |
| `depends-on` | T, ARCH, OPS | T, ARCH, OPS, EXT | execution/runtime dependency |

Open vocabulary 거절. 추가는 ADR 경유 schema-version bump.

**Confidence:** 7/10 (closedness 결정 9/10, 정확한 8개 이름 6/10).

**Layer:** L1 + L2 + L3.

**First-principles 근거:**
- **L1:** Domain-driven design·RDF/OWL property·Schema.org·Dublin Core·JSON-LD — 모두 closed enumeration + 확장은 versioned schema.
- **L2:** OpenAPI tag·GraphQL union·Kubernetes OwnerReference — 모두 closed enum. open-vocab cousin(RDF wild)은 200+ ad-hoc predicates로 devolve.
- **L3 a:** audit이 누락 relation type을 정확히 명시 (`docs/research/...audit.md:243, 410-411, 559-565`) — solves·tests·covers·mitigates·parent·depends-on·linked-arch — naturally bounded set.
- **L3 b — Dashboard 요구:** audit §3.5 (lines 313-326) edge-type coloring을 missing piece로 지적. closed set이어야 switch 가능. open vocab이면 dashboard가 unknown kind 무시 또는 config matrix 폭증.
- **L3 c — Author drift risk:** open vocab → `solves-pains`·`solves-pain`·`pain-solved-by`·`addresses-pain` 4중 동의어. audit `:196-232` extractability 표가 이미 그 패턴. validator가 unknown 거절하는 것만이 유일한 해결.

**Antithesis 수용:** "6개월 안에 9번째 kind 필요할 수 있음. dashboard 벽." schema-version key (T-CSA.13) = 확장점. 새 kind = minor schema bump (1.0 → 1.1) + codemod. OpenAPI·GraphQL 패턴. closed-then-versioned > open-and-uncurated.

**6/10 (이름 정확도):** `parent`가 tier-mixing semantics 가짐 (Feature→R는 up-relation, Task→Task는 sibling). 향후 split 가능. T-CSA.4 구현 시 dogfood가 9번째 kind 요구하면 enum 1개 추가 — closed 원칙은 유지.

**Rejected:**
- *Open vocab + lint curation:* 동의어 drift 불가피. audit이 이미 그 실패 패턴 시연.
- *Field name = kind name (`linked-features`):* naming style 불일치(`linked-X` vs `solves-X` vs `tested-by`). field는 plural-noun(YAML ergonomics), kind는 singular-verb 로 register 분리.

**Implementation note:** §3.1 예시를 canonical kind name으로 수정. §3.4 "Edge kind enum" subsection 추가. `schemas/edge-kinds.schema.json` sibling artifact.

**Reversibility:** **Soft one-way door.** kind 추가 = cheap minor bump. 제거/rename = breaking, major bump + codemod. Trigger to reconsider: T-CSA.6 dogfood가 8개로 안 잡히는 kind 요구.

---

## OQ-CSA-8 — Persona ID prefix

**Decision:** **`PERSONA-N`** (3-char `PER-N` 거절).

**Confidence:** 9/10.

**Layer:** L1 + L3.

**First-principles 근거:**
- **L1:** ID prefix 3 factor — *clarity > collision > typing*. typing은 autocomplete·copy-paste로 amortize. prose-heavy spec에서 `PERSONA-1`은 즉독, `PER-1`은 "per? perimeter? performance?" context-switch.
- **L2:** GitHub `#123`·Jira `PROJ-123`·Linear `ENG-123` — 모두 3-8 char에 *real word 또는 unambiguous stem*. 3-char truncation이 새 모호성 만들면 패턴 위반.
- **L3 a — Repo precedent:** `ARCH-`·`RISK-`·`PAIN-`·`EDGE-`·`OPS-`·`ADR-` 모두 3-4 char에 영단어의 complete unambiguous stem. `PER-`는 "per"(Latin/English preposition)이라 stem 아님. `PERSONA-`가 패턴 follow.
- **L3 b — Audit 합의:** `docs/research/...audit.md:508` audit 자체 결론 = "Pick `PERSONA-1`·`PERSONA-EDGE-1`·`SCEN-1`". confidence 10/10.
- **L3 c — Typing cost 무시 가능:** `linked-personas: [PERSONA-1, PERSONA-2]` 35 char vs `PER-` 27 char. 13 phase × 20 ref ≈ 260 occurrences × 8 char = 2KB = file 크기 0.1%. autocomplete·copy-paste dominate.
- **L3 d — Future-proof:** `PERSONA-EDGE-N` (audit가 edge persona 위해 제안)이 자연스러운 복합. `PER-EDGE-N`은 "per-edge-N"으로 다른 의미.

**Antithesis 수용:** "grep 속도" — false. `grep PER-`는 `PERSONA-` substring도 매치 → superset, 시각 필터 비용 동일.

**Rejected:**
- *`PER-N`:* 모호한 stem. `solves-pains: [PER-3, PAIN-5]` 읽기 곤란.
- *`P-N`:* 단문자, `USER_NAMESPACE_PATTERN` 2+ floor 실패.
- *`USER-N`/`ROLE-N`:* 의미 broader, 미래 ROLE concept과 충돌 가능.

**Implementation note:** §4.1 lock (`PERSONA-N`).

**Reversibility:** **One-way door** (스펙 횡단 author 후). Trigger to reconsider: 없음. 간결성 주장이 실비용 안 됨.

---

## OQ-CSA-10 — Migrate codemod manual-review marking

**Decision:** **In-band marker + machine-readable index + lint ERROR**.

구체:
1. Codemod이 entity 직전에 `<!-- specrail:attrs-review-required reason="<short>" -->` HTML-comment marker 부착.
2. 동시에 `.specrail/migrate-report.json`에 모든 marker의 index 기록 (file path · line · entity ID · reason · ts).
3. Lint(`attrs-completeness.ts`)가 marker 존재 시 즉 ERROR (v0.1.0~0.3.0 WARN window 무관 — always blocking).
4. Resolution: 사용자가 attrs 편집 → marker 수동 제거 → lint pass. 또는 `specrail audit --accept-codemod-conflict` 로 명시 accept.

**Confidence:** 8/10.

**Layer:** L1 + L2 + L3.

**First-principles 근거:**
- **L1:** jscodeshift·recast·libcst·OpenRewrite — 모든 mature codemod가 *best-effort change + self-removing breadcrumb in-file* 패턴. (a) git diff에 시각화, (b) breadcrumb이 entity와 co-locate, (c) lint가 기계적 강제.
- **L2:** Next.js codemod·React codemod·`cargo fix --allow-dirty` — 모두 `// TODO(codemod): ...` 형식 in-band 마커.
- **L3 a — In-band > out-of-band:** author는 *파일*을 검토, 별도 report 아님. 기존 `<!-- specrail:ignore-start --> ... <!-- specrail:ignore-end -->` 패밀리 (`docs/research/...audit.md:60, 171`)가 이 컨벤션이 이 repo에서 동작 시연. 동일 family 재사용.
- **L3 b — Hybrid > either alone:**
  - Index alone: 까먹기 쉬움. merge → ERROR 미발생 (JSON 안 읽힘).
  - Marker alone: enumerate 어려움 (count 못함). CI gate/dashboard view가 count 필요.
  - Both: in-file는 human surface, JSON은 machine surface, lint가 양자 consistency 강제 (marker without JSON row = ERROR, vice versa).
- **L3 c — Lint ERROR가 load-bearing:** WARN이면 marker는 단순 문서. ERROR면 merge 차단. proposal §11 RISK-CSA-1 mitigation("T-CSA.6 manual review 단계 명시")의 enforcement 메커니즘.

**Antithesis 수용:** "별도 `migrate-report.md`가 더 읽기 좋음. 13 파일 산재한 marker보다 한 파일에서 검토." 그러나 (a) report는 entity와 co-locate 안 함, context-switch 비용, (b) git diff view에서 in-line marker가 더 명확, (c) report file은 entity 편집 시 즉 stale, marker는 entity에 attached.

**Tradeoff tension:** in-band marker = file noise 1 line per conflict. 13 file × ~10% conflict ≈ 30 extra lines. bounded.

**Rejected:**
- *Separate `migrate-report.md` only:* author skip → ERROR 미발생 → broken attrs merge.
- *attrs block 안 status field (`status: needs-review`):* entity status(Approved/Draft) vs migration status 두 concept 한 field에 혼재. 거절.
- *Codemod이 ambiguous entity skip:* 부분 마이그레이션 + skip 신호 없음 → author가 "왜 일부만 attrs?" 알 수 없음.
- *Codemod이 first conflict에서 fail:* fails-loudly 매력적이나 90% 기계적 작업을 10% conflict가 차단. codemod 가치 무력화.

**Implementation note:**
- §7.7 `bin/specrail.ts` — `migrate-report.json` artifact + marker syntax 정의 추가.
- §7.5 `attrs-completeness.ts` — "review-required marker 존재 시 ERROR (WARN window 무관)" 추가.
- T-CSA.5 RED test — codemod이 `yaml-conflict`·`ambiguous-id-mapping` 케이스에서 marker+JSON 발행.

**Reversibility:** **Two-way door.** marker format·report schema 진화 가능. constraint는 lint가 comment shape 인식.

---

## Coherence Check

| Invariant | Check |
|---|---|
| ID prefix style 일관성 | `FLN-`·`FLE-`·`PERSONA-`·`SCEN-` 모두 3+ char unambiguous. 기존 `ARCH-`/`RISK-`/`PAIN-` family와 coherent. ✓ |
| regex floor 2+ uppercase 보존 | 모든 신규 ID가 `[A-Z][A-Z0-9]+-\d+` clear. floor 낮출 필요 없음. ✓ |
| Edge kind 명명 스타일 | kind = verb-form (`solves`·`tested-by`·`mitigates`), YAML field = plural-noun (`solves-pains`·`tested-by`·`mitigates-risks`). 두 register intentional, no collision. ✓ |
| WARN→ERROR transition timing | OQ-CSA-3 v0.4.0 ERROR cut + §4.3 legacy `S\d` v0.4.0 ERROR cut. 동기화. ✓ |
| Codemod marker vs WARN window | OQ-CSA-10 marker는 always-blocking ERROR. OQ-CSA-3 WARN window와 의도적 asymmetry — known-ambiguous migration ≠ missing-but-uniformly-WARNed attribute. ✓ |
| attrs placement vs marker placement | 둘 다 heading-adjacent. read order = `<marker?> → <heading> → <attrs> → <prose>`. coherent. ✓ |
| Innovation token budget | 0/3 소비. 모든 결정이 JSON Schema + YAML + HTML-comment marker family + closed enum. §11 RISK-CSA-6 hold. ✓ |
| Reversibility profile | 2-way: OQ-CSA-1·3·10. 1-way: OQ-CSA-2·5·8 (모두 mechanical codemod로 undoable, architectural 아님). ✓ |

---

## 면책

본 분석은 architect agent(opus, read-only) 단일 pass. 별 reviewer lane은 미수행. confidence 7-8/10 항목(OQ-CSA-3·5·10)은 명시적 trigger condition으로 calibrate. 9/10 항목은 regex/parser invariant를 source에서 직접 verify.

다음 단계는 사용자 결정 — 6개 권장을 그대로 채택할지, per-OQ 재논의할지, 일부 reject할지.
