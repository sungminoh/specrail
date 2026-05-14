---
name: phase-06-information-architecture
description: Phase 06 — Information Architecture
trigger-words: information-architecture
phase: 06
inputs-from: phase-05
state-machine: explicit (ADR-8 — INV-3 transition gate enforced)
applies-to: 00-common (auto-inject)
---

# Phase 06: Information Architecture

이 skill의 본문은 plugin이 `docs/spec/06-information-architecture.md`를 reference link로 inject.

(Architect 옵션 B: T2.5b reference link 방식. 수동 instruction은 T2.5c에서 plugin 자동 강제와 정합하도록 주석화됨.)

Output 산출물 경로: `docs/spec/examples/06-information-architecture.md` (실 사용 시 `docs/spec/06-information-architecture.md`로 작성, examples/는 self-application 참고만)

## State preconditions

- Previous phase status=Approved (INV-3, F2.2 transition gate)
- Phase 1 예외: predecessor 없음

## Auto-inject (F1.2)

이전 phase frontmatter의 `refs` 필드 + R/F/S/ENT/INV ID set이 input으로 inject됨.

## Hooks

- Pre-commit: F2.3 ID consistency + F2.4 schema validation
- Phase transition: F2.2 gate (frontmatter primary)
