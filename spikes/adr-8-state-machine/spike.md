# Spike: ADR-8 — Phase state machine pattern

**Trigger:** Phase 12 ADR-8 (explicit state machine), Phase 13 T0.3
**Date:** 2026-05-13
**Status:** **PASSED**

## Hypothesis

ADR-8 — Phase status를 deterministic state machine으로 강제. Empty → Draft → Approved 외 전이 차단. INV-3 enforce.

## Acceptance

- [x] PhaseStatus enum 3개 (Empty / Draft / Approved)
- [x] Empty → Draft allowed
- [x] Empty → Approved blocked (INV-3 우회 시도 차단)
- [x] Draft → Approved allowed (사용자 명시 승인)
- [x] Approved → Draft allowed (DELTA re-edit)
- [x] Approved → Empty blocked (un-init 불가)
- [x] assertTransition 위반 시 INV-3 violation throw

## Findings

```
RUN  tests/state-machine.test.ts (7 tests)
  ✓ allows Empty → Draft
  ✓ blocks Empty → Approved (skill 우회 시도)
  ✓ allows Draft → Approved (사용자 명시 승인)
  ✓ allows Approved → Draft (DELTA re-edit)
  ✓ blocks Approved → Empty (cannot un-init)
  ✓ assertTransition throws on disallowed
  ✓ assertTransition no-throw on allowed

7 passed (7)
```

코드: `src/state/machine.ts` — 27줄, 단순 transition table.

## Decision impact

- **ADR-8 (explicit state machine):** **PASSED.** 단순 enum + table로 충분.
- **State source-of-truth (ADR-8 DELTA):** frontmatter `status` 필드가 primary. Cache는 derived. 본 spike는 transition table 검증만, source-of-truth 통합은 T1.6에서.
- **INV-3:** Throw mechanism 작동.

## References

- Phase 12 ADR-8
- Phase 13 T0.3, T1.6 (transition gate)
- Phase 4 INV-3, SM-Phase-Lifecycle
