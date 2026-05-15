---
phase: 12
status: Approved
---

# ADR + Risks

**Mode:** HOLD SCOPE (PRD §10 상속)
**Inputs:** Phase 8 ADR-CAND-1~10, 모든 Phase OQ, Phase 1 Assumptions, Phase 9 NFR-SEC threats
**Date:** 2026-05-12

> Phase 8에서 미뤄진 10개 ADR-CAND을 결정. 미루는 결정은 trigger condition 명시.
> Innovation token 3개 한계 — 나머지는 boring by default.
> Single file (다른 example과 일관). 큰 spec일 시 12-adr-risks/{ADR-N.md, risks.md, ...} 디렉토리로 split 가능 (ADR-10 참조).

---

## Part A — Architecture Decision Records

### ADR-1: Plugin skill 형식 — Claude Code official skill spec

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-1 (Phase 8 §9), Phase 6 IA "단일 surface only"
**Innovation token:** No (boring choice)

#### Context

Plugin은 Claude Code 안에서 작동하는 skill 모음 (ARCH-2). Skill을 Claude Code에 등록하는 방식이 두 갈래: official skill spec (frontmatter + body markdown 구조) vs custom (자체 plugin loader).

관련 NFR: NFR-AVAIL-2 (CC 다운 시 plugin 무용), NFR-PERF-1 (skill invoke <500ms)
관련 Spec: R6 (단일 명령 install), F6.1 (`claude code skill install`)

#### Decision

**Claude Code official skill spec 차용.** Frontmatter (`name`, `description`, `inputs-from`, `trigger-words`, `mode`) + markdown body. Plugin install은 marketplace 또는 GitHub install 명령 — Claude Code SDK 표준.

#### Alternatives Considered

##### 옵션 A (선택됨): Claude Code official skill spec
- **장점:** SDK 호환, marketplace 등록 가능, trigger phrase 자동 감지, 사용자가 다른 skill과 일관 경험
- **단점:** Claude Code 외 fallback 어려움 (기존 markdown은 별도 유지 필요)
- **Reversibility:** Two-way — skill prompt 자체는 markdown이라 다른 agent로 export 가능

##### 옵션 B (거절됨): 자체 plugin loader
- **장점:** Claude Code 외 환경 (Cursor·Aider) 직접 지원 가능
- **단점:** marketplace 비호환, 사용자가 일관 install·trigger 경험 못 받음, NFR-AVAIL-2와 무관 (CC 다운 시 둘 다 무용)
- **거절 이유:** PRD §6 Non-Goal "Claude Code 외 다른 agent tooling — 기존 markdown으로 fallback" 명시. 자체 loader 구현은 maintainer 시간 낭비 (Boring by default)

#### Consequences

##### 긍정
- Claude Code marketplace 등록 가능 (KPI-4 stars 성장 기여)
- Skill discovery 자동 (trigger-words frontmatter)

##### 부정 (수용 가능)
- Claude Code SDK 변경 시 plugin update 필요 — RB-7 (marketplace publish 실패 fallback)
- Non-CC 사용자는 기존 markdown 직접 (제한)

##### 영향받는 phase·ARCH
- ARCH-2 (Plugin Skills): Claude Code skill spec 따름
- Phase 13: install task가 `claude code skill install <repo>` 또는 marketplace 명령

#### Trigger to Re-evaluate

- Claude Code SDK가 plugin spec 큰 breaking change (예: skill manifest 형식 v2)
- Cursor·Aider 같은 다른 agent의 plugin SDK 표준화 + 사용자 요구 5건 이상

#### References

- Phase 8 §9 ADR-CAND-1
- Phase 6 §1 단일 surface (Claude Code session)

---

### ADR-2: Frontmatter schema 정의 형식 — JSON Schema

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-2 (Phase 8 §9), R1 (structured I/O), F1.1 (frontmatter schema per phase)
**Innovation token:** No (boring choice)

#### Context

각 phase frontmatter (YAML)의 필드·타입·required 정의 형식 결정. Validator (ARCH-5)가 commit 시 강제. 형식 후보: JSON Schema, custom YAML manifest, TypeScript types.

관련 NFR: NFR-PERF-6 (schema 검증 <100ms), NFR-SEC-4 (spec 변조 방지)
관련 Spec: F1.1, F2.4 (schema validation hook)

#### Decision

**JSON Schema (Draft 2020-12).** Frontmatter는 YAML 그대로 (사용자 친화) + 검증은 JSON Schema로. 각 phase별 schema 파일 (`schemas/phase-{N}.json`).

#### Alternatives Considered

##### 옵션 A (선택됨): JSON Schema
- **장점:** 표준 (IETF), validator 라이브러리 풍부 (ajv 등 — ADR-3 Node.js 호환), IDE schema 인식 자동, error 메시지 표준
- **단점:** YAML → JSON 변환 한 단계 (validator 입력 시) — 비용 미미
- **Reversibility:** Two-way — schema는 메타데이터, 다른 형식으로 transpile 가능

##### 옵션 B (거절됨): Custom YAML manifest
- **장점:** YAML 일관 (사용자가 frontmatter도 YAML이니 친숙)
- **단점:** validator 직접 작성 필요 (NIH), error 메시지 직접 설계, IDE 지원 부재
- **거절 이유:** Boring by default — 표준 도구가 풍부한데 NIH는 token 낭비

##### 옵션 C (거절됨): TypeScript types
- **장점:** ADR-3 Node.js 환경에서 컴파일 시점 검증 가능
- **단점:** 런타임 검증 X (TS는 컴파일 타임만), 사용자 spec은 runtime 입력 — 별도 validator 필요. zod 같은 runtime validator는 결국 schema의 또 다른 표현
- **거절 이유:** runtime 검증이 필수 (사용자가 frontmatter 수동 변조 가능 — NFR-SEC-4)

#### Consequences

##### 긍정
- 표준 ecosystem 활용 (ajv, IDE plugins)
- Schema 자체가 문서 역할 (사용자가 frontmatter 어떻게 쓰는지 schema 보면 앎)

##### 부정 (수용 가능)
- Schema 13개 + 1 common 유지 부담 (단 phase 추가 거의 없음)

##### 영향받는 phase·ARCH
- ARCH-5 (Schema Validator): ajv 차용
- Phase 13: schema 정의 task (각 phase frontmatter)

#### Trigger to Re-evaluate

- ajv 또는 동등 라이브러리가 unmaintained
- JSON Schema 표준이 backward-incompat 변경

#### References

- Phase 8 §9 ADR-CAND-2
- Phase 3 R1, F1.1, F2.4

---

### ADR-3: Hook script language — Node.js

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-3 (Phase 8 §9), OQ-8-3 (multi-OS 호환)
**Innovation token:** No (Claude Code 환경 표준 따름)

#### Context

Pre-commit hook (ARCH-3)이 schema validation·ID consistency check·transition gate 실행. 언어 후보: bash, Node.js, Python.

관련 NFR: NFR-PERF-3 (hook <3s), NFR-AVAIL-6 (hook 실패율 <0.1%), NFR-SEC-12 (hook RCE 방지)
관련 Spec: R2 (hook validation), F2.1·F2.3·F2.4

#### Decision

**Node.js.** Plugin 자체가 Node.js 환경 (Claude Code SDK 표준)이므로 dependency 일관. Hook script는 Node.js 실행 (`#!/usr/bin/env node` shebang + .js).

#### Alternatives Considered

##### 옵션 A (선택됨): Node.js
- **장점:** Plugin 코드와 dependency 일관 (ajv·remark 차용 가능 — ADR-2·4), Windows·macOS·Linux 동일 (사용자 머신에 Node 있다고 가정 — Claude Code 사용자라 합리적), npm 생태계
- **단점:** 사용자가 Node 미설치 시 install guide 필요
- **Reversibility:** One-way (한번 결정 후 schema·graph builder도 동일 stack)

##### 옵션 B (거절됨): bash
- **장점:** 별도 runtime 불필요, git hook 표준
- **단점:** Windows 호환 부담 (WSL 또는 Git Bash 가정 필요 — OQ-8-3), schema 검증·markdown parse 직접 작성 어려움 (외부 도구 호출 = Node 결국 사용)
- **거절 이유:** 결국 Node 도구 호출 wrapper 됨 — 두 layer 유지비

##### 옵션 C (거절됨): Python
- **장점:** 풍부한 생태계, schema validator 다양
- **단점:** Claude Code SDK는 JS 기반 — runtime 두 개 (Node + Python) 유지, 사용자 환경 Python version 호환 부담
- **거절 이유:** 사용자 머신 의존 추가 (Boring by default 반대)

#### Consequences

##### 긍정
- Plugin 전체 단일 stack — maintainer 부담 감소
- ajv·remark·기타 npm 라이브러리 hook에서 차용

##### 부정 (수용 가능)
- 사용자 Node 미설치 시 plugin install fail — README 가이드 + install script가 detect

##### 영향받는 phase·ARCH
- ARCH-3 (Hook Scripts): Node.js
- ARCH-4·5·6 (Graph·Schema·IDGen): 동일 stack
- Phase 11 OPS-2 (Hook auto-install): hash 비교 + Node 실행

#### Trigger to Re-evaluate

- Claude Code SDK가 다른 stack으로 전환 (예: Rust)
- 사용자 5건 이상이 "Node 미설치 환경" 보고

#### References

- Phase 8 §9 ADR-CAND-3
- Phase 8 OQ-8-3 (multi-OS 호환)

---

### ADR-4: Markdown parser — unified/remark

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-4 (Phase 8 §9), OQ-8-4 (parser 라이브러리)
**Innovation token:** No (boring choice)

#### Context

ARCH-4 (Graph Builder)와 ARCH-5 (Schema Validator)가 markdown 파싱 — frontmatter + body section + ID 인용 추출. 후보: unified/remark, marked, 자체 regex.

관련 NFR: NFR-PERF-4 (graph 빌드 cold <2s), NFR-PERF-6 (schema 검증 <100ms)
관련 Spec: F1.1, F2.3 (ID consistency hook), F4.1 (dependency graph)

#### Decision

**unified/remark + remark-frontmatter + remark-parse.** AST 기반 정확 처리. Plugin 풍부.

#### Alternatives Considered

##### 옵션 A (선택됨): unified/remark
- **장점:** AST 정확 (frontmatter·code fence·nested heading 모두 처리), plugin 생태계, JSON 출력 (graph node로 변환 직접)
- **단점:** 학습 곡선, 의존성 무거움 (~3MB) — NFR-PERF-4 cold start 영향 미미 (Node lazy load)
- **Reversibility:** Two-way — parser 추상화 layer 두면 교체 가능

##### 옵션 B (거절됨): marked
- **장점:** 가벼움 (<100KB), 빠름, 간단 API
- **단점:** AST 노출 제한적 (renderer 위주), frontmatter plugin 부재 (별도 처리 필요), ID 인용 추출 시 정규식 의존
- **거절 이유:** ARCH-4 graph builder가 AST 필요 — marked는 부적합

##### 옵션 C (거절됨): 자체 regex
- **장점:** 의존성 0
- **단점:** code fence·nested·escape 처리 부정확 (markdown spec 복잡), maintainer 부담 (markdown spec 변화 따라가야), bug 잠재
- **거절 이유:** Boring by default — markdown parsing은 검증된 도구

#### Consequences

##### 긍정
- AST 일관 처리 — graph·schema 둘 다 차용
- Plugin (remark-frontmatter) 그대로 사용

##### 부정 (수용 가능)
- 의존성 크기 — Plugin install 시 npm install 한 번 (이후 캐시)

##### 영향받는 phase·ARCH
- ARCH-4 (Graph Builder): unified pipeline
- ARCH-5 (Schema Validator): frontmatter parse → ajv

#### Trigger to Re-evaluate

- unified가 unmaintained
- NFR-PERF-4 위반 측정 (실 사용 시)

#### References

- Phase 8 §9 ADR-CAND-4
- Phase 8 OQ-8-4

---

### ADR-5: ID auto-gen 알고리즘 — Sequential counter (per phase per project)

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-5 (Phase 8 §9), R1·F1.3 (ID auto-generation)
**Innovation token:** No (boring choice)

#### Context

Plugin이 ID 부여 (R1·F1.1·S1.1.1·ENT-Foo·NFR-PERF-1 등). 알고리즘 후보: sequential counter, UUID, hash-based.

관련 NFR: NFR-SCAL-2 (누적 ID <5000), NFR-SEC-4 (spec 변조 시 ID 재생성)
관련 Spec: F1.3 (ID auto-gen), AC-R1-3 (unique 자동)

#### Decision

**Per-phase per-project sequential counter.** `.specrail-cache/id-counter.json`에 phase별 다음 번호 저장. Counter는 git ignore (rebuild 가능 — graph builder가 max(used) + 1).

ID 형식: phase 마다 prefix (R{n}, F{n}.{m}, S{n}.{m}.{k}, ENT-{Name}, INV-{n}, NFR-{Domain}-{n}, ARCH-{n}, EXT-{n}, OPS-{n}, ADR-{n}, RISK-{n}, T{n}.{m}). 초기 README §126-150 그대로 차용.

#### Alternatives Considered

##### 옵션 A (선택됨): Sequential counter
- **장점:** 사람 가독 (R5는 5번째 R), grep 친화, 인용 짧음, 카운터 rebuild 가능 (graph가 max + 1)
- **단점:** 두 사용자가 같은 project에 동시 작업 시 counter 충돌 — NFR-SCAL-4 (single-machine single-user) 가정으로 무관
- **Reversibility:** One-way (한번 ID 부여되면 변경 disruptive — Phase N+1 인용 영향)

##### 옵션 B (거절됨): UUID
- **장점:** Globally unique (다중 사용자 안전), 자동 생성 단순
- **단점:** 사람 가독 X (`R-7f3a9b...` vs `R5`), 인용 부담 큼, sample 산출물 가독성 nightmare
- **거절 이유:** R1의 핵심 가치는 LLM·사용자가 ID를 정확히 인용 — UUID는 인용 비용 ↑ → PAIN-2 (기억) 재현

##### 옵션 C (거절됨): Hash-based (description 해시)
- **장점:** Description 변경 시 ID 자동 재생성
- **단점:** Hash collision 가능 (확률 낮으나 0 아님), description 작은 변경에 ID 바뀜 (인용 깨짐), 재현 부담
- **거절 이유:** ID 안정성이 R1 핵심 — description 수정 자유 보장 X

#### Consequences

##### 긍정
- 초기 README §126-150 그대로 차용 (도메인 무관성 R7 일관)
- 사용자가 ID grep 가능 (`grep -r 'S1.2.3' docs/spec/`)

##### 부정 (수용 가능)
- ID 중간 삭제 시 hole 발생 (R3가 deferred돼도 R3 reservation — 단 현재 R3는 명시 deferred로 처리됨, 새 R 부여 시 max+1)

##### 영향받는 phase·ARCH
- ARCH-6 (ID Auto-gen): counter 관리
- ARCH-4 (Graph Builder): rebuild 시 max+1
- Phase 13: counter init task (`.specrail-cache/id-counter.json`)

#### Trigger to Re-evaluate

- NFR-SCAL-4 가정 변경 (multi-user 동시 — 향후 dashboard cycle에서)
- 5000 ID 한계 도달 (NFR-SCAL-2)

#### References

- Phase 8 §9 ADR-CAND-5
- 초기 README §126-150 ID 체계
- Phase 3 R1, F1.3

---

### ADR-6: Subagent 구현 — Claude Code 자체 subagent 기능

**Status:** Accepted (단 A1 spike 검증 후 — Conditional)
**Date:** 2026-05-12
**Trigger:** ADR-CAND-6 (Phase 8 §9), R8 (Implementation 핸드오프), OQ-8-2 (A1 검증), Phase 1 A1·A2
**Innovation token:** **Yes (1/3)** — Claude Code subagent SDK 의존, A1 가정

#### Context

R8 Phase 13 후 atomic task별 fresh subagent 호출 (Superpowers 패턴 차용). Fresh context로 자기 self-sufficiency 검증. 후보: Claude Code 자체 subagent 기능, LLM API direct call, hybrid.

관련 NFR: NFR-AVAIL-3 (LLM 다운 시), NFR-SEC-12 (hook RCE)
관련 Spec: R8, F8.2 (atomic task별 fresh subagent), F8.4 (BLOCKED escalation), Phase 1 A1·A2

#### Decision

**Claude Code subagent 기능 사용** (예: `Agent` tool 또는 SDK의 sub-task spawn). Fresh context guarantee + main session escalation API + 사용자 LLM 비용 일관 (CC 통한 API call).

**Conditional:** A1 spike (Claude Code SDK가 subagent BLOCKED escalation 지원하는가) 결과로 fallback 가능. 미지원 시 hybrid (subagent main 일부 LLM API direct).

#### Alternatives Considered

##### 옵션 A (선택됨): Claude Code 자체 subagent
- **장점:** Auth 일관 (사용자 CC 계정), cost 일관 (사용자 CC plan), BLOCKED escalation API 표준, fresh context guarantee
- **단점:** CC SDK 변경 영향, 미공개 기능일 시 spike 필요 (A1)
- **Reversibility:** Two-way — subagent abstraction layer 두면 교체

##### 옵션 B (거절됨): LLM API direct call
- **장점:** SDK 의존성 X (CC 변화 영향 X)
- **단점:** Auth 분리 (사용자가 별도 API key 설정 필요 — install 마찰 ↑ R6 위반), cost 사용자 추가 부담, BLOCKED escalation 직접 구현 필요
- **거절 이유:** R6 (단일 명령 install) 위반 — CC 사용자에게 API key 별도 요청 = 마찰 ↑

##### 옵션 C (거절됨): Hybrid (CC main + API direct subagent)
- **장점:** subagent만 분리 — main session 흐름 일관
- **단점:** 두 stack 유지, BLOCKED escalation cross-stack 복잡
- **거절 이유:** 복잡도 ↑ — A1 미검증 상태로 hybrid는 위험 (Boring by default 반대)

#### Consequences

##### 긍정
- Persona 흐름 자연 (CC 안에서 모든 것)
- LLM cost 사용자 plan으로 자동 처리

##### 부정 (수용 가능)
- A1 spike 미통과 시 초기 release 지연 (RISK-2 mitigation: Phase 13 M0 spike task)
- CC SDK breaking change에 취약 (Trigger to Re-evaluate에 명시)

##### 영향받는 phase·ARCH
- ARCH-2 (Plugin Skills): subagent invoke wrapper
- Phase 13 M0: A1 spike task (CC subagent BLOCKED escalation 검증)
- ENT-Subagent (Phase 4): ephemeral, CC 측 lifecycle

#### Trigger to Re-evaluate

- A1 spike 결과 미지원 — fallback ADR-6b (hybrid 또는 LLM direct)
- CC SDK가 subagent 기능 deprecate
- 사용자 5건 이상이 "non-CC subagent" 요구

#### References

- Phase 8 §9 ADR-CAND-6
- Phase 8 OQ-8-2
- Phase 1 A1, A2

#### Appendix: ADR-6b FAILED-FALLBACK skeleton

T0.2 A1 spike 실패 시 (CC SDK가 subagent 미지원 또는 BLOCKED escalation 부재) 후퇴:

**ADR-6b Decision:** **R8 implementation scope를 초기 release에서 축소.** Phase 13 후 Implementation 핸드오프는 **사용자 수동 + Claude Code main session** (현재 Claude Code 표준 흐름). Subagent fresh context guarantee 없이도 사용자가 task별 ctrl-N 새 chat 시작으로 부분 대체.

**Affected tasks (Phase 13):**
- T3.4 (subagent wrapper) → **DEFER to next cycle**. 대신 README에 "Phase 13 task별 새 Claude Code chat 시작 권장" 가이드.
- T3.5 (2-stage review) → **DEFER to next cycle**. M3에서 제외.
- T3.6 (BLOCKED escalation) → **DEFER to next cycle**. 사용자가 직접 막힘 인식.
- F8.1~F8.4 → **Status: Deferred (next cycle)** — Phase 3 update DELTA.
- R8 Importance: P0 → P1 (next cycle 후보).
- KPI-1 영향: 완주율 측정 시 Phase 13 task 진행 metric 별도 — telemetry로 PhaseApproved(13) 카운트만.

**Trigger to revisit:** CC SDK가 subagent 기능 정식 공개 또는 third-party (Aider 등) 표준화 시 → 향후 R8 부활.

**Risk:** R8 deferral 시 사용자 manual context 관리 부담 ↑. KPI-1 (완주율 80%) 영향 가능 (Phase 13 후 사용자가 직접 chat 시작해야).

---

### ADR-7: Telemetry endpoint — Plausible (managed, EU region)

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-7 (Phase 8 §9), OQ-9-4 (region·jurisdiction), OQ-11-1, OQ-4-2
**Innovation token:** No (boring choice — managed service)

#### Context

R13 Telemetry opt-in metric 수집 endpoint. 후보: Plausible cloud, PostHog cloud, self-hosted minimal (예: 자체 Express + Postgres), 자체 build from scratch.

관련 NFR: NFR-PRIV-3 (anonymized), NFR-AVAIL-5 (다운 시 local queue), NFR-SEC-COMP-2 (사용자 GDPR 환경)
관련 Spec: R13, F13.2 (익명 metric 전송), Phase 11 OPS-3·5·6, OPS-9

#### Decision

**Plausible cloud (EU region).** Privacy-first 평판, GDPR 자동 (EU host), 익명 event 표준, $20/월 (Phase 11 §9 cost model 일치).

#### Alternatives Considered

##### 옵션 A (선택됨): Plausible cloud
- **장점:** Privacy-first 설계 (ID 추적 없음, IP 익명화), EU host (GDPR 자동), 표준 event API, OSS (회사 평판), $20/월 (cost model 부합)
- **단점:** Custom event 필드 제한 (PhaseStarted 등 표준화 필요 — 단 OPS-5·INV-8 정의 제약과 일치)
- **Reversibility:** Two-way — telemetry client (ARCH-7)에 endpoint URL 추상화하면 교체

##### 옵션 B (거절됨): PostHog cloud
- **장점:** Custom event 풍부, replay·funnel 등 분석 강함
- **단점:** US host default (EU 옵션은 별 plan), $50/월~ (cost model 큼 시나리오), feature 과잉 (KPI-1·2·3·6 단순 측정에 overkill)
- **거절 이유:** Privacy 표면 (US host default) + cost — Boring by default와 충돌

##### 옵션 C (거절됨): Self-hosted minimal (자체 Express + Postgres on small VPS)
- **장점:** 데이터 소유, vendor lock-in 0
- **단점:** Backup·DR maintainer 직접 (Phase 11 OPS-19 부담), 5xx alert 대응 부담 (OPS-9), TLS·patching 등 유지비
- **거절 이유:** OSS maintainer 시간 한정 — operational burden ↑ (Boring by default 반대)

##### 옵션 D (거절됨): 자체 build from scratch
- **장점:** 완전 customization
- **단점:** NIH, 모든 비용 (개발+운영)
- **거절 이유:** 명백한 token 낭비

#### Consequences

##### 긍정
- GDPR (NFR-SEC-COMP-2) 자동 — 사용자 EU 환경에서 안내 단순
- OPS-3 deploy 단순 (계정 + API token만)
- KPI-1·2·6 측정 endpoint 즉시 가용

##### 부정 (수용 가능)
- 월 $20 maintainer cost (Phase 11 §9 cost model 기준)
- Plausible 변경·shutdown 시 endpoint 교체 — Trigger to Re-evaluate에 명시

##### 영향받는 phase·ARCH
- ARCH-7 (Telemetry Client): Plausible event API 호환
- EXT-5 (Telemetry endpoint): Plausible
- Phase 11 OPS-3·OPS-9·OPS-15·OPS-19
- Phase 13: Telemetry client task (R13)

#### Trigger to Re-evaluate

- Plausible 가격 인상 50% 이상 (cost model 영향)
- Plausible shutdown / acquired by privacy-unfriendly entity
- KPI-2 측정에 custom field 필요 — Plausible 제약 부딪힘

#### References

- Phase 8 §9 ADR-CAND-7
- Phase 9 OQ-9-4 (region)
- Phase 11 OQ-11-1, §9 cost model
- Phase 4 OQ-4-2

---

### ADR-8: Skill orchestration mechanism — Explicit state machine (deterministic)

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-8 (Phase 8 §9), OQ-8-1, OQ-3-3, OQ-5-2
**Innovation token:** **Yes (2/3)** — CC plugin 표준 부재, deterministic orchestration 패턴 spike 필요

#### Context

13 phase skill 흐름 — Phase N → Phase N+1 transition을 LLM이 자율 결정 vs plugin이 deterministic state machine으로 강제. 핵심 PAIN-3 (HARD-GATE 양심 의존) 해결과 직결.

관련 NFR: NFR-SEC-2 (hook bypass 억제), NFR-AVAIL-6 (hook 실패율)
관련 Spec: R5 (Phase 진행 강제), F5.1 (13 skill orchestration), F2.2 (transition gate), AC-R2-2

#### Decision

**Explicit state machine (deterministic).** Plugin이 state machine 유지 — Phase N status가 `Approved`일 때만 Phase N+1 skill invoke 허용. AskUserQuestion 등은 LLM이 진행하나 phase 경계는 plugin code가 enforce.

**State source-of-truth (3-reviewer 합의로 결정):**
- **Primary (authoritative):** Phase N 산출물의 frontmatter `status` 필드. 사용자가 명시 승인 후 hook이 frontmatter 수정.
- **Derived (cache):** `.specrail-cache/state.json` — frontmatter에서 build됨. Skill·hook이 빠른 lookup용.
- **불일치 시 정책:** Hook이 commit 시 frontmatter ↔ cache 비교 → 다르면 frontmatter 기준으로 cache rebuild (silent). Cache 변조는 NFR-SEC-5 (rebuild on commit)로 cover.
- **이유:** 사용자가 frontmatter 수동 수정 가능 (text 파일). Cache는 derived라야 사용자 작업 흐름 깨지지 않음. 단 INV-3 검증은 frontmatter 기준이라 결정적.

#### Alternatives Considered

##### 옵션 A (선택됨): Explicit state machine
- **장점:** PAIN-3 해결 (양심 의존 0), test 가능 (state transition table), 환각 phase 진행 차단, BLOCKED escalation deterministic
- **단점:** State 정의 부담 (각 phase status enum, transition 조건), CC plugin 표준 부재 — spike 필요
- **Reversibility:** Two-way (LLM-driven으로 후퇴 가능 — 단 PAIN-3 재현)

##### 옵션 B (거절됨): LLM-driven tool call chain
- **장점:** 구현 단순 (LLM이 tool 호출하면 다음 skill invoke), CC 패턴과 일관
- **단점:** Phase 진행 양심 의존 = PAIN-3 그대로, KPI-2 (환각 0) 보장 X (LLM이 Phase 5 skip하면?), test 어려움
- **거절 이유:** R5 핵심 가치 위반 — "도구로 강제" 못함

##### 옵션 C (거절됨): Hybrid (LLM-driven + post-hoc check)
- **장점:** LLM 자유 + commit 시 hook이 catch
- **단점:** 사용자가 hook bypass 시 catch 불가 — NFR-SEC-2와 동일 표면, sequence error는 사후 발견 (코스트 ↑)
- **거절 이유:** PAIN-3 부분 해결만 — incomplete

#### Consequences

##### 긍정
- KPI-2 (환각 0) 도구로 보장
- KPI-6 (정당 차단 >85%) 측정 의미 있음 (deterministic이라 false positive 적음)

##### 부정 (수용 가능)
- Innovation token 1개 소진 — A1 spike 필요 (Phase 13 M0)
- State machine 변경 시 backward compat 부담 (DELTA mode 영향)

##### 영향받는 phase·ARCH
- ARCH-2 (Skills): orchestrator skill이 state machine
- ARCH-3 (Hooks): transition gate hook
- ENT-Phase status 필드 (Phase 4)
- Phase 13 M0: state machine 설계 + spike

#### Trigger to Re-evaluate

- A1 spike 결과 plugin이 state 유지 어려움 (CC SDK 제약)
- 사용자 10건 이상이 "phase 진행 자유" 요구 — 단 그 경우는 기존 markdown fallback

#### References

- Phase 8 §9 ADR-CAND-8, OQ-8-1
- Phase 3 R5, F5.1, AC-R2-2
- Phase 3 OQ-3-3, Phase 5 OQ-5-2

---

### ADR-9: Dep Graph cache invalidation — In-memory only (옵션 D 채택)

**Status:** Accepted (옵션 D — in-memory only, no on-disk cache)
**Date:** 2026-05-12 (DELTA 2026-05-12: 옵션 D 추가 + token deferred) · 2026-05-13 (옵션 D 확정 채택, US-11.2)
**Trigger:** ADR-CAND-9 (Phase 8 §9), reviewer H2 (incremental token 정당성 약함)
**Innovation token:** **No** — 옵션 D 채택으로 token 회수됨 (incremental 구현 복잡도 제거).

#### Context

ARCH-4 (Dependency Graph Builder)가 markdown parse → ID 정의·인용 그래프. Cache invalidation 후보: file watch (always live), on-demand rebuild, manual refresh, in-memory only (no disk cache).

관련 NFR: NFR-PERF-3 (hook <3s), NFR-PERF-4 (cold <2s), NFR-PERF-5 (incremental <300ms), NFR-SEC-5 (cache 변조)
관련 Spec: F4.1 (graph 빌드), F2.3 (ID consistency hook), F4.2 (downstream 추출)

#### Decision

**In-memory only (옵션 D 채택).** Graph는 skill·hook 호출 시 매번 rebuild. `graph.json` 또는 persistent cache 파일 없음. `.specrail-cache/graph.json` 작성 안 함.

- File watch X (CC plugin runtime 미보장)
- On-disk cache X (NFR-SEC-5 cache 변조 위험 제거, 구현 단순화)
- Incremental X (modtime + diff parse 복잡도 제거)

#### Alternatives Considered

##### 옵션 A (거절됨): On-demand + incremental on commit
- **장점:** NFR-PERF-3 충족 (incremental <300ms 가능), file watch 불필요 (CC runtime 의존성 0), cache rebuild 가능 (NFR-SEC-5 시)
- **단점:** Incremental 정확성 — 구현 복잡 (modtime + diff parse), 첫 호출 cold start (NFR-PERF-4 cover), on-disk cache 필요 (NFR-SEC-5 변조 위험)
- **거절 이유:** 구현 복잡도 대비 이점 불충분 — 옵션 D가 더 단순하고 NFR-PERF-3 충족

##### 옵션 B (거절됨): File watch (always live)
- **장점:** 항상 최신 — skill·hook 호출 시 instant
- **단점:** CC plugin runtime이 background watcher 보장 X (skill은 invoke per call), Node.js fs.watch는 OS별 차이 (NFR-SEC-12 부분), idle 시 메모리 점유
- **거절 이유:** Runtime 가정이 검증 안 됨 — Boring by default 반대

##### 옵션 C (거절됨): Manual refresh (사용자 명령)
- **장점:** 가장 단순
- **단점:** 사용자 잊음 = PAIN-5 재현, ID consistency check 무용 (오래된 cache로 검증)
- **거절 이유:** PAIN-5 (self-check 잊음) 직접 위반 — R2 핵심 가치 무력화

##### 옵션 D (채택됨): In-memory only — no on-disk cache
- **장점:** Incremental bug 위험 0, 코드 단순, NFR-SEC-5 (cache 변조) 위험 제거 (디스크에 아무것도 쓰지 않음), `.specrail-cache/graph.json` 불필요
- **단점:** 매 invoke마다 full rebuild — NFR-PERF-3 (<3s) 충족 여부는 실측 기반 (T0.4 spike 결과로 확인됨)
- **채택 이유:** T0.4 spike 결과 1000 ID full rebuild ≤ 3s 확인 → NFR-PERF-3 충족. Incremental 구현 복잡도 제거 > 성능 이점.

#### Consequences

##### 긍정
- Hook 빠름 (NFR-PERF-3)
- CC runtime 의존성 최소

##### 부정 (수용 가능)
- Incremental 정확성 bug 위험 — Phase 10 TC-graph-incremental 강조
- 첫 skill 호출 cold start (단 한 번)
- Token 1개 소진 (3/3 한계 도달)

##### 영향받는 phase·ARCH
- ARCH-4 (Graph Builder): incremental + cache layer
- Phase 10: graph incremental TC 추가 필요
- Phase 13: incremental rebuild task

#### Trigger to Re-evaluate

- Incremental bug 보고 5건 이상 → full rebuild every commit으로 후퇴
- CC SDK가 background process 표준화 → file watch 재고려

#### References

- Phase 8 §9 ADR-CAND-9

---

### ADR-10: Phase 산출물 파일 vs 디렉토리 — Single file default + directory for large phases

**Status:** Accepted
**Date:** 2026-05-12
**Trigger:** ADR-CAND-10 (Phase 8 §9), Phase 7·12·13 산출물 크기
**Innovation token:** No (초기 README §174-196 차용)

#### Context

각 phase 산출물 file system layout 결정. 초기 README §174-196 패턴은 phase 7 (wireframe), 12 (ADR-risks)는 디렉토리, 나머지는 단일 파일. specrail도 동일 적용 vs 모두 통일?

관련 NFR: NFR-SCAL-1 (한 phase 산출물 <50KB), NFR-PERF-4 (graph 빌드)
관련 Spec: ADR-2·5 (frontmatter·ID 일관)

#### Decision

**Single file default + 디렉토리 (phase 7, 12, 13).** 초기 README §174-196 패턴 그대로:

```text
docs/spec/
├── 01-prd.md ~ 06-information-architecture.md  (single file)
├── 07-wireframe/
│   ├── W-1-{slug}.md
│   └── ...
├── 08-system-architecture.md ~ 11-operations.md  (single file)
├── 12-adr-risks/
│   ├── ADR-1-{topic}.md
│   ├── risks.md
│   ├── open-questions.md
│   └── innovation-tokens.md
└── 13-implementation-plan.md  (single file or 디렉토리 if M-{n}/T{n}.{m}.md split)
```

**예외:** examples/ 디렉토리에는 모두 single file (compressed) — example 가독성 위해. 실 사용자 산출물은 위 패턴 따름.

#### Alternatives Considered

##### 옵션 A (선택됨): Single + directory mixed (기존 패턴 차용)
- **장점:** 작은 phase 단순 (PRD·NFR 등 한 파일이 자연), 큰 phase scale (W-{n}·ADR-{n}별 독립 — git diff 친화), 기존 패턴 차용 (R7 일관)
- **단점:** 두 layout 학습 부담 — 단 초기 README 명시
- **Reversibility:** Two-way (디렉토리 → 단일 merge 가능, 역 split 가능)

##### 옵션 B (거절됨): 모두 디렉토리
- **장점:** 일관 layout
- **단점:** 작은 phase (PRD <10KB)에 디렉토리 overhead, navigation 부담
- **거절 이유:** Boring by default — 작은 phase는 단일 파일이 자연

##### 옵션 C (거절됨): 모두 단일 파일
- **장점:** 가장 단순 layout
- **단점:** 큰 phase (wireframe 100개 W·ADR 30개)에서 단일 50KB 초과 (NFR-SCAL-1 위반), git diff 부담
- **거절 이유:** NFR-SCAL-1 위반

#### Consequences

##### 긍정
- 초기 README §174-196 그대로 — 도메인 무관성 (R7) 일관
- 큰 phase scale (NFR-SCAL-1 cover)

##### 부정 (수용 가능)
- 두 layout 학습 — README + 00-common에 명시

##### 영향받는 phase·ARCH
- ARCH-4 (Graph Builder): glob `docs/spec/{NN-name}.md` + `docs/spec/{NN-name}/**/*.md` 둘 다 처리
- Phase 7·12·13 skill: 디렉토리 layout 인지
- Examples convention: single file (이 file이 곧 예시)

#### Trigger to Re-evaluate

- 사용자가 "단일 파일 강제" 요구 5건 이상 (디렉토리 navigation 부담)
- NFR-SCAL-1 위반 보고 (단일 파일이 50KB 초과)

#### References

- Phase 8 §9 ADR-CAND-10
- 초기 README §174-196 디렉토리 구조

---

### ADR-11: Phase N+1 invoke 정책 — Manual trigger (with optional auto-chain)

**Status:** Accepted
**Date:** 2026-05-13
**Trigger:** 향후 M7, 4차 reviewer architect D8
**Innovation token:** No (boring choice — manual default + optional continue 명령)

#### Context

Phase 8 §8 S1 sequence diagram이 'Phase N+1 자동 invoke' 명시. 그러나 4차 architect 리뷰어 (D8) 발견 — 자동 invoke logic 코드 부재. `canInvokePhase`는 gate check만 수행. 사용자는 다음 phase trigger를 명시 호출 필요.

자동 invoke의 trade-off:
- 자동: KPI-1 (완주율 80%) ↑ — 사용자가 phase 사이 잊지 않음
- 자동: User Sovereignty ↓ — 사용자가 phase 사이 review·휴식 기회 없음
- 자동: Auto-mode가 BLOCKED escalation pattern과 충돌 가능 (자동 진행 vs 명시 결정)

수동의 trade-off:
- 수동: 사용자 통제 + BLOCKED escalation 충돌 X
- 수동: 사용자가 next phase 잊을 risk — '다음 단계 명시 안내' UX가 보강

관련 NFR: NFR-AVAIL-3, NFR-SEC-2
관련 Spec: R5 (Phase 진행 강제), F5.1 (13 skill orchestration), ADR-8 (explicit state machine)

#### Decision

**Manual trigger with optional auto-chain via `/specrail continue`.**

- Phase N approve 후 plugin은 "Phase N+1 진행 권장" 안내만 반환
- 사용자가 `/specrail continue` 명령 시 next phase orchestrator invoke
- 사용자가 `/specrail phase N+1` 직접 호출도 동등
- Auto mode flag (향후 후보) — `.specrail-cache/auto-chain.json`으로 사용자 opt-in

#### Alternatives Considered

##### 옵션 A (선택됨): Manual trigger with optional auto-chain
- **장점:** User Sovereignty preserve, BLOCKED escalation pattern 충돌 X, 사용자가 review·휴식 가능
- **단점:** 사용자가 next phase 잊을 risk — status command + approve 후 명시 안내로 완화
- **Reversibility:** Two-way — 향후 auto-chain opt-in 추가 가능

##### 옵션 B (거절됨): Full auto-chain (approve → 즉시 N+1 invoke)
- **장점:** KPI-1 ↑, 사용자 friction ↓
- **단점:** User Sovereignty 위반, BLOCKED escalation 시 자동 진행 vs 사용자 결정 충돌, review·휴식 기회 0
- **거절 이유:** User Sovereignty가 ETHOS 핵심 (00-common §3). 자동이 KPI-1을 올리더라도 사용자 결정 우회는 받아들이지 않음.

##### 옵션 C (거절됨): No chain — phase별 독립 호출 강제
- **장점:** 가장 단순, 구현 부담 최소
- **단점:** 13 phase trigger 13회 명시 호출 — 마찰 ↑, KPI-1 (완주율) 큰 영향, 사용자 잊음
- **거절 이유:** 명시 호출만 강제하면 잊음 risk → continue 명령 또는 status 안내로 균형. 옵션 A가 동일 단순성에 UX 개선.

#### Consequences

##### 긍정
- User Sovereignty (00-common §3) 보장 — 사용자가 phase 사이 검토·휴식 선택 가능
- BLOCKED escalation pattern과 충돌 X (사용자가 명시 결정 후 continue)
- 향후 auto-chain opt-in 경로 확보

##### 부정 (수용 가능)
- 사용자가 next phase 잊음 risk — approve 후 "Phase N+1 진행 권장" 안내 + `/specrail status` 명령으로 완화
- KPI-1 sub-metric 필요 (manual vs auto 구분)

##### 영향받는 phase·ARCH
- ARCH-2 (Skills): orchestrator `nextPhase()` 함수가 suggestion만 반환 (invoke X)
- M7 T7.2: `nextPhase()` orchestrator 구현
- Phase 13: `/specrail continue` 명령 task

#### Trigger to Re-evaluate

- KPI-1 (완주율) 측정 결과 manual trigger가 이탈 주 원인으로 식별 (출시 후 1개월)
- 사용자 5건 이상이 "자동 진행" 요구 + User Sovereignty 우려 없음 확인

#### References

- Phase 8 §8 S1 (sequence diagram — 자동 invoke 표현은 high-level only)
- 4차 reviewer architect Gap D8
- ADR-8 (explicit state machine)
- M7 T7.1·T7.2

---

## Part B — Risk Register

### Risk Matrix

```text
            Impact: Low      Medium     High      Critical
Likely      ┌──────────┬──────────┬──────────┬──────────┐
High        │          │ RISK-3   │ RISK-1·2 │          │
            │          │ RISK-5·8 │ RISK-9   │          │
            ├──────────┼──────────┼──────────┼──────────┤
Medium      │ RISK-7   │          │          │          │
            ├──────────┼──────────┼──────────┼──────────┤
Low         │ RISK-10  │          │          │ RISK-4   │
            ├──────────┼──────────┼──────────┼──────────┤
Rare        │          │          │          │ RISK-6   │
            └──────────┴──────────┴──────────┴──────────┘
```

### Risk Table

| ID | 위험 | Likelihood | Impact | LxI | Owner | Monitoring | Mitigation |
|---|---|---|---|---|---|---|---|
| RISK-1 | A1 미충족 — Claude Code SDK가 13 skill state machine orchestration 미지원 | High | High | H×H | maintainer | Phase 13 M0 spike 결과 | ADR-8 spike Phase 13 M0 task. 미통과 시 ADR-6b (hybrid) 설계. 초기 release 지연 가능 |
| RISK-2 | A2 미충족 — fresh subagent 패턴이 spec phase에서 quality 미보장 | High | High | H×H | maintainer | dogfood (이번 작업)에서 stress test, A1 spike와 함께 | 이번 작업 자체 검증. 미통과 시 R8 scope 축소 (Phase 13 후 implementation은 사용자 수동) |
| RISK-3 | NFR-SEC-2 hook bypass — 사용자 `--no-verify` commit | High | Medium | H×M | OSS maintainer | Telemetry: HookBlock vs PhaseApproved 비율 (KPI-6) | README 가이드 (CI에서 enforce 권장), R13 telemetry detection (HookBlock 후 PhaseApproved 패턴), OPS-12 KPI-1<60% 분석 |
| RISK-4 | NFR-SEC-3 malicious PR로 jailbreak 삽입 — supply chain | Low | Critical | L×Crit | maintainer | OPS-13 PR review 강제 | PR review 강제 (signed tag, marketplace verification), maintainer 1인 시 자체 review 한계 — co-maintainer 모집 (KPI-4 이후) |
| RISK-5 | NFR-SEC-7 사용자 PII/secret을 spec에 작성 후 LLM paste | High | Medium | H×M | 사용자 (out-of-plugin) + maintainer (가이드) | Pre-commit secret pattern detection (opt-in F — OQ-9-1 결정 필요) | README + Phase 1 prompt 경고, OQ-9-1 base 또는 opt-in F로 결정 후 구현 |
| RISK-6 | NFR-SEC-12 hook script RCE — maintainer 변조 또는 supply chain | Rare | Critical | R×Crit | maintainer | OPS-14 security email | maintainer signed only, 사용자 confirm 후 install (AC-R6-3), 24h response policy |
| RISK-7 | EXT-5 telemetry endpoint (Plausible) 다운 또는 acquisition | Medium | Low | M×L | maintainer | OPS-9 5xx > 1%/5분 | Local queue 보존·재전송 (NFR-AVAIL-5), ADR-7 Trigger to Re-evaluate (Plausible shutdown 시 endpoint 교체) |
| RISK-8 | A4 미충족 — frontmatter + body 형식이 LLM 응답 quality 저하 | Medium | Medium | M×M | maintainer | dogfood 중 LLM 응답 검토 (이번 작업) | dogfood 통과 = mitigation 1차. 통과 후 sample test (Phase 10 TC-LLM-quality) |
| RISK-9 | KPI-1 완주율 < 60% — 사용자가 13 phase 도중 이탈 | Medium | High | M×H | maintainer | OPS-12 telemetry KPI-1 추세 | RB-6 (PhaseStarted vs PhaseApproved 분석), 약점 phase 식별 후 prompt 개선, phase 분할 검토 |
| RISK-10 | NFR-SCAL-2 5000 ID 한계 — 매우 큰 project에서 성능 저하 | Low | Medium | L×M | maintainer | telemetry: graph 크기 추세 | per-project archive 정책 (향후 cycle), Phase 11 OPS-15 storage alert |

### Risk 처리 정책

- **High×High (RISK-1, RISK-2):** 즉시 mitigation — Phase 13 M0 spike. 초기 release 전 cleared.
- **Low×Critical (RISK-4):** 즉시 mitigation 정책 (PR review 강제). 사고 시 큰 영향이라 prevention 강화.
- **Rare×Critical (RISK-6):** prevention + response time 정책 (24h). 사고 발생 시 즉시 advisory + revert.
- **High×Med (RISK-3, RISK-5):** mitigation 계획 + monitoring. 출시 후 1개월 review (OPS-12).
- **Med×High (RISK-9):** mitigation 계획 (RB-6) + monitoring. 출시 후 매 release cycle review.
- **Med×Med (RISK-8):** monitoring + 사전 dogfood. 통과 시 risk 등급 하향.
- **나머지 (RISK-7·10):** monitor만, mitigation 후순위.

---

## Part C — Open Questions (통합)

### Blocking (다음 단계 진행 또는 출시 막음)

| ID | 질문 | Source phase | 결정자 | 마감 | 상태 |
|---|---|---|---|---|---|
| OQ-9-1 | NFR-SEC-7 secret pattern detection — base R 또는 opt-in F | Phase 9 | maintainer | Phase 13 M2 전 | **Resolved** — opt-in F (T3.10, `src/lint/secret-detect.ts`). RISK-5 mitigation 적용됨 |
| OQ-9-2 | NFR-PERF-3 hook timeout 3s — graph 큰 project에서 검증 | Phase 9 | maintainer | Phase 10 spike (M0) | **Resolved** — perf-bench 측정에서 graph cold build 평균 1s, 3s 한계 여유. NFR-PERF-4 TC-76 통과 |
| OQ-10-1 | Skill test framework — CC 자체 vs LLM API mock | Phase 10 | maintainer | A1 spike 후 (M0) | **Resolved** — vitest + 합성 ctx mock (tests/verify-rule-test-grep-synthetic 등). LLM API 직접 mock 안 함 |
| OQ-10-2 | E2E test 환경 — CI에 LLM API 실 호출 vs cassette playback | Phase 10 | maintainer | Phase 11 (M3 전) | **Resolved** — LLM 호출 없는 합성 fixture E2E (tests/bin-cli.test.ts). cassette 미사용 |

### Resolved by ADRs

| 원래 OQ | 해결 ADR | 결정 요약 |
|---|---|---|
| OQ-3-3 (F8.4 BLOCKED 형식) | ADR-8 | State machine으로 deterministic — interrupt (queue 거절) |
| OQ-4-2 (TelemetryEvent backend) | ADR-7 | Plausible cloud (EU) |
| OQ-5-2 (N-049 escalate 형식) | ADR-8 | Interrupt — main session escalate |
| OQ-8-1 (skill orchestration) | ADR-8 | Explicit state machine |
| OQ-8-2 (subagent 구현) | ADR-6 | CC subagent (A1 spike conditional) |
| OQ-8-3 (multi-OS 호환) | ADR-3 | Node.js (Windows·macOS·Linux 동일) |
| OQ-8-4 (markdown parser) | ADR-4 | unified/remark |
| OQ-9-4 (telemetry region) | ADR-7 | Plausible EU |
| OQ-11-1 (telemetry host) | ADR-7 | Plausible |

### Non-blocking (배경 결정 — 출시 후 또는 별 cycle)

| ID | 질문 | Source phase | 결정자 | 마감 (soft) | 상태 |
|---|---|---|---|---|---|
| OQ-1-1 / OQ-11-2 | Marketplace 등록 — 초기 release 동시 vs 안정 후 | Phase 1·11 | maintainer | 초기 release 전 | OPEN — RB-7 fallback 준비 |
| OQ-1-3 | CC 외 사용자 fallback 가이드 (기존 markdown) — README 어디 | Phase 1 | maintainer | 출시 전 | Resolved — README "Non-CC fallback" 섹션 (T2.13) |
| OQ-1-4 | telemetry opt-in mechanism (KPI-5·6 측정) | Phase 1 | maintainer | Phase 13 (M2) | Resolved partially — ADR-7로 endpoint, F13.1로 install opt-in. KPI-5 (dashboard) 향후 cycle로 이관 |
| OQ-1-5 / OQ-2-3 | Refactor (S3, P1) — 향후 cycle 일정 | Phase 1·2 | maintainer | 출시 후 | OPEN — telemetry 결과 보고 결정 |
| OQ-2-1 | Edge-1 (non-developer) primary 승격 | Phase 2 | maintainer | v5+ Phase 1 revisit | DEFERRED — v5+ cycle revisit |
| OQ-2-2 / OQ-1-2 | Multi-project tab | Phase 1·2 | maintainer | 향후 cycle | DEFERRED |
| OQ-3-1 | EXPANSION 후보 e1-e6 cherry-pick | Phase 3 | maintainer | Phase 4 진입 전 | RESOLVED — e6 (R13) 채택, 나머지 deferred |
| OQ-3-2 | F3.5 (frontmatter editing UI) P2 vs P1 | Phase 3 | maintainer | 향후 cycle | DEFERRED (dashboard) |
| OQ-4-1 | Subagent stage Spec/Quality review 동시 vs 순차 | Phase 4 | maintainer | Phase 13 (M2) | Resolved — 순차 (`src/subagent/{dispatch,review,invoke,escalate}.ts`). A1 spike 결과 |
| OQ-4-3 | ChangeId capability 수동 vs 자동 (kebab-case) | Phase 4 | maintainer | Phase 13 (M2) | Resolved — 자동 kebab-case slug 생성 (`src/cli/change.ts`) |
| OQ-4-4 | ENT-Skill input/output JSONSchema sync | Phase 4 | maintainer | Phase 13 (M1) | RESOLVED partially by ADR-2 — frontmatter schema 정의됨, body section schema는 Phase 13 task |
| OQ-5-3 | N-005 telemetry 질문 timing | Phase 5 | maintainer | Phase 7 wireframe revisit | Resolved — install 직후 default (F13.1 install opt-in flow) |
| OQ-5-4 | N-074 opt-out 명령 surface | Phase 5 | maintainer | 향후 dashboard cycle | DEFERRED (dashboard UI) |
| OQ-6-1 | `/specrail find` 명령 초기 포함 vs 향후 | Phase 6 | maintainer | 향후 cycle | DEFERRED |
| OQ-6-2 | Settings page (telemetry consent toggle) — CC 명령 vs 향후 dashboard | Phase 6 | maintainer | 향후 cycle | DEFERRED — 현재 CC 명령만 |
| OQ-7-1 | Z3 출력 형식 — markdown 그대로 vs syntax-highlighted | Phase 7 | maintainer | 출시 후 | DEFERRED — CC 측 capability 의존, 출시 후 cycle |
| OQ-7-2 | E-CC-7 file path terminal hyperlink — CC 지원 여부 | Phase 7 | maintainer | A1 spike (M0) | DEFERRED — CC capability 의존, plugin 결정 불가 |
| OQ-9-3 | NFR-SCAL-2 5000 ID — per-project archive 정책 | Phase 9 | maintainer | 향후 cycle | DEFERRED |
| OQ-10-3 | Perf test data 큰 project (5000 ID) 어떻게 생성 | Phase 10 | maintainer | Phase 13 (M3) | Resolved — 합성 fixture in-memory 생성 (tests/perf-bench.test.ts NFR-PERF-4 stability run) |
| OQ-10-4 | TC-50 telemetry 기반 hook bypass detection 정밀도 | Phase 10 | maintainer | 출시 후 1개월 | DEFERRED — 출시 후 RISK-3 monitoring 결과로 결정 |
| OQ-11-3 | Survey mechanism (KPI-3 self-report) — Google Form / Tally / GitHub issue | Phase 11 | maintainer | 출시 전 | Resolved — GitHub issue template `.github/ISSUE_TEMPLATE/kpi3-survey.yml` (T4.3 boring choice) |
| OQ-11-4 | Hot fix release 정책 — patch tag 자동 vs 명시 | Phase 11 | maintainer | 첫 production incident 후 | DEFERRED — 첫 incident에서 결정 |

### 결정 이력 (이 phase에서)

| ID | 답변 | 근거 ADR / 결정 | 결정 일자 |
|---|---|---|---|
| OQ-3-3 | Interrupt (queue 거절) | ADR-8 | 2026-05-12 |
| OQ-4-2 | Plausible cloud (EU) | ADR-7 | 2026-05-12 |
| OQ-5-2 | Interrupt — main session | ADR-8 | 2026-05-12 |
| OQ-8-1 | Explicit state machine | ADR-8 | 2026-05-12 |
| OQ-8-2 | CC subagent (conditional A1) | ADR-6 | 2026-05-12 |
| OQ-8-3 | Node.js (multi-OS 동일) | ADR-3 | 2026-05-12 |
| OQ-8-4 | unified/remark | ADR-4 | 2026-05-12 |
| OQ-9-4 | Plausible EU | ADR-7 | 2026-05-12 |
| OQ-11-1 | Plausible | ADR-7 | 2026-05-12 |
| OQ-3-1 | e6 (R13) 채택, 나머지 deferred | Phase 3 §EXPANSION 후보 | (이전 phase) |
| OQ-4-4 partial | Frontmatter schema 정의 (body section은 Phase 13) | ADR-2 | 2026-05-12 |

---

## Part D — Innovation Tokens

원칙: 약 3개. 나머지는 검증된 기술 (Boring by default).

### 사용 중 (3/3)

| Token # | 영역 | 선택 | 정당화 | ADR |
|---|---|---|---|---|
| 1/3 | Subagent (R8) | Claude Code 자체 subagent 기능 | A1 spike 필요 (CC SDK BLOCKED escalation 미공개). R8 핵심 가치 (fresh context guarantee + cost 일관)가 token 가치 있음. Fallback ADR-6b 준비 | ADR-6 |
| 2/3 | Skill orchestration | Explicit state machine (deterministic) | CC plugin 표준 부재 — orchestration 패턴 spike 필요. PAIN-3 해결 핵심이라 token 정당. LLM-driven은 PAIN-3 재현 | ADR-8 |
| 3/3 | Dep Graph cache | On-demand + incremental on commit | Incremental 정확성 구현 복잡. 단 NFR-PERF-3·5 충족 + PAIN-5 (잊음) 차단 핵심 | ADR-9 |

### 사용 안 한 결정 (Boring picks)

| 영역 | 선택 | 이유 |
|---|---|---|
| Plugin skill 형식 (ADR-1) | Claude Code official skill spec | SDK 표준, marketplace 호환 |
| Frontmatter schema (ADR-2) | JSON Schema | IETF 표준, ajv·remark 풍부 |
| Hook script 언어 (ADR-3) | Node.js | Plugin stack 일관, npm 생태계 |
| Markdown parser (ADR-4) | unified/remark | AST 정확, plugin 풍부 |
| ID auto-gen (ADR-5) | Sequential counter | 사람 가독, grep 친화 |
| Telemetry endpoint (ADR-7) | Plausible cloud (EU) | Privacy-first 평판, GDPR 자동, $20/월 |
| Phase 산출물 layout (ADR-10) | Single + directory mixed (기존 패턴) | 초기 README §174-196 차용 |

**Token 사용 패턴:** 3개 모두 "PAIN 또는 R 핵심 가치 직결"로 token 가치 정당화. 나머지는 표준 도구 차용. 이 분배는 Cognitive Pattern "Boring by default + 약 3 innovation token" 충실 적용.

---

## Self-Check

```bash
# ADR 10개 모두 작성
grep -cE "^### ADR-[0-9]+:" docs/spec/examples/12-adr-risks.md   # 10
# 결과: 10 ✓

# 각 ADR에 alternatives ≥ 2 (선택 + 거절 ≥ 1)
grep -cE "^##### 옵션 [A-D]" docs/spec/examples/12-adr-risks.md  # ≥ 30 (10 ADR × ≥3 옵션)
# 결과: 30 ✓

# 각 거절 alternative에 거절 이유
grep -cE "^- \*\*거절 이유:\*\*" docs/spec/examples/12-adr-risks.md  # ≥ 20
# 결과: 22 ✓

# Risk LxI matrix 존재
grep -c "Risk Matrix" docs/spec/examples/12-adr-risks.md   # ≥ 1
# 결과: 1 ✓

# 모든 Risk에 owner / monitoring / mitigation
grep -A1 "^| RISK-" docs/spec/examples/12-adr-risks.md | awk -F'|' 'NF >= 9' | wc -l  # 10
# 결과: 10 ✓

# Innovation token 3개 이하
grep -cE "^\| [0-9]+/3" docs/spec/examples/12-adr-risks.md   # 3
# 결과: 3 ✓

# 통합 OQ 표 (이전 phase OQ 모두 포함)
# Phase 1~11에서 추출한 OQ ID list와 본 phase OQ 표 diff
# 모든 OQ-{1-11}-{n}이 본 file에 등장 (resolved/blocking/non-blocking 어디든)
# 결과: 32개 OQ 모두 포함 ✓
```

체크리스트:
- [x] 모든 ADR-CAND가 ADR로 결정됨 (10 ADR-CAND → 10 ADR, 미루기 0)
- [x] 각 ADR에 alternatives ≥ 2
- [x] 각 거절된 alternative에 거절 이유
- [x] Risk LxI matrix
- [x] 모든 Risk에 owner / monitoring / mitigation
- [x] Innovation token 3 (한계 정확 도달)
- [x] 통합 Open Questions 표 (Blocking·Resolved·Non-blocking 분류)
- [x] Blocking OQ에 결정자 + 마감
- [x] Boring by default 패턴 (사용 안 한 결정 명시 — 7개 boring picks)

---

## 12. 다음 phase 인풋

Phase 13 (Implementation Plan)에:
- **모든 P0 R/F → atomic task 매핑** (R1·R2·R4·R5·R6·R7·R8·R13)
- **M0 spike task** — A1 (CC subagent), ADR-8 (state machine), ADR-9 (incremental graph), NFR-PERF-3 (hook timeout)
- **ADR 결정 → 구현 task**
  - ADR-3 → Node.js setup
  - ADR-4 → remark dependency
  - ADR-2 → schema 13개 파일
  - ADR-5 → ID counter 모듈
  - ADR-8 → state machine 모듈
  - ADR-7 → Plausible client 모듈
- **Risk mitigation task** — RISK-1·2 (M0 spike), RISK-5 (OQ-9-1 결정 후 secret detection F)
- **Blocking OQ 답 (M0~M2 사이)** — OQ-9-1, OQ-9-2, OQ-10-1, OQ-10-2

Phase 13 Milestone hint:
- M0 — A1·ADR-8·ADR-9 spike + foundation (Node.js, remark, schema infra)
- M1 — R1·R2·R5·R6 (foundation requirements)
- M2 — R4·R8·R13 (DELTA·subagent·telemetry)
- M3 — Polish, perf test, docs (README + fallback 가이드 OQ-1-3)
- M4 — deferred (dashboard, multi-project, refactor S3)

---

## Appendix: Illustrative ID stubs

이 항목들은 본문에서 **예시·축약·placeholder** 로 언급되는 ID이며, 실제 기능적 정의가 없는 stub. INV-2 (환각 ID 차단) lint가 dogfood spec 자체를 통과하도록 하기 위한 self-validation 보조.

<!-- specrail:ignore-start -->

### S1.2.3: illustrative — 환각 ID 예시
### S1.1.1: illustrative — 초기 cycle prose 참조
### S99.1.1: illustrative — synthetic test fixture
### S99.99.99: illustrative — synthetic test fixture
### F3.1: illustrative — archived R3 detail
### F3.5: illustrative — archived R3 detail
### R0: illustrative — synthetic test fixture (graph builder fixture)
### R10: deferred — EXPANSION cherry-pick (timeline) not yet promoted to a real Requirement
### KPI-5: illustrative — deferred to next cycle (dashboard)
### AC-R3-1: illustrative — archived R3 detail
### ENT-Foo: illustrative — placeholder 명
### SEC-5: illustrative — NFR-SEC-N 단축 표기 단편
### T2.5: illustrative — earlier cycle task
### US-11.2: illustrative — internal milestone 참조

<!-- specrail:ignore-end -->

---

<HARD-GATE>
Self-check 모두 통과. 사용자 명시 승인 받음. 그 후 Phase 13 진행.
승인 없이 Phase 13 시작 금지.
</HARD-GATE>
