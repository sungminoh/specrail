---
name: phase-12-adr-risks
description: ADR (Architecture Decision Records) with alternatives + Risk register (LxI matrix) + 통합 Open Questions.
trigger-words: adr-risks, ADR, decision record, risk register, alternatives
phase: 12
inputs-from: 모든 Phase의 ADR-CAND, Open Questions, Risk 단서
mode: GREENFIELD | DELTA
state-machine: explicit (ADR-8 — INV-3 transition gate enforced)
applies-to: 00-common (auto-inject)
---

# Phase 12: ADR + Risks

## Purpose

이전 phase에서 미뤄진 모든 구체 결정을 기록·정당화. 위험 정량화·완화 계획. 모든 Open Questions 통합.

## Inputs

- **모든 phase의 ADR-CAND-{n}** — Phase 8/9/10/11에서 미뤄진 결정
- **모든 phase의 Open Questions** — OQ-{phase}-{n}
- Phase 9 Threat / Risk 단서
- Phase 1 Assumption 표 (Risk Level)
- (DELTA) `docs/spec/12-adr-risks/` (기존 버전)

<HARD-GATE>
Phase 11 사용자 승인 없이 진행 금지.
</HARD-GATE>

## Mode 상속

- EXPANSION: 모든 alternatives 깊게 비교
- SELECTIVE: ADR 별로 mode 다를 수 있음 (Boring by default 우선)
- HOLD: 가장 reversible 한 옵션 default
- REDUCTION: ADR 최소 (Boring by default 강하게)

---

## Anti-Sycophancy

00-common 참조 + Phase 12 특화:

**금지:**
- "두 옵션 다 좋은 점이 있어요"
- "상황에 따라 다릅니다"
- "유연성을 위해 둘 다 지원..."
- "Best practice는..."

**대신:**
- 모든 ADR은 **하나의 결정 + 거절된 alternatives + 거절 이유** 명시
- Cognitive Pattern: **Boring by default** — 약 3개 innovation token. 나머지는 검증 기술.
- Cognitive Pattern: **Two-way doors fast / one-way doors slow** (Bezos)
- Cognitive Pattern: **Reversibility preference** — feature flag, canary로 cost of being wrong 낮춤

---

## Reasoning Procedure

1. 모든 phase 훑어 ADR-CAND 모음
2. 모든 phase 훑어 Open Questions 모음
3. 각 ADR-CAND를 "지금 결정 가능 / 미루기" 분류
   - 지금: alternatives 조사 → 결정 → ADR 작성
   - 미루기: trigger condition 명시
4. Risk 도출 — Phase 1 Assumption High + Phase 9 Threat + 미루는 ADR
5. LxI matrix 작성
6. 각 Risk에 owner + monitoring + mitigation
7. 통합 Open Questions 표
8. Self-Check + 승인

---

## Constraints

1. **ADR per file** — 각 ADR-{n}는 별도 파일 `docs/spec/12-adr-risks/ADR-{n}-{topic}.md`.
2. **Status / Context / Decision / Alternatives ≥ 2 / Consequences** — 5 필드 강제.
3. **거절된 alternative마다 거절 이유** — "더 좋아 보여서" 금지.
4. **Risk LxI matrix** — Likelihood × Impact 그리드.
5. **모든 Risk에 owner, monitoring, mitigation** — orphan risk 0건.
6. **Open Questions 통합** — 흩어져 있던 OQ를 모음.
7. **Boring by default 추적** — innovation token 사용 3개 이하.

---

## Output Format

`docs/spec/12-adr-risks/` 디렉토리:

```
docs/spec/12-adr-risks/
├── ADR-1-{topic}.md
├── ADR-2-{topic}.md
├── ...
├── risks.md
├── open-questions.md
└── innovation-tokens.md
```

### 각 ADR 파일 형식

````markdown
# ADR-{n}: {결정 제목}

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-{m}
**Date:** YYYY-MM-DD
**Trigger:** ADR-CAND-{n} (Phase {x} §{y})
**Innovation token:** Yes (1/3) | No (boring choice)

## Context

<왜 이 결정이 필요한가. 어느 phase에서 미뤄졌나. 어떤 제약이 있나.>

관련 NFR: NFR-{...}
관련 Spec: S{...}

## Decision

<선택한 옵션. 한 문장.>

## Alternatives Considered

### 옵션 A (선택됨): <이름>

- **장점:** <구체>
- **단점:** <구체>
- **Reversibility:** Two-way (feature flag로 전환 가능) | One-way

### 옵션 B (거절됨): <이름>

- **장점:** <구체>
- **단점:** <구체>
- **거절 이유:** <왜 채택 안 했나, 구체>

### 옵션 C (거절됨): <이름>

- **장점:**
- **단점:**
- **거절 이유:**

## Consequences

### 긍정
- <구체 영향>

### 부정 (수용 가능)
- <구체 영향>

### 영향받는 phase·ARCH
- Phase {x}: ...
- ARCH-{n}: ...

## Trigger to Re-evaluate

<언제 이 결정을 다시 볼 것인가. 예: "사용자 N명 도달" / "EXT-{n} SLA 변화" / "년 1회 정기">

## References

- Phase {x} ADR-CAND-{n}
- 외부 출처 (있을 시)
````

### `risks.md` 형식

````markdown
# Risk Register

**Mode:** {inherited}
**Date:** YYYY-MM-DD

## Risk Matrix

```
            Impact: Low      Medium     High      Critical
Likely      ┌──────────┬──────────┬──────────┬──────────┐
High        │          │          │ RISK-{n} │ RISK-{m} │
            ├──────────┼──────────┼──────────┼──────────┤
Medium      │          │ RISK-{n} │ RISK-{m} │          │
            ├──────────┼──────────┼──────────┼──────────┤
Low         │ RISK-{n} │ RISK-{m} │          │          │
            ├──────────┼──────────┼──────────┼──────────┤
Rare        │          │          │ RISK-{n} │          │
            └──────────┴──────────┴──────────┴──────────┘
```

## Risk 표

| ID | 위험 | Likelihood | Impact | LxI | Owner | Monitoring | Mitigation |
|---|---|---|---|---|---|---|---|
| RISK-{n} | <위험> | High/Med/Low/Rare | Low/Med/High/Critical | <조합> | <역할> | OPS-{n} alert | <완화 방법 + NFR / ADR 인용> |
| ... | ... | ... | ... | ... | ... | ... | ... |

## Risk 처리 정책

- **High×Critical 또는 High×High:** 즉시 mitigation 구현. 출시 전 cleared.
- **Med×High 또는 High×Med:** mitigation 계획 + monitoring. 출시 후 1개월 review.
- **나머지:** monitor만, mitigation 후순위.
````

### `open-questions.md` 형식

모든 phase의 OQ를 한 곳에:

````markdown
# Open Questions (통합)

**Date:** YYYY-MM-DD
**Source:** Phase 1-11 의 모든 OQ

## Blocking (다음 단계 진행 막음)

| ID | 질문 | Source phase | 결정자 | 마감 |
|---|---|---|---|---|
| OQ-{x}-{n} | ... | Phase {x} | <역할> | YYYY-MM-DD |

## Non-blocking (배경 결정)

| ID | 질문 | Source phase | 결정자 | 마감 (soft) |
|---|---|---|---|---|

## 결정 이력

각 OQ 답변되면 이 표에 추가:

| ID | 답변 | 근거 ADR | 결정 일자 |
|---|---|---|---|
````

### `innovation-tokens.md` 형식

Boring by default 추적:

````markdown
# Innovation Token 사용 현황

원칙: 약 3개. 나머지는 검증된 기술.

## 사용 중

| Token # | 영역 | 선택 | 정당화 | ADR |
|---|---|---|---|---|
| 1/3 | <영역 1> | <기술 / 패턴> | <왜 검증 안 된 길이 더 가치 있는가> | ADR-{n} |
| 2/3 | <영역 2> | ... | ... | ADR-{n} |

## 사용 안 한 결정 (boring picks)

| 영역 | 선택 | 이유 |
|---|---|---|
| <영역> | <검증된 기술> | <시장 표준 / 도구 풍부> |
| ... | ... | ... |
````

---

## DELTA Mode

기존 ADR/Risk 위에 변경.

### 형식

`changes/{date}-{topic}/adr/`:

````markdown
## Superseded ADR
ADR-{n}는 ADR-{m}으로 superseded. 기존 ADR 파일 status 변경.

## NEW ADR
ADR-{m+1}-{topic}.md (full)

## ADDED Risks
| ID | 위험 | LxI | Mitigation |

## RESOLVED Risks
- RISK-{n}: 더 이상 유효 안 함 (이유)

## NEW Open Questions
새 OQ 추가, 통합 표 갱신
````

---

## Self-Check

```bash
# ADR 파일 형식 검증
ls 12-adr-risks/ADR-*.md | while read f; do
  for field in "Status:" "Context" "Decision" "Alternatives" "Consequences"; do
    grep -q "$field" "$f" || echo "$f: $field 누락"
  done
done

# 모든 Alternative에 거절 이유
grep -A2 "거절됨\|Rejected" 12-adr-risks/ADR-*.md | grep -c "거절 이유\|Reason"

# Risk LxI 매트릭스 존재
grep -c "Risk Matrix\|LxI" 12-adr-risks/risks.md

# 모든 Risk에 owner / monitoring / mitigation
grep -A1 "^\| RISK-" 12-adr-risks/risks.md | awk -F'|' 'NF >= 9'

# Innovation token 3개 이하
grep -E "^\| [0-9]+/3" 12-adr-risks/innovation-tokens.md | wc -l   # 3 이하

# 통합 OQ 표 (이전 phase OQ 모두 포함)
grep -oE 'OQ-[0-9]+-[0-9]+' docs/spec/0[1-9]*.md docs/spec/10*.md docs/spec/11*.md | sort -u > all_oq.txt
grep -oE 'OQ-[0-9]+-[0-9]+' 12-adr-risks/open-questions.md | sort -u > listed_oq.txt
diff all_oq.txt listed_oq.txt
```

체크리스트:
- [ ] 모든 ADR-CAND가 ADR로 결정됨 또는 trigger condition으로 미룸
- [ ] 각 ADR에 alternatives ≥ 2
- [ ] 각 거절된 alternative에 거절 이유
- [ ] Risk LxI matrix
- [ ] 모든 Risk에 owner / monitoring / mitigation
- [ ] Innovation token ≤ 3
- [ ] 통합 Open Questions 표
- [ ] Blocking OQ에 결정자 + 마감
- [ ] Boring by default 패턴 (사용 안 한 결정 명시)

---

<HARD-GATE>
Self-check 통과 + 사용자 승인. Phase 13 진행.
</HARD-GATE>

---

## Runtime Integration

### State preconditions
- Previous phase status=Approved (INV-3, F2.2 transition gate)

### Auto-inject (F1.2)
이전 phase frontmatter의 `refs` 필드 + R/F/S/ENT/INV ID set이 input으로 inject됨.

### Hooks
- Pre-commit: F2.3 ID consistency + F2.4 schema validation
- Phase transition: F2.2 gate (frontmatter primary)
