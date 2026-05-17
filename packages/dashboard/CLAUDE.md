# dashboard package — Agent Working Notes

이 디렉토리에서 작업하는 모든 agent 가 따라야 할 규칙.

## Spec 우선

- `docs/spec/` 의 13 phase markdown 이 **권위 있는 source of truth**.
- 코드 작성 전 관련 phase 를 읽고, 변경 사항이 spec 의 어느 R/F/S/AC 를 만족하는지 명시.
- Spec 과 코드가 어긋나면 plugin 의 DELTA workflow (`/specrail change`) 로 spec 먼저 갱신 후 코드.

## Design system — DESIGN.md

**모든 시각·UI 결정 전 [`DESIGN.md`](./DESIGN.md) 를 먼저 읽어라.**

- 폰트, 색상, 간격, aesthetic direction 모두 DESIGN.md 정의.
- 미리보기: [`design/preview.html`](./design/preview.html) — 브라우저로 열어서 실제 렌더 확인.
- **사용자 명시 승인 없이 deviate 금지.** RISK 1 (serif body), RISK 2 (gold accent) 는 product 정체성. 이 둘을 깨면 design system 깨짐.
- QA 시 DESIGN.md 와 다른 코드는 finding 으로 표시.
- DESIGN.md 수정이 필요하면 `## Decisions Log` 에 entry 추가하고 사유·결과 기록.

## Frontmatter / attrs schema

- `docs/spec/*.md` 의 entity attrs block 은 `<repo-root>/schemas/attrs.schema.json` 의 `$defs/<kind>` 에 따른다.
- `specrail check` PASS 가 commit 게이트.

## 디렉토리 (현재)

- `docs/spec/` — 13 phase spec (Approved).
- `DESIGN.md` — design system (v0, approved).
- `design/preview.html` — 시각 미리보기 (font + color + dashboard mockup).
- `tests/` — AC stub (v0.1.0 implementation 시 실 test 로 대체).
- `README.md` — 사용자용 (현재 implementation 전 placeholder).

## 디렉토리 (계획)

Phase 13 implementation plan 의 M0-M8 진행 시 추가:
- `server/` — Hono server (ARCH-2/3, adapters ARCH-5/6/7/8).
- `web/` — Vite + React SPA (ARCH-1).
- `bin/` — `specrail-dashboard` npx entrypoint.
- `e2e/` — Playwright 8 must-pass 시나리오.
