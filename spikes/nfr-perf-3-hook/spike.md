# Spike: NFR-PERF-3 hook timeout 적정성

**Trigger:** Phase 9 NFR-PERF-3, Phase 13 T0.5, OQ-9-2
**Date:** 2026-05-13
**Status:** **PASSED — 3s 한계 유지 권장**

## Hypothesis

OQ-9-2: 큰 spec (1000+ ID)에 pre-commit hook이 3s 안에 끝나나? Hook 자체 실패율 NFR-AVAIL-6 <0.1% 충족 가능한가?

## Acceptance

- [x] 1000 ID across 13 file에서 hook 시뮬 (frontmatter parse + schema validate + ID consistency)
- [x] 5회 평균 + p95 측정
- [x] 판정: avg + p95 모두 <3000ms → 적정

## Findings

```
13 files × 80 IDs = 1040 IDs

Hook simulation:
  run 1: 43ms
  run 2: 24ms
  run 3: 21ms
  run 4: 19ms
  run 5: 19ms

avg: 25ms
p95: 43ms

NFR-PERF-3 target: <3000ms  → 120x 여유
```

## Decision impact

- **NFR-PERF-3 (<3s) 한계:** 매우 적정. 사실 1s로 줄여도 충족 가능. 현 한계 유지 권장 (사용자 머신 변동성 buffer).
- **OQ-9-2 (Blocking OQ):** **Resolved.** Hook timeout 3s 적정.
- **NFR-AVAIL-6 (hook 실패율 <0.1%):** Time-based 실패 0건 (모든 run 3s 이내).

## 측정 환경

- Machine: macOS Darwin 25.2.0, Node v25.2.1
- Hook 시뮬: remark parse + ajv validate + regex ID extract + diff
- IDS_PER_PHASE 80 → 13 file × 80 = 1040 IDs

**Caveat:** 실 hook은 추가 작업 가능 (telemetry event emit, schema 13개 cycle 등). 그러나 200-300ms 추가도 한계 내.

## References

- Phase 9 NFR-PERF-3, OQ-9-2
- Phase 13 T0.5
