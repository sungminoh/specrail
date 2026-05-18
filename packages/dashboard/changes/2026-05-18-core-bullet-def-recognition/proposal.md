# Change Proposal: core extractDefinedIds — bullet-style definitions

**Status:** proposed
**Date:** 2026-05-18
**Capability:** core-bullet-def-recognition
**Predecessor:** M9 + DELTA-3 (commit `61f52b8`)
**Author:** dogfood — surfaced by DELTA-3 Quality mode

## Why

DELTA-3 의 Quality mode 가 dashboard 자기 spec 의 데이터 quality 를 surface 하다가 발견된 **incorrect dangling 분류**:

- AC-R2-6, AC-R2-7, AC-R2-8 — DELTA-2 에서 추가된 ACs. 모두 `- **AC-R2-N:** GIVEN ...` bullet 형태로 정의됨.
- Quality mode 가 이들을 "dangling" 으로 표시 — 다른 attrs block 의 `linked-ac` 에서 참조되지만 graph builder 가 "정의된 ID set" 에 없다고 판단.
- 실제로는 정의되어 있음. **False positive.**

**Root cause:** `@specrail/core` 의 `extractDefinedIds` 가 2가지 정의 패턴만 인식:
1. Heading: `## R1:` / `### F1.1:` 등
2. Attrs block: `<!-- specrail:attrs id=X -->`

bullet-style `- **AC-R1-1:**` 은 인식 못 함. 그러나 spec 전체에서 AC entries 는 거의 항상 bullet 으로 작성됨 — dashboard 자기 spec 에 38건의 AC bullet definition 이 존재.

이미 DELTA-2 의 `buildIdIndex` Pass-3 (web side) 는 bullet 패턴을 인식하지만, **core 가 인식하지 않으면 graph / runChecks / findOrphans / findDanglingRefs 가 모두 false positive 를 만듦.**

## What Changes

### MODIFIED

- **`@specrail/core/src/spec/ids.ts::extractDefinedIds`**: Pass-3 추가.
  - Bullet 패턴: `^\s*-\s+\*\*<ID>:\*\*\s+` 인식 (List item 안의 `**bold ID:**`).
  - Pattern 의 ID alternation 은 기존 `ID_AT_START` 와 동일하게 모든 closed-enum ID family 지원.

### Side effects

- `buildGraph` — bullet-defined IDs 가 graph node 로 추가됨. `data.nodes.length` 증가.
- `findOrphans` — 이전엔 정의가 없어 graph 에 없던 IDs 가 노드로 등장. 다른 entity 에서 참조가 없으면 orphan 으로 분류 가능 (정상 동작).
- `findDanglingRefs` — bullet-defined IDs 를 참조하는 edges 가 더 이상 dangling 아님 (정상 동작).
- `runChecks` — `orphan-id` / `dangling-ref` 발견 수 감소 예상 (false positive 제거).
- **Backward compatibility:** ID set 이 superset 으로 확대됨. 기존 클라이언트 깨지 않음.

### Test data point

DELTA-3 이후 dashboard 자기 spec 의 Quality mode:
- **Before fix:** 105 nodes (orphans + dangling).
- **Expected after fix:** dangling 항목 중 AC-R*-* 류 (~38건) 제거, 실제 dangling 만 남음 (PAIN-* 등 진짜 미정의 IDs).

## Acceptance Criteria

- **AC-CORE-1:** GIVEN markdown body with `- **AC-R1-1:** GIVEN ...` bullet, WHEN `extractDefinedIds(body)`, THEN AC-R1-1 가 출력 array 에 포함.
- **AC-CORE-2:** GIVEN dashboard own spec, WHEN dashboard graph endpoint 호출, THEN AC-R2-6/7/8/9/10/11 등이 `nodes` 에 포함되고 `findDanglingRefs` 에서 dangling 아님.
- **AC-CORE-3:** GIVEN inline bullet `- **F1.1:** description`, WHEN extractDefinedIds, THEN F1.1 도 동일하게 인식 (AC 전용이 아님, 모든 ID family).

## Impact

- **Phase 4** (Domain Model — SpecRef / Phase): no schema change.
- **Phase 10** (Test Strategy): new TC for bullet definition recognition.
- **Phase 13** (Impl plan): new T9.10 task.
- **No new API** — pure core function behavior change.

## Open Questions

| ID | 질문 | Resolved |
|---|---|---|
| OQ-CB-1 | Heading 안에 inline bullet 이 있으면 (예: `### R1: ...` 의 description 부분에 `- **AC-R1-1:**`)? | 둘 다 인식, dedupe 가 처리. |
| OQ-CB-2 | nested 리스트 들여쓰기는? (` - **ID:**` with leading spaces) | 인식. `^\s*-` 매칭. |
