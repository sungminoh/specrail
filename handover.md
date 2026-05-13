# v4 Plugin Spec 작업 인계 — Full Context

## 한 줄 요약

**Planning Pipeline harness의 v4 버전 (Claude Code plugin)** 을 사양화하는 중. v4 plugin 자체의 spec을 v3 harness로 13단계 작성. 이 작업물이 곧 plugin의 example.

---

## 큰 그림 — Planning Pipeline이 뭐냐

### Planning Pipeline v3 (이미 ship됨, OSS)

AI 시대 builder가 Claude Code에 던지기 직전 모든 결정을 사양화하는 **13단계 prompt collection (markdown)**.

```
01 PRD → 02 Personas/Journey → 03 Features → 04 Domain Model →
05 User Flow → 06 IA → 07 Wireframe → 08 Architecture → 09 NFR →
10 Test Strategy → 11 Operations → 12 ADR+Risks → 13 Implementation Plan
```

- 각 phase는 markdown prompt 파일
- 사용자가 LLM에 paste → 산출물 작성 → 다음 phase
- HARD-GATE (이전 phase 미승인 시 다음 진입 금지) + Anti-Sycophancy + Forcing questions
- gstack + Superpowers + OpenSpec 패턴 통합
- 도메인 무관 (메인 prompt는 placeholder만, examples/ 디렉토리에 self-application example)

### v3의 한계 (사용자가 직접 경험)

1. **환각 ID** — Phase 5에서 "S1.2.3" 인용했는데 Phase 3에 정의 X. self-check grep으로 사후 발견
2. **사용자 기억 의존** — "Phase 3에서 R1 뭐였지?" 매번 ctrl-F
3. **HARD-GATE 양심 의존** — LLM이 무시하면 사용자가 잡아야
4. **검토 cumbersome** — 14개 markdown cross-reference 수동
5. **Self-check grep 잊음** — 사용자가 명령 안 실행하면 무용

### v4 (지금 만드는 것)

**Claude Code plugin** — v3의 약점을 도구로 강제.

- **Skills (13개):** 각 phase가 별 skill. 이전 phase frontmatter를 다음 phase input으로 자동 inject.
- **Hooks:** pre-commit이 self-check 자동 실행, phase transition gate가 미승인 차단, schema 검증.
- **Auto-gen ID + Resolver:** plugin이 unique ID 부여. 인용 시 valid list만 노출 → 환각 ID 원천 차단.
- **Dependency graph:** DELTA 변경 시 영향 phase 자동 식별 (transitive).
- **Superpowers 패턴:** Phase 13 implementation에 fresh subagent + 2-stage review.
- **Telemetry:** opt-in 사용자 metric (KPI 측정용, privacy first).

**Dashboard는 v4.5 cycle로 분리** — 사용자 push back. "Boil the Lake = 단일 module. 두 product 동시는 Ocean." Harness 먼저 ship → 사용자 사용 → dashboard.

---

## "Example 만든다"는 게 무슨 의미

### Self-application 패턴

v3 OSS repo의 `examples/self-application/` 디렉토리에는 v3 harness가 **자기 자신을 13단계로 사양화한** 산출물이 있음. 즉:

- v3 메인 prompt 14개 = product
- v3 self-application example 14개 = 그 product의 spec (PRD·Persona·Features...·ADR·Implementation Plan)

이 example이 사용자에게 보여주는 것: "harness를 어떻게 사용하는지, 산출물이 어떤 형식인지" 구체 예시.

### v4도 동일 패턴 — **이 작업 자체가 그 example**

- v4 plugin (skill + hook + builder) = product (앞으로 만들 것)
- 지금 작성 중인 `docs/spec/01-prd.md`·`02-personas-journey.md`·... = v4 plugin의 spec = **plugin의 example**

즉:
1. 지금 이 spec 작성 작업이 끝나면 → Phase 13 Implementation Plan에 따라 plugin 코드 작성
2. 동시에 이 작성된 spec 자체가 plugin OSS repo의 `examples/v4-self-application/`이 됨
3. 사용자가 plugin install 후 "어떻게 쓰는지" 보고 싶으면 이 example 참조

### 중요 제약 (사용자 합의)

**plugin 만드는 동안 v3 example 참조 금지.** v3 메인 14 prompt는 참조 (참고 가이드). v3 example은 참조 X.

이유: chicken-and-egg. v3 example을 참조하면서 v4 example을 만들면 retrofit. v3 메인 prompt만 가지고 v4 spec을 만들어야 진짜 dogfood — v3 메인 prompt의 self-sufficiency stress test.

---

## 현재까지 작업 (10/13 phase 완료)

### 작업 디렉토리

```
─── docs/spec/                             # v4 산출물 작업물
    ├── 01-prd.md                          ✓ Approved
    ├── 02-personas-journey.md             ✓ Approved
    ├── 03-features.md                     ✓ Approved (DELTA update — R3 dashboard defer)
    ├── 04-domain-model.md                 ✓ Approved (DELTA update)
    ├── 05-user-flow.md                    ✓ Approved (DELTA update — SEC-5 dashboard 제거)
    ├── 06-information-architecture.md     ✓ Approved (재작성 — 단일 surface only)
    ├── 07-wireframe.md                    ✓ Approved (재작성 — W-CC-pattern만)
    ├── 08-system-architecture.md          ✓ Approved
    ├── 09-non-functional-requirements.md  ✓ Approved
    ├── 10-test-strategy.md                ✓ Approved (가장 최근)
    ├── 11-operations.md                   ⬜ 다음
    ├── 12-adr-risks.md                    ⬜
    └── 13-implementation-plan.md          ⬜
```

### 큰 중간 결정 (retroactive scope reduction)

작업 진행 중 사용자가 두 번 push back:

**Push back 1 (Phase 7 후):**
"플러그인 하네스 자체에 집중하고, 아웃풋 포맷이 대시보드를 고려하게만 하고, 대시보드는 별도 싸이클로 돌리자."

→ Mode: SCOPE EXPANSION → HOLD SCOPE
→ R3 (대시보드), F3.4 (timeline), F6.3 (dashboard spawn), SEC-5 (dashboard 검토), P-DB-1~9 (dashboard 페이지), W-DB-1~9 (dashboard wireframe) 모두 **deferred (v4.5+)**
→ Phase 1-7 retroactive DELTA update 완료

**Push back 2 (여러 차례 Anti-Sycophancy 위반 지적):**
- "두 가지 다 정확. 정직히 인정" 같은 칭찬-먼저 표현 금지
- "큰 작업이라 줄이자" 같은 인간-시간 사고 금지 (Boil the Lake = AI 시대 marginal cost near-zero)

→ Position 명시 + position 바꿀 evidence만. 사과 과장 X.

### v4 Base R 8개 (HOLD)

| ID | 이름 | 해결 PAIN |
|---|---|---|
| R1 | Structured I/O — frontmatter, ID auto-gen·resolver | PAIN-1 환각, PAIN-2 기억 |
| R2 | Hook validation — pre-commit, transition gate, schema | PAIN-3 양심, PAIN-5 잊음 |
| R4 | 영향 phase 자동 식별 (DELTA) | PAIN-DELTA-scope |
| R5 | Phase 진행 강제 + Forcing questions | PAIN-fundamental |
| R6 | 단일 명령 install·setup | PAIN-base |
| R7 | 도메인 무관성 (v3 차용) | 도메인 bias |
| R8 | Implementation 핸드오프 (Superpowers) | (구현 단계) |
| R13 | Telemetry opt-in (KPI 측정) | (운영) |

---

## 다음 agent가 해야 할 것

### 1. Context 정착 (먼저 읽을 것)

```bash
# 1. v3 메인 prompt 구조 한 눈에
cat ./reference-v3/README.md

# 2. v4 작업 산출물 훑기 (역순 — 최신부터)
ls ./docs/spec/
cat ./docs/spec/10-test-strategy.md
cat ./docs/spec/01-prd.md   # 출발점·전체 vision

# 3. Phase 11 prompt 읽음
cat ./reference-v3/11-operations.md
```

### 2. Phase 11 작성 (Operations)

핵심:
- Plugin은 passive code — daemon·server 없음. **Maintainer 관점 OSS 운영**.
- Env: Dev (maintainer 로컬) / Staging (alpha 베타) / Prod (OSS release)
- Deploy: git tag → Claude Code marketplace 또는 GitHub release
- Observability: GitHub issue·PR + Telemetry endpoint (opt-in)
- Telemetry endpoint host 운영 결정 → ADR-CAND-7 (Plausible / PostHog / 자체 minimal)
- Cost: $0 (사용자 측 모두 사용자 책임, plugin 자체 OSS free)
- Backup·DR: 사용자 git push 빈도 가이드 (사용자 책임)
- Runbook: telemetry endpoint 다운, malicious PR, hook 변조 보고 등

### 3. Phase 12 (ADR + Risks)

v4 spec에서 누적된 ADR-CAND 10개 결정. 각 ADR에 alternatives ≥ 2 + 거절 이유.

핵심 ADR-CAND:
- ADR-CAND-3: Hook script lang (bash / Node / Python)
- ADR-CAND-5: ID auto-gen (sequential / UUID / hash)
- ADR-CAND-6: Subagent 구현 (CC SDK 의존성 — A1 가정 spike 필요할 수도)
- ADR-CAND-8: Skill orchestration (LLM driven vs deterministic state machine)
- ADR-CAND-7: Telemetry endpoint (Plausible / PostHog / 자체 / 안 host)

Risk LxI matrix + 통합 Open Questions (이전 phase의 OQ-*-* 모두).

### 4. Phase 13 (Implementation Plan)

- Dependency graph mermaid (R1·R2·R5·R6 base → R4·R8·R13 layer)
- MVP definition (P0 set이 PRD §3.3 시나리오 cover 검증)
- Milestones M0-M4 (M0 infra, M1 foundation, M2 MVP, M3 V1, M4 future)
- Atomic tasks (각 2-5분, 5-step: RED test → verify fails → impl → GREEN → commit)
- 모든 P0 Spec이 task에 매핑
- Type consistency check
- Spec → Task coverage 표

### 5. 작업 패턴 (반드시 지킬 것)

1. **v3 메인 prompt만 참조.** v3 example 참조 금지 (chicken-and-egg).
2. **각 phase 작성 후 self-check** — grep·diff로 ID consistency, vague 표현, format 검증.
3. **HARD-GATE** — phase 산출물 후 반드시 사용자 명시 승인 받음. 자동 진행 X.
4. **Anti-Sycophancy** — "정확합니다·맞다·인정" 같은 칭찬-먼저 금지. Position 명시 + evidence.
5. **모바일 사용자** — conversation에 결과 요약 inline (markdown 표·핵심 결정) + 산출물 파일. 사용자가 파일 직접 못 보는 경우 많음.
6. **사용자 push back을 진지하게** — Boil the Lake / Anti-Sycophancy / scope creep 본인이 만든 prompt로 잡아냄.


## 사용자 환경

- 한국어 conversation
- 모바일 Claude app 사용 (파일 직접 검토 어려움)
- 본인이 Planning Pipeline maintainer (v3 만든 사람)
- 본인이 v4 plugin의 Persona (Builder, Claude Code 사용자)
- 즉 **maintainer + 사용자 + Persona 본인** — self-application 진정한 dogfood

---

## 한 가지 더

이 conversation은 그 자체로 v4 plugin의 **dogfood validation 사례**. v3 메인 prompt가 v4 plugin이라는 실 SW product를 사양화 가능한지 stress test 중. 막힘이 곧 v3 메인 prompt의 약점 발견 — 그 발견은 v4 plugin이 더 잘 해결해야 하는 것의 단서.

진행하면서 발견되는 v3 prompt의 약점은 별도로 노트해두면 v4 plugin 가치 증명에 사용 가능.
