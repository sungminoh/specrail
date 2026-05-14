# specrail — Agent Working Notes

이 파일은 이 plugin **자체를 개발·유지보수**할 때 따를 메타 규칙.

## Repo 구조 (작업 전 숙지)

- `skills/_common/principles.md` — 모든 phase skill에 auto-inject되는 공통 ETHOS·Anti-Sycophancy·4 Modes·HARD-GATE·AskUserQuestion 규칙. `src/skill/inheritance.ts`가 런타임에 prepend.
- `skills/phase-NN-*/SKILL.md` — 13개 phase 각각의 실제 prompt (manifest + body 통합). user가 `/specrail phase N` 호출 시 이 본문이 곧 skill.
- `skills/orchestrator/SKILL.md` — `/specrail` 진입점.
- `docs/spec/NN-*.md` — **이 plugin 자체의 현재 spec** (PRD·Personas·Features·Domain·…·Implementation Plan). dogfood 결과물이자 living document.
- `src/` — plugin 구현. `tests/` — vitest.
- `schemas/phase-NN.json` — 각 phase frontmatter validation schema.

## 두 가지 역할이 한 repo에 있음 — 주의

이 repo는:
1. **Plugin source** (skills/, src/) — npm에 배포되는 코드.
2. **그 plugin이 자기 자신에 적용된 spec** (docs/spec/) — 이 plugin이 어떤 제품인지를 13 phase로 기술.

두 가지가 분리되어야 한다는 점:
- `docs/spec/`은 user가 plugin을 깐 뒤 자기 spec을 쓰는 위치이기도 하다. 이 repo에선 그 위치에 plugin 자체의 spec이 있을 뿐.
- plugin 코드 / skill 내용 변경은 `docs/spec/` (plugin spec) 변경과 일관되어야 함. spec과 코드가 어긋나면 둘 중 하나 고치고 commit.
- DELTA mode로 plugin을 진화시킬 때: `/specrail change "<topic>"` → `changes/{date}-{topic}/proposal.md` → 영향 phase의 deltas/ → 승인 후 `docs/spec/`에 머지.

## Plugin 자체에 spec/skill 새로 추가할 때

- Phase prompt 내용 = `skills/phase-NN-*/SKILL.md` 본문. 별도 prompt 파일 안 만듦.
- 공통 규칙 = `skills/_common/principles.md`. 모든 phase가 자동 상속.
- Schema 변경 = `schemas/phase-NN.json` + `tests/` fixture 동시에.

## 금지

- `docs/spec/`에서 phase prompt 본문을 별도 파일로 분리하지 말 것 (예전 구조였음. 통합 완료).
- `docs/spec/examples/` 같은 별도 dogfood 경로 만들지 말 것. `docs/spec/`이 곧 dogfood.
- "참조 link inject" 같은 wire-up 안 된 메커니즘 다시 도입하지 말 것. SKILL.md 본문이 곧 skill prompt.
