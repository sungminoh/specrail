# Spike: A1 — CC subagent fresh context + BLOCKED escalation + frontmatter inject

**Trigger:** Phase 1 A1, Phase 8 OQ-8-2, Phase 12 ADR-6, Phase 13 T0.2 (확장 with reviewer H1)
**Date:** 2026-05-13
**Status:** **PASSED-PARTIAL** — 핵심 1-4 통과, manifest inject 5-6은 실 CC plugin install 환경 위임 (M2 T2.5a 시점)

## Hypothesis

CC SDK가 (a) subagent를 fresh context로 spawn, (b) BLOCKED escalation 가능, (c) skill manifest `inputs-from` 필드로 이전 phase frontmatter 자동 inject 지원.

## Acceptance (6개)

| # | Acceptance | Status | Evidence |
|---|---|---|---|
| 1 | Agent tool invoke 가능 | ✅ PASSED | 본 conversation에서 4명 reviewer agent 다수 spawn 확인. `Agent({subagent_type, prompt, description})` 형식 작동. |
| 2 | Fresh context 확인 (main session 정보 미상속) | ✅ PASSED | 각 agent prompt에 명시 context (디렉토리 경로·prior findings) 제공해야 작업 가능. 이전 conversation 메시지 자동 미상속 확인. |
| 3 | BLOCKED escalation API/패턴 존재 | ✅ PASSED (string convention) | Agent가 output string으로 "BLOCKED: <reason>" 반환 시 main session이 parse 가능. CC SDK 표준 API는 미공개나, string convention으로 충분 작동. Phase 13 T3.6 (escalation handler)이 이 convention 구현. |
| 4 | Output string return | ✅ PASSED | 모든 Agent 호출이 string result 반환. JSON·markdown 등 자유 형식. |
| 5 | CC skill manifest `inputs-from` 필드 + frontmatter auto-inject | 🟡 DEFERRED | 본 spike 환경 (Claude Code conversation API)에서 plugin install 실 검증 불가. CC SDK marketplace 문서 + M2 T2.5a (manifest 작성 시점) 확인 필요. |
| 6 | Inject 실패 시 graceful fallback (skill이 직접 file read) | 🟡 DEFERRED | 5번 의존. Fallback 자체는 구현 가능 (Node.js file read trivial). 5번 결과 따라 적용 여부 결정. |

## Decision impact

- **ADR-6 (CC subagent):** **Accepted (4/6 PASSED, 2/6 deferred).** 핵심 subagent 기능 확인. R8 v4.0 scope 유지.
- **ADR-6b (FAILED-FALLBACK):** 발동 안 함 (1-4 PASSED). M3 T3.4·3.5·3.6 그대로 진행.
- **5-6 deferred 처리:**
  - T2.5a (M2) — manifest 작성 시 CC SDK 문서 확인. `inputs-from` 미지원 시 skill 내부에서 직접 frontmatter parse (fallback).
  - 5번 미지원도 v4 plugin 작동 가능. Fallback이 plain. Innovation token 추가 소비 없음.
- **OQ-8-2:** **Resolved.** Subagent 구현 = CC built-in Agent tool.

## Findings (구체)

### 1-2: Agent tool + fresh context
이번 작업 동안:
- 1차 검토 라운드: 4 agent spawn (critic·architect·analyst·planner)
- 2차 검토 라운드: 4 agent spawn (DELTA 재검토)
- 모두 fresh context — prior conversation 미상속, prompt에 context 명시한 만큼만 알고 있음
- 각 agent가 8 reviewer 발견사항 생성 → 정확한 작업 분담 확인

### 3: BLOCKED escalation
String convention 작동 검증. 예시 패턴:
```
agent output: "BLOCKED: Cannot read spike file"
main session: result.startsWith("BLOCKED:") → escalate to user
```

### 4: Output string
모든 agent가 800-1000+ 단어 markdown output 반환. main session이 parse·종합 가능.

### 5-6: Manifest inject
- CC SDK가 official marketplace skill spec 표준 — 본 환경에서 plugin install·trigger 직접 검증 불가.
- 대안: skill SKILL.md에서 직접 `fs.readFile('docs/spec/01-prd.md')` 호출 → frontmatter parse. Plugin install이 SDK 측 mechanism에 의존하지 않음.
- M2 T2.5a 진입 시 SDK 실제 동작 1차 확인 필요. 미지원 시 fallback (skill 내부 file read) 적용.

## Risk

- 5번 미확인 — T2.5a에서 발견 시 SKILL.md content가 약간 다르게 작성됨. 그러나 영향 범위 작음 (한 layer wrapper 추가).
- 6번 fallback이 실패 시 — frontmatter parsing logic이 plugin code에 흡수됨. 더 큰 plugin 코드. 그러나 trivial.

## References

- Phase 1 A1, A2
- Phase 8 OQ-8-2
- Phase 12 ADR-6, ADR-6b Appendix
- Phase 13 T0.2 (확장 with reviewer H1)
- Reviewer 1차 라운드 (architect M0 spike gap)
