---
name: phase-10-test-strategy
description: Pyramid (70/20/10), AC↔TC mapping, Edge case catalog, Performance test scenarios. Iron Law (TDD) 적용.
trigger-words: test-strategy, test strategy, TDD, pyramid, edge cases, regression
phase: 10
inputs-from: Phase 3 AC + Phase 4 INV + Phase 9 측정가능 NFR
mode: GREENFIELD | DELTA
state-machine: explicit (ADR-8 — INV-3 transition gate enforced)
applies-to: 00-common (auto-inject)
---

# Phase 10: Test Strategy

## Purpose

무엇을 어떻게 검증할지 사양화. AC가 곧 testable. **Iron Law: 모든 production code는 failing test를 통과시키기 위해서만 존재.**

## Inputs

- Phase 3 모든 AC (각 R 단위)
- Phase 4 모든 INV
- Phase 9 측정가능 NFR (Perf/Scal/Avail/Sec)
- Phase 5 시나리오별 path (E2E test)
- (DELTA) `docs/spec/10-test-strategy.md` (기존 버전)

<HARD-GATE>
Phase 9 사용자 승인 없이 진행 금지.
</HARD-GATE>

## Mode 상속

- EXPANSION: 추가 chaos test, perf scenario 더 가혹하게
- SELECTIVE: P0 cover하는 minimum + cherry-pick
- HOLD: P0 + P1 cover (회귀 prevention)
- REDUCTION: P0 만 (death-bug 방지선만)

---

## Anti-Sycophancy

00-common 참조 + Phase 10 특화:

**금지:**
- "테스트 커버리지를 높이면 좋아요" (% 없이)
- "Edge case 처리"
- "회귀 방지를 위해..."

**대신:**
- 모든 test는 AC ID / INV ID / NFR ID 인용 강제
- "어느 AC도 cover 안 하는 test" → 정당화 못 하면 cut
- "이 test가 빠지면 발생할 production 사고"를 명시

---

## Reasoning Procedure

1. AC 목록 받기 (Phase 3)
2. INV 목록 받기 (Phase 4)
3. 측정가능 NFR 받기 (Phase 9)
4. **Iron Law 적용**: 각 AC는 RED → GREEN test로 변환 가능 (failing test 먼저).
5. Test pyramid 결정 (default 70/20/10)
6. AC ↔ TC 매핑
7. INV ↔ TC 매핑
8. Edge case catalog (시간·동시성·i18n·auth boundary·empty·network)
9. Performance test scenario (NFR-PERF별)
10. Regression policy
11. Self-Check + 승인

---

## Constraints

1. **Iron Law**: production code는 failing test 통과 위해서만. 코드 먼저 쓰면 삭제.
2. **모든 AC → 최소 1 TC** — cover 안 되는 AC 0건.
3. **모든 INV → integration test** — 단위 test로 검증 안 됨.
4. **모든 측정가능 NFR → perf test scenario**.
5. **Edge case 명시 catalog** — `EDGE-{n}` ID.
6. **Test pyramid 비율 명시** — 단순 "balanced" 금지.
7. **Flakiness risk 표시** — 시간·외부·random·순서 의존 test는 flag.
8. **No Placeholders** — "테스트 추가" 금지.

---

## Output Format

````markdown
# Test Strategy

**Mode:** {inherited}
**Inputs:** Phase 3 AC, Phase 4 INV, Phase 9 NFR
**Date:** YYYY-MM-DD

## 1. Test Pyramid

```
        ┌──────┐
        │ E2E  │  10%
        ├──────┤
        │ Integ│  20%
        ├──────┤
        │ Unit │  70%
        └──────┘
```

| 종류 | 비율 | 대상 | 도구 (ADR-CAND-{n}) |
|---|---|---|---|
| Unit | 70% | 도메인 로직, validation, state transition | <ADR-CAND> |
| Integration | 20% | Container 간, INV | <ADR-CAND> |
| E2E | 10% | 시나리오 path, 핵심 flow | <ADR-CAND> |

근거: 작은 unit은 빠르고 안정. E2E는 비싸고 flaky. mode가 EXPANSION 같으면 80/15/5로 unit 강화.

## 2. AC ↔ TC Mapping

각 AC는 최소 1개 TC.

| AC ID | TC ID | TC 이름 | Layer | 구체 |
|---|---|---|---|---|
| AC-R{n}-{m} | TC-{n} | <이름> | Unit/Integ/E2E | GIVEN/WHEN/THEN |
| ... | ... | ... | ... | ... |

## 3. INV ↔ TC Mapping

| INV ID | TC ID | TC 이름 | Layer |
|---|---|---|---|
| INV-{n} | TC-{n} | <이름> | Integ |
| ... | ... | ... | ... |

## 4. Edge Case Catalog

`EDGE-{n}` ID.

### 시간 / 시간대

| ID | Edge | 검증 TC |
|---|---|---|
| EDGE-{n} | <자정·DST·만료 경계·윤년·시간대 변환> | TC-{n} |

### 동시성 / Race Condition

| ID | Edge | 검증 TC |
|---|---|---|
| EDGE-{n} | <동시 요청·중복 webhook·세션 만료 직전 등> | TC-{n} |

### i18n / 인코딩

| ID | Edge | 검증 TC |
|---|---|---|
| EDGE-{n} | <한국어/일본어 등 NFC·emoji·RTL·매우 긴 입력> | TC-{n} |

### Auth Boundary / IDOR (multi-user product)

| ID | Edge | 검증 TC |
|---|---|---|
| EDGE-{n} | <다른 user resource 접근·만료 토큰·재사용 토큰> | TC-{n} |

### Empty / Boundary Input

| ID | Edge | 검증 TC |
|---|---|---|
| EDGE-{n} | <nil·empty string·max length·max+1> | TC-{n} |

### Network / External (해당 시)

| ID | Edge | 검증 TC |
|---|---|---|
| EDGE-{n} | <EXT timeout·malformed response·connection 고갈> | TC-{n} |

## 5. Performance Test Scenarios

각 NFR-PERF·SCAL·AVAIL에 대해 perf TC.

| NFR ID | TC ID | 시나리오 |
|---|---|---|
| NFR-PERF-{n} | TC-{n} | <RPS·duration·percentile 검증> |
| NFR-SCAL-{n} | TC-{n} | <동시 사용자·peak·spike test> |
| NFR-AVAIL-{n} | TC-{n} | <DR drill·RPO/RTO 검증> |

## 6. Test Ambition Check

각 핵심 기능 (P0 F)에 대해 답:

- **2am Friday test:** 새벽 2시 금요일에 ship해도 안 깨질 거란 자신을 줄 test는?
- **Hostile QA test:** 깨려고 작정한 QA가 쓸 test는?
- **Chaos test:** 외부 의존 무작위로 죽일 때 살아남는 test는?

| Feature | 2am test | Hostile test | Chaos test |
|---|---|---|---|
| <F{n}> | <TC 조합> | <TC 조합> | <TC 조합 + 환경 조건> |

## 7. Regression Policy

- 모든 bug fix → 그 bug에 대한 regression TC 추가 (TC-{n}-regression)
- E2E suite는 PR마다 P0 시나리오 모두
- Perf test는 release 전 + 주 1회
- Chaos test는 monthly (해당 시)
- Flaky test 격리: 3회 연속 fail 또는 retry로 succeed → quarantine, 24h 내 fix 또는 삭제

## 8. Test Framework Detection (Brownfield)

DELTA mode에서 기존 test framework 자동 감지:

```bash
# Node.js
test -f package.json && jq '.devDependencies | keys[]' package.json | grep -iE "jest|vitest|mocha|playwright|cypress"

# Python
test -f pyproject.toml && grep -E "pytest|unittest" pyproject.toml

# Ruby
test -f Gemfile && grep -E "rspec|minitest" Gemfile

# Go
test -f go.mod && grep -E "testify|ginkgo" go.mod
```

기존 framework 따름. 새 framework 도입은 ADR-CAND.

## 9. Flakiness Risk Flags

| TC | 위험 |
|---|---|
| TC-{n} (race) | 동시성 — flaky 가능. 격리 + 재시도 logic |
| TC-{m} (EXT timeout) | 외부 의존 — mock으로. 실 EXT는 staging만 |
| TC-{k} (DR 시뮬) | 시간 의존 — fixed clock 사용 |

## 10. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-10-1 | <E2E framework 선택> | Eng | N (ADR-CAND-{n}) |
| OQ-10-2 | <Perf test 환경> | Eng | Y |

## 11. 다음 phase 인풋

Phase 11 (Operations)에:
- Perf test scenario (production monitoring 후보)
- Chaos test (production injection 후보)

Phase 13 (Implementation)에:
- 모든 TC ID + 시나리오 (각 task에 RED test로)
````

---

## DELTA Mode

기존 test 위에 변경.

### 형식

`changes/{date}-{topic}/deltas/10-test-delta.md`:

````markdown
## ADDED TC
| TC ID | TC 이름 | Cover (AC/INV/NFR) | Layer |

## MODIFIED TC
### TC-{existing}
- Changed: <given/when/then 변경분>
- Reason

## REMOVED TC
- TC-{n}: 더 이상 유효 안 함 / 새 TC로 대체

## ADDED Edge Cases
| EDGE ID | 시나리오 | TC |

## Regression TC (이번 변경으로 추가)
| TC | 어떤 bug 방지 |
````

---

## Self-Check

```bash
# AC cover 검증 (모든 AC가 TC 인용 있어야)
grep -oE 'AC-R[0-9]+-[0-9]+' 03-features.md | sort -u > all_ac.txt
grep -oE 'AC-R[0-9]+-[0-9]+' 10-test-strategy.md | sort -u > covered_ac.txt
diff all_ac.txt covered_ac.txt   # 비어 있어야

# INV cover
grep -oE 'INV-[0-9]+' 04-domain-model.md | sort -u > all_inv.txt
grep -oE 'INV-[0-9]+' 10-test-strategy.md | sort -u > covered_inv.txt
diff all_inv.txt covered_inv.txt

# NFR cover (측정가능)
grep -E "NFR-(PERF|SCAL|AVAIL)-" 09-non-functional-requirements.md | wc -l
grep -E "NFR-(PERF|SCAL|AVAIL)-" 10-test-strategy.md | wc -l

# TC ID 형식
grep -oE 'TC-[0-9]+' 10-test-strategy.md | sort -u | wc -l

# Edge case 카테고리 6종
for cat in 시간 동시성 i18n Auth Empty Network; do
  grep -q "$cat" 10-test-strategy.md || echo "Edge category $cat 누락"
done

# GIVEN/WHEN/THEN 사용
grep -c "GIVEN" 10-test-strategy.md
grep -c "WHEN" 10-test-strategy.md
grep -c "THEN" 10-test-strategy.md

# Pyramid 비율 명시
grep -E "70%|80%|20%|10%|15%" 10-test-strategy.md
```

체크리스트:
- [ ] Iron Law 명시
- [ ] Pyramid 비율 명시
- [ ] 모든 AC가 최소 1 TC
- [ ] 모든 INV가 integration test
- [ ] 모든 측정가능 NFR이 perf scenario
- [ ] Edge category 6종
- [ ] Test ambition 답변
- [ ] Regression policy
- [ ] Flakiness flag
- [ ] Brownfield: 기존 framework 감지 + 따름

---

<HARD-GATE>
Self-check 통과 + 사용자 승인. Phase 11 진행.
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
