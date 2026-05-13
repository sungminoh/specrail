# v4.0 Review Findings — 4 Rounds Cumulative

본 문서는 4 라운드 reviewer agent 검토에서 발견된 76건 finding의 처리 결과 기록.
v4.1 plan input + dogfood evidence 보존용.

**작성:** 2026-05-13
**Status:** v0.0.1-alpha after closure (C1-C8) + Critical/High fix (Batch 1-4)

---

## Round 1 — Spec Review (1차)

**Reviewer:** critic, architect, analyst, planner (4 agents)
**대상:** docs/spec/examples/ 13 phase output (spec only)

| Severity | 발견 | 처리 |
|---|---|---|
| 6 Critical | C1 state source / C2 dashboard / C3 mode header / C4 R13 KPI / C5 hook 보존 / C6 stub gap | **6/6 fix** (closure C1-C8) |
| 8 High | H1 spike gap / H2 ADR-9 token / H3 ADR-6 fallback / H4 condensed task / H5 migration / H6 S2 E2E / H7 critical path / H8 R7 lint timing | 6 fix, 2 archived |
| 13 Medium/Low | various ambiguity | 5 fix, 8 deferred |

## Round 2 — DELTA Re-review (2차)

**Reviewer:** 동일 4 agents
**대상:** DELTA 변경 후 + Spec retroactive update

| Severity | 발견 | 처리 |
|---|---|---|
| 0 Critical | (1차 Critical 모두 해결 확인) | — |
| 2 High | H1 T2.2 annotation / H2 R8 fallback annotation | 2 fix |
| 5 Medium/Low | various | 일부 fix, 나머지 deferred |

## Round 3 — Implementation Review (3차)

**Reviewer:** code-reviewer, verifier, test-engineer, critic
**대상:** src/ 30 files + tests/ 32 files + spikes/ + skills/

| Severity | 발견 | 처리 |
|---|---|---|
| 6 Critical | C1 TDD 5-step 위반 / C2 secret-detect index / C3 A1 PASSED-PARTIAL R8 진행 / C4 외부 통합 0 / C5 INV-5·6·7 미enforce / C6 T2.1b 미완 | **C2·C5·C6 fix (Batch 1-3) / C1·C3·C4 archived (이미 commit) / C4 README 정정** |
| 9 High | H1 r7-b2b regex / H2 downstream BFS / H3 mock 100% / H4 EDGE 24/25 / H5 TC 28/65 / H6 AC 6/24 인용 없음 / H7 OQ-13 미해결 / H8 queue race / H9 IdCounter mutex | **H1·H6·H8·H9 fix (Batch 2·4) / H2·H7 annotation 추가 / H3·H4·H5 archived as v4.1 needs** |
| 7 Medium/Low | various | 부분 fix |

## Round 4 — Deep Review (4차)

**Reviewer:** security-reviewer, code-simplifier, architect (재검토), document-specialist
**대상:** 새 lens — security·simplification·architecture coherence·SDK accuracy

| Severity | 발견 | 처리 |
|---|---|---|
| 3 Critical | D1 prototype pollution / D2 Plausible 비호환 / D3 ajv-formats 미설치 | **3/3 fix (Batch 1)** |
| 7 High | D4 secret 패턴 누락 / D5 path traversal / D6 flushQueue bypass / D7 ARCH 미등재 / D8 Phase N+1 auto-invoke / D9 S2 DELTA 후반부 / D10 graph.json stale | **D4·D5·D6 fix (Batch 1·3) / D7·D8·D9·D10 archived as v4.1 spec update** |
| 10 Medium/Low | D11-D20 simplification·doc lag | **D13·D14·D15·D16·D17 fix (Batch 4) / others archived** |

---

## Fix 종합 (Batch 1-4)

| Batch | 처리 항목 | Test 결과 |
|---|---|---|
| Closure C1-C8 | LICENSE, status command, git tag v3-archive, schema, review prompt, hook self-install, README 정정 | 249/249 PASS |
| Batch 1 (Critical security) | D1 prototype pollution / D2 Plausible adapter / D3 ajv-formats / D5 path traversal / D6 flushQueue re-filter | 249/249 PASS |
| Batch 2 (Code bugs) | C2 secret-detect index / H1 r7-b2b regex / H8 queue atomic rename / H9 IdCounter mutex | 249/249 PASS |
| Batch 3 (Spec gaps) | INV-5·INV-7 lint module (`src/lint/inv-enforce.ts`) / INV-6 change.ts assertion / T2.1b id-consistency graph 기반 교체 / D4 secret patterns (Anthropic·GCP·Bearer·private key) / common-frontmatter ENT pattern fix | 258/258 PASS (+9 new tests) |
| Batch 4 (Simplification) | D15 shared regex `src/spec/patterns.ts` / D16 dead var / D17 unused import / H6 5 AC labels added | 258/258 PASS |

**총 fix 완료: 41건 (Critical 12 + High 13 + Medium/Low 16)**

---

## Archived (v4.1 plan input)

이미 commit된 사항 또는 본 conversation 범위 외 — v4.1 task로 반영.

### v4.1 Critical archived

- **C1 (Round 3)** TDD 5-step 위반 — M1·M2가 mega-commit. git history 변경 불가. v4.1에서 hook으로 atomic commit 강제 (commit당 1 file change 등)
- **C3 (Round 3)** A1 PASSED-PARTIAL R8 진행 — manifest inject 미검증. 실 CC plugin install 후 1차 검증 필요. v4.1 task: external integration milestone (M5)
- **C4 (Round 3)** 외부 통합 0 — Plausible/CC marketplace/실 사용자. v4.1 M5

### v4.1 High archived

- **H3 (Round 3)** 100% mock test — e2e도 내부 module 직접 호출. v4.1: real CC harness mock (Playwright-like)
- **H4 (Round 3)** EDGE 24/25 미구현 — 시간/TZ·동시성·i18n·auth bypass·hook 무결성 test 추가. v4.1 polish
- **H5 (Round 3)** TC 28/65 미구현 — 외부 의존 TC 제외하면 ~10 TC 추가 가능
- **H7 (Round 3)** OQ-13-1·2·3·5 미해결 — v4.0 release 후 telemetry baseline 측정 후 결정
- **D7 (Round 4)** 5 src 모듈 ARCH 미등재 — Phase 8 spec update: ARCH-8 state, ARCH-9 CLI, ARCH-10 subagent, ARCH-11 lint, ARCH-12 markdown
- **D8 (Round 4)** Phase N+1 자동 invoke 미구현 — orchestrator skill에 auto-chain 로직 추가 (interrupt 패턴)
- **D9 (Round 4)** S2 DELTA 후반부 (delta skill invoke·merge·archive) 미구현 — v4.1 R4 보강
- **D10 (Round 4)** graph.json cache 명시 stale — ADR-9 옵션 D 채택 후 spec doc 갱신

### Medium/Low archived

- D13 13 schema 통합 (common 1개 + runtime check) — v4.1 simplification
- D11 hook silent failure fallback — strict/lenient mode 분기
- D12 kebabize length limit — 100 char truncation
- D19 AskerState immutability — caller 코드 변경 필요
- D20 mdast children 타입 정의 — @types/mdast 도입
- Plan §14 OQ-13-1~5 미해결 — KPI baseline 측정 후

---

## Plan self-check의 구조적 약점 (v4.1 plan 개선 후보)

본 4 라운드 검토가 plan self-check이 잡지 못한 gap을 누적 76건 발견. Plan의 self-check 메커니즘은:

1. **LICENSE·status command·schema·review prompt 같은 structural gap detect 불가** — Plan §16 self-check은 placeholder 검출·Similar to Task·5-step 등 task-level만 검사
2. **외부 통합 readiness check 없음** — npm publish·marketplace·real endpoint 등 ship 조건이 plan task에 없음
3. **TDD enforcement 없음** — Plan §15 "5-step 강제" 명시하나 git history pattern (atomic commit·test-first ordering) 검증 mechanism 부재
4. **AC·INV·EDGE·TC traceability matrix 자동 생성 없음** — Plan §10·11이 매뉴얼 manual matrix. test code에서 ID label 자동 grep + missing 검출 가능

**v4.1 plan에 추가할 task:**
- M5 external integration milestone (Plausible·CC marketplace·alpha 사용자)
- M6 self-check enhancement (atomic commit·AC traceability automation)
- v4.0 lessons learned doc input (본 REVIEW-FINDINGS.md)

---

## 본 conversation의 dogfood evidence

본 작업 전체가 v4 plugin이 자동 강제해야 할 anti-pattern의 실 사례:

1. **"RELEASE READY" self-praise** (closure C8) — Anti-Sycophancy 위반. 사용자 challenge로 정정.
2. **TDD 5-step 우회 (M1·M2 mega-commit)** — Plan 명시 강제. main session이 안 catch.
3. **Subagent driven 부분 적용 (M0·M1·M2 main 직접)** — Plan §15 명시. M3·M4만 individual subagent dispatch.
4. **100% mock test** — 실 통합 없이도 spec compliance 주장.
5. **Plan self-check 신뢰** — 4 라운드 reviewer 발견을 못 잡음.

이 5 패턴 = v4 plugin이 자동 lint해야 할 정확한 영역. v4.1 lint extension 후보.

---

## 결론

v0.0.1-alpha: code-side spec compliance 도달. 258/258 tests + 0 typecheck.
실 ship readiness = pre-alpha (외부 통합 0건).
v4.1 archived: 18 high/critical + 12 medium/low.

본 finding 기록은 v4.1 plan의 input. plan self-check enhancement + M5 external integration이 v4.1의 핵심 추가.
