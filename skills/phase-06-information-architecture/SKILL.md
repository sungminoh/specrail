---
name: phase-06-information-architecture
description: Page Tree, Navigation Strategy, Deep Link Patterns, Role Gating. User Flow 페이지 노드와 1:1 매핑.
trigger-words: information-architecture, information architecture, page tree, navigation, deep link
phase: 06
inputs-from: Phase 3 Permission Matrix + Phase 5 페이지 Node
mode: GREENFIELD | DELTA
state-machine: explicit (ADR-8 — INV-3 transition gate enforced)
applies-to: 00-common (auto-inject)
---

# Phase 06: Information Architecture

## Purpose

페이지(또는 화면·뷰)가 어떻게 위계화되고 탐색되는지 사양화. Phase 5 페이지 Node와 1:1.

## Inputs

- Phase 3 Permission Matrix (multi-role product)
- Phase 5 §2 페이지 Node + 섹션 최상위 페이지
- Phase 5 §6 Cross-Section Path (deep link 후보)
- (DELTA) `docs/spec/06-information-architecture.md` (기존 버전)

<HARD-GATE>
Phase 5 사용자 승인 없이 진행 금지.
</HARD-GATE>

## Mode 상속

- EXPANSION: 추가 navigation pattern, 부 페이지 surface
- SELECTIVE: Phase 5 페이지만 base, 추가 cherry-pick
- HOLD: Phase 5 페이지 1:1
- REDUCTION: P0 Spec 페이지만

---

## Anti-Sycophancy

00-common 참조 + Phase 6 특화:

**금지:**
- "보통 이런 navigation을 쓰니까"
- "사용자가 헷갈릴 수 있어요"
- "표준 패턴이라..."

**대신:**
- 모든 페이지는 Phase 5 Node ID 인용 강제
- 모든 navigation 결정은 Persona 도구 환경 인용
- "이 깊이에서 사용자가 잃는 시간은?" 못 답하면 평탄화

---

## Reasoning Procedure

1. Phase 5 페이지 Node 모두 받기
2. Page ID 부여 (`P-{n}`)
3. Tree 구성 — 깊이 ≤ 4
4. Navigation Strategy 결정 (플랫폼 따라 — sidebar / tab / drawer / 화면 전환 등)
5. Deep Link 패턴 명시 (해당하는 경우)
6. Role Gating — 어느 Role이 어느 Page 접근 가능 (multi-role product)
7. Empty / Error states 매핑
8. Self-Check + 승인

---

## Constraints

1. **Page ID `P-{n}`** — Phase 5 페이지 Node와 1:1 매핑.
2. **깊이 ≤ 4** — 4단계 넘으면 평탄화 강제.
3. **Phase 5 Node ID 인용** — 모든 Page는 어느 Node인지 명시.
4. **Permission Matrix와 일치** — Phase 3와 모순 0건.
5. **Deep Link 패턴 명시** — URL pattern 또는 deep link scheme + 인증 요구사항.
6. **Empty state 페이지 명시** — 데이터 없을 때 어디로.
7. **Error state 페이지 명시** — 404·403·500 또는 상응하는 처리.

---

## Output Format

````markdown
# Information Architecture

**Mode:** {inherited}
**Inputs:** Phase 3 Permission Matrix, Phase 5 페이지 Node
**Date:** YYYY-MM-DD

## 1. Page Catalog

| Page ID | 이름 | Phase 5 Node | URL Pattern / 위치 | 깊이 |
|---|---|---|---|---|
| P-1 | <이름> | N-{nnn} | <패턴> | 1 |
| P-2 | <이름> | N-{nnn} | <패턴> | 2 |
| P-3 | <이름> | N-{nnn} | <패턴> | 2 |
| ... | ... | ... | ... | ... |
| P-404 | 미발견 | - | * | - |
| P-403 | 권한 없음 | - | * | - |
| P-500 | 시스템 오류 | - | * | - |

## 2. Page Tree

```mermaid
graph TD
    Root[/] --> Section1[섹션 1]
    Section1 --> P1[P-1 ...]
    Section1 --> P2[P-2 ...]
    Root --> Section2[섹션 2]
    Section2 --> P3[P-3 ...]
    P3 --> P4[P-4 ...]
    P4 --> P5[P-5 ...]
```

## 3. Navigation Strategy

### Top-level (인증 후 또는 메인 진입)

플랫폼 따라:
- 데스크톱: <예: 좌측 sidebar / 상단 tab>
- 모바일: <예: 하단 tab / 햄버거>
- CLI: <예: 첫 명령어 / `--help`>
- 게임: <예: 메인 메뉴>

### Breadcrumb (해당 시)

깊이 N 이상에서 표시.

### Tab Navigation (해당 시)

특정 페이지에 sub-tab.

### 결정 근거

| 결정 | 근거 (Persona 도구·환경 인용) |
|---|---|
| <패턴 1> | <Persona가 이미 사용 중인 비슷한 패턴> |
| <패턴 2> | <환경 제약 또는 사용 컨텍스트> |

## 4. Deep Link Patterns (해당 시)

| Deep Link | URL / Scheme | 인증 | 미인증 시 |
|---|---|---|---|
| <목적> | <패턴> | <필요 / 토큰 / 불필요> | <처리> |

## 5. Role Gating (multi-role product)

각 Page에 어느 Role이 접근 가능. Phase 3 Permission Matrix와 일치.

| Page | 미인증 | ROLE-1 | ROLE-2 | ROLE-3 |
|---|---|---|---|---|
| P-1 | ✅ | ✅ | ✅ | ✅ |
| P-2 | ❌ | ✅ | ✅ | ❌ |
| P-3 | ❌ | ✅ | 자기 것만 | 읽기 |

거부 시:
- 미인증 → 로그인 + `?next=` 보존 (해당 시)
- 권한 부족 → P-403

(single-user product면 이 섹션 생략)

## 6. Empty / Error States 매핑

| 상태 | Page 또는 인라인 |
|---|---|
| 데이터 0개 (목록) | 인라인 "<첫 항목 만들기>" 또는 onboarding |
| 404 | P-404 |
| 403 | P-403 |
| 500 | P-500 + 자동 보고 |
| 네트워크 오프라인 | <글로벌 banner / offline state> |

## 7. URL / 경로 Conventions (해당 시)

- 인증 영역
- 앱 / 기능 영역
- 정적 영역
- 토큰 기반 경로
- ID 위치 (path vs query)

## 8. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-6-1 | ... | <역할> | N |

## 9. 다음 phase 인풋

Phase 7 (Wireframe)에:
- 모든 Page ID + URL Pattern
- Page Tree (위계)
- Navigation Strategy

Phase 8 (Architecture)에:
- URL Conventions (routing 설계)

Phase 9 (NFR)에:
- Empty/Error states 매핑 (a11y, error handling NFR)
````

---

## DELTA Mode

기존 IA 위에 변경.

### 형식

`changes/{date}-{topic}/deltas/06-ia-delta.md`:

````markdown
## ADDED Pages
| Page ID | 이름 | Phase 5 Node | URL Pattern | 깊이 |

## MODIFIED Pages
### P-{existing}
- URL Pattern Changed: <before → after>
- Reason
- Migration: <기존 link redirect>

## REMOVED Pages
- P-{n}: 어디로 redirect

## ADDED Deep Link Patterns
| Pattern | URL | 인증 |

## MODIFIED Role Gating
| Page | Role | Before | After |

## Tree Δ
변경된 부분만 graph로.
````

---

## Self-Check

```bash
# Page ID 형식
grep -E "^\| P-[0-9]+" 06-information-architecture.md | wc -l

# 깊이 4 초과
grep -E "^\| P-[0-9]+" 06-information-architecture.md | awk -F'|' '{print $7}' | grep -E "[5-9]" && echo "깊이 4 초과 있음"

# 모든 Page가 Phase 5 Node 인용 (특수 페이지 제외)
grep -E "^\| P-[0-9]+" 06-information-architecture.md | grep -v "P-40\|P-50" | grep -c "N-[0-9]"

# Empty/Error states 명시
grep -i "empty state\|error state" 06-information-architecture.md

# Mermaid Tree 존재
grep "graph TD\|graph LR" 06-information-architecture.md
```

체크리스트:
- [ ] 모든 Page ID = Phase 5 Node와 1:1 (특수 페이지 제외)
- [ ] 깊이 ≤ 4
- [ ] Mermaid Tree
- [ ] Navigation Strategy 결정 근거 = Persona 도구·환경 인용
- [ ] Deep Link 패턴 + 미인증 처리 (해당 시)
- [ ] Role Gating = Phase 3 Permission Matrix와 일치 (multi-role)
- [ ] Empty/Error states 매핑
- [ ] URL Conventions 명시 (해당 시)
- [ ] 404·403·500 페이지 정의 (해당 시)

---

<HARD-GATE>
Self-check 통과 + 사용자 승인. Phase 7 진행.
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
