# Delta — Phase 09 (NFR)

**Base:** `docs/spec/09-non-functional-requirements.md`
**Proposal:** [../proposal.md](../proposal.md)

## ADD — NFR-PERF-6

```markdown
<!-- specrail:attrs id=NFR-PERF-6 -->
\`\`\`yaml
status: proposed
target: "≤16"
unit: millisecond
measure-method: "Client perf.now() between focus state mutation and Connections panel commit"
violates-action: "warn (block 50)"
linked-arch: [ARCH-1]
linked-r: [R2]
linked-features: [F2.4]
\`\`\`
<!-- /specrail:attrs -->
```

표 entry 추가:
| NFR-PERF-6 | Connections panel refresh on focus change | ms | ≤ 16 | client perf API | warn (block 50) |

**Rationale:** Connections panel 은 cached graph query 에서 derive 되어 API 호출이 없음.
React reconciliation + neighbor 추출 (≤ 50 typical) 은 단일 frame (16.7ms) 안에 끝나야 hover 시 깜빡임 없음.

## ADD — NFR-COMPAT-1

```markdown
<!-- specrail:attrs id=NFR-COMPAT-1 -->
\`\`\`yaml
status: proposed
target: "100%"
unit: percent
measure-method: "Vitest fixture: attrs block with all 8 closed-enum edge keys → assert 8 typed-refs out"
violates-action: "release block"
linked-arch: [ARCH-4]
linked-features: [F2.5]
\`\`\`
<!-- /specrail:attrs -->
```

표 entry 추가:
| NFR-COMPAT-1 | attrs typed-ref extraction completeness | % | 100 | Vitest fixture | release block |

**Rationale:** 모든 8 closed-enum yaml key 가 typed-ref 로 surface 되어야 graph 의 semantic richness 보장. 빠진 key 1개라도 silent data loss.

## MODIFIED — NFR-PERF-2

기존 `Graph layout p95 (500 nodes) ≤ 200ms` 그대로 유지. 단:
> 측정 방법에 명시: typed-edge variant (8 kinds 의 edge styling 적용) 와 plain variant 모두 동일 budget.

## MODIFIED — NFR-SCAL-2

기존 `Phase 당 spec ID 처리 ≥ 500 nodes / 1000 edges` 변화 없음. typed-ref 도입으로 edge 가 ~2 배 증가 가능성 (~2000 → ~4000 spec dependent) — bench fixture 도 그에 맞춰 업데이트.
