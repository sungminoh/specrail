# Spike: ADR-9 — Graph incremental vs full-rebuild bench

**Trigger:** Phase 12 ADR-9 옵션 D 평가 (reviewer H2), Phase 13 T0.4
**Date:** 2026-05-13
**Status:** **PASSED — 옵션 D 채택 권장**

## Hypothesis

Reviewer H2 — Full rebuild every commit이 NFR-PERF-3 (<3s) 충족하면, ADR-9 옵션 D 채택해서 incremental 코드 불필요. Innovation token 회수 가능.

## Acceptance

- [x] 1000 ID across 13 file generator 구현
- [x] Cold full-rebuild 측정 (5회 평균)
- [x] Incremental rebuild 측정 (5회 평균)
- [x] 판정: full < 3000ms → 옵션 D / 초과 → 옵션 A

## Findings

```
1000 IDs across 13 files (nodes=1001, edges=4004)

Full rebuild:
  run 1: 47ms
  run 2: 24ms
  run 3: 28ms
  run 4: 19ms
  run 5: 19ms
  AVG: 28ms

Incremental:
  run 1-5: 1-2ms
  AVG: 2ms

NFR-PERF-4 target: <2000ms (cold)   → 28ms — 71x 여유
NFR-PERF-3 target: <3000ms (hook)   → 28ms — 100x 여유
NFR-PERF-5 target: <300ms (incr)    → 2ms — 150x 여유
```

## Decision impact

**ADR-9: 옵션 D (full rebuild every commit) 채택.**

Cascade:
- **Phase 12 ADR-9 status:** Conditional → **Accepted (옵션 D)**.
- **Phase 13 T2.2 (Graph incremental rebuild):** **SKIP.** M2에서 제거.
- **TC-74 (incremental rebuild):** **Deferred to v4.1** (incremental 추가 시 부활).
- **§10 Spec coverage matrix F4.1:** T2.1·2.2 → **T2.1만**.
- **Innovation token:** ADR-9 자리 **회수**. 3/3 → 2/3. 회수된 token을 ADR-6 (CC subagent) 또는 ADR-8 (state machine)에 추가 보강 가능. 또는 T0.2 H1 (CC SDK frontmatter inject) 검증 결과에 따라 새 ADR에 할당.

## 측정 환경

- Machine: macOS Darwin 25.2.0, Node v25.2.1
- unified 11.0.4 + remark-parse 11 + remark-frontmatter 5
- Synthetic 1000 ID across 13 files
- 단순 regex ID extraction (실 graph builder는 T2.1에서 AST traversal — 비용 약간 ↑ 예상)

**Risk:** 실 graph builder (T2.1 AST visit + 16개 ID 패턴) 구현 후 측정값이 늘 수 있음. 그러나 100배 여유라 큰 폭 증가에도 NFR-PERF-3 충족 거의 확정.

## References

- Phase 12 ADR-9 옵션 D
- Phase 13 T0.4, T2.2 (이제 SKIP), TC-74
- Reviewer H2 (1차 검토)
