# specrail dashboard (product cycle, pre-implementation)

이 디렉토리는 **specrail dashboard** 라는 별 product 의 13-phase spec 이 들어갈 자리입니다. PRD §10 에서 plugin cycle 과 분리·예고된 cycle.

## 현재 상태

- `docs/spec/` : 비어 있음. `specrail:orchestrator` 의 산출물이 채울 예정 (phase 01~13).
- monorepo 구조는 아직 적용되지 않음. plugin source 는 여전히 repo root 의 `src/`, `skills/`, `schemas/` 등에 있음. monorepo migration 은 **dashboard 의 phase 13 implementation plan** 의 한 task 로 편입.

## 입력 자료

- `docs/superpowers/specs/2026-05-16-specrail-dashboard-design.md` — superpowers brainstorming 으로 작성된 사전 design 노트. **권위적 spec 이 아니라** phase 1 PRD 작성 시 input 재료.
- `docs/spec/` (repo root) — specrail plugin 자체의 spec. dashboard PRD §2 (status quo) 참조.
