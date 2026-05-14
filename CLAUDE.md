# specrail — Agent Working Notes

이 파일은 이 plugin **자체를 개발·유지보수**할 때 따를 메타 규칙. plugin 사용자가 따를 spec 작성 원칙은 `docs/spec/00-common-principles.md`.

## Self-application example 참조 금지

이 plugin을 만드는 작업(코드, spec, 문서) 중에는 **plugin이 생성하는 self-application example을 참조하지 않는다.**

- 참조 OK: `docs/spec/00-common-principles.md`, 외부 표준 자료, first principles.
- 참조 금지: `docs/spec/examples/`, 과거 self-application 산출물.

**Why:** chicken-and-egg. example을 참조하면서 plugin을 만들면 retrofit이 되고, 자체 dogfood validation 효력이 사라진다. plugin이 example 없이도 self-sufficient한지가 product의 핵심 stress test.

**How to apply:** docs/spec/ 안의 example 디렉토리, 과거 작업 산출물 sample은 열지 않는다. first principles로 작업한다. 막히면 그 자체가 plugin이 해결해야 할 약점의 단서 — 노트만 남기고 진행.
