---
name: phase-9-non-functional-requirements
description: 7 domains - Performance, Scalability, Availability, Security (STRIDE), Privacy, Accessibility (WCAG), i18n. 모두 측정가능.
inputs-from: Phase 1 §4(성공지표) + Phase 8 ARCH·EXT
trigger-words: NFR, performance, security, accessibility, privacy
mode: GREENFIELD | DELTA
---

# Phase 9: Non-Functional Requirements

## Purpose

기능 외 충족해야 할 품질 속성을 측정가능하게 사양화.

## Inputs

- PRD §4 성공지표 (KPI)
- Phase 8 ARCH·EXT
- Phase 8 Threat Boundaries
- Phase 1 §5 환경
- (DELTA) `current/09-nfr.md`

<HARD-GATE>
Phase 8 사용자 승인 없이 진행 금지.
</HARD-GATE>

## Mode 상속

- EXPANSION: stricter NFR 추가
- SELECTIVE: minimum + cherry-pick
- HOLD: PRD 시나리오 cover하는 minimum NFR
- REDUCTION: 죽이는 NFR만 (Perf P0, Sec P0)

---

## Anti-Sycophancy

00-common 참조 + Phase 9 특화:

**금지:**
- "성능을 좋게 하면..."
- "보안은 중요해요" (구체 위협 없이)
- "GDPR 준수해야 해요" (구체 의무 없이)
- "WCAG 2.1 AA를 추천해요" (이유 없이)

**대신:**
- 모든 NFR은 측정 단위 + 목표값 + 측정 시점
- 구체 의무는 PRD §3.1 Persona 환경 / §5 카테고리 인용
- 기준 모르면 "기준 미정 — ADR-CAND-{n}" 표시. arbitrary 값 금지.

---

## Reasoning Procedure

1. PRD §4 성공지표 → Performance NFR 후보
2. Phase 8 ARCH 부하 패턴 → Scalability NFR
3. Phase 8 EXT 의존성 → Availability NFR
4. Phase 8 Threat Boundaries → Security NFR (STRIDE)
5. Phase 4 Entity 데이터 분류 → Privacy NFR
6. PRD §3 Persona 사용 환경 → Accessibility NFR
7. PRD §5 환경 (region·언어) → i18n NFR
8. 미정 기준은 ADR-CAND
9. Self-Check + 승인

---

## Constraints

1. **모든 NFR 측정가능** — "빠르게" 금지, 단위 + 수치.
2. **NFR ID 형식 `NFR-{Domain}-{n}`** — 도메인 = PERF / SCAL / AVAIL / SEC / PRIV / A11Y / I18N.
3. **각 NFR에 측정 방법** — 어떻게 측정할지.
4. **위반 시 결과** — NFR이 깨졌을 때 무엇이 무너지나.
5. **기준 모름 → ADR-CAND** — arbitrary 값 금지.
6. **STRIDE 6 카테고리 모두 검토** — Spoofing/Tampering/Repudiation/InfoDisclosure/DoS/EoP.
7. **WCAG 2.1 AA 기본** — 이유 있을 때만 더 높이거나 낮춤.
8. **i18n: 사용 언어 명시**.

---

## Output Format

````markdown
# Non-Functional Requirements

**Mode:** {inherited}
**Inputs:** PRD §4, Phase 8 ARCH·EXT·Threat
**Date:** YYYY-MM-DD

## 1. Performance (Perf)

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-PERF-1 | <지표 1> | ms / s / KB / 등 | <수치> | <측정 방법> | <결과> |
| NFR-PERF-2 | ... | ... | ... | ... | ... |

PRD §4 KPI 직접 매핑되는 NFR-PERF-* 명시.

## 2. Scalability (Scal)

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-SCAL-1 | 동시 사용자 | concurrent | <수> | load test | 응답 지연 |
| NFR-SCAL-2 | RPS sustain | req/s | <수> | load test | 큐잉 실패 |
| ... | ... | ... | ... | ... | ... |

## 3. Availability (Avail)

| ID | NFR | 측정 단위 | 목표 | 측정 방법 | 위반 시 |
|---|---|---|---|---|---|
| NFR-AVAIL-1 | uptime | % | <수> | uptime 모니터 | <결과> |
| NFR-AVAIL-2 | RPO | hour | <수> | DR 테스트 | 데이터 손실 |
| NFR-AVAIL-3 | RTO | hour | <수> | DR 테스트 | 영업 중단 |
| NFR-AVAIL-4 | EXT-{n} 다운 시 | <시간 단위> | <목표> | 모니터 | <결과> |

Cognitive Pattern: **Error budgets over uptime targets**. 99.5% = 0.1h budget/월. budget를 ship에 spend.

## 4. Security (Sec) — STRIDE

각 STRIDE 카테고리에 대해 thread + 완화.

### Spoofing
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-1 | <인증 위조> | <완화> |

### Tampering
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-{n} | <변조> | <완화> |

### Repudiation
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-{n} | <부인> | <audit log·증거 보존> |

### Information Disclosure
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-{n} | <정보 노출> | <완화> |

### DoS
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-{n} | <리소스 고갈> | <rate limit·timeout·budget> |

### Elevation of Privilege
| ID | Threat | 완화 |
|---|---|---|
| NFR-SEC-{n} | <권한 상승> | <authz check·IDOR 방지> |

### Compliance 후보 (해당 시)
| ID | 의무 | 적용 영역 |
|---|---|---|
| NFR-SEC-COMP-1 | <SOC2 / GDPR / HIPAA / etc.> | ADR-CAND-{n} |

## 5. Privacy (Priv)

PRD §3 Persona 데이터 분류 + Phase 4 Entity 분류.

| ID | 데이터 | 분류 | 처리 정책 |
|---|---|---|---|
| NFR-PRIV-1 | <데이터 1> | <PII / public / sensitive / secret> | <마스킹·암호화·retention> |
| ... | ... | ... | ... |

해당하는 권리 / 의무:
- 데이터 export
- 데이터 삭제
- 동의 (cookie / push / etc.)
- 데이터 region

## 6. Accessibility (A11y) — WCAG 2.1 AA

| ID | NFR | 측정 방법 |
|---|---|---|
| NFR-A11Y-1 | Color contrast 4.5:1 | axe-core, manual |
| NFR-A11Y-2 | Keyboard 전체 navigation | manual + automated |
| NFR-A11Y-3 | Screen reader semantic | manual test |
| NFR-A11Y-4 | Focus indicator visible | manual |
| NFR-A11Y-5 | Form label association | axe-core |
| NFR-A11Y-6 | Error message screen-reader 인식 | aria-live |
| NFR-A11Y-7 | Image alt | axe-core |
| NFR-A11Y-8 | <기타 — 동영상 자막 등> | manual |

기준 미정 → ADR-CAND-{n}: AAA로 강화 검토 (대상 사용자에 따라).

(non-UI product — CLI·OSS 라이브러리 등 — 이 섹션 단순화)

## 7. Internationalization (i18n)

| ID | NFR | 정책 |
|---|---|---|
| NFR-I18N-1 | 기본 언어 | <한국어 / English / etc.> (PRD §3 Persona 환경) |
| NFR-I18N-2 | 추가 언어 | <Phase N에 추가> |
| NFR-I18N-3 | 시간대 | <UTC 저장 / 사용자 profile / 시스템 자동> |
| NFR-I18N-4 | 통화 | <단일 / multi> (해당 시) |
| NFR-I18N-5 | 날짜 형식 | locale 기반 |
| NFR-I18N-6 | 텍스트 길이 | <어떤 언어 기준 + 확장 비율> |
| NFR-I18N-7 | RTL 지원 | <미지원 / 지원> + 이유 |

## 8. NFR ↔ ARCH 매핑

| NFR | 영향받는 ARCH |
|---|---|
| NFR-PERF-{n} | ARCH-{n}, ARCH-{m} |
| NFR-AVAIL-{n} | ARCH-{n} (모두) |
| NFR-SEC-{n} | ARCH-{n} (특정) |
| ... | ... |

## 9. Open Questions

| Q ID | 질문 | 결정자 | Blocking? |
|---|---|---|---|
| OQ-9-1 | <Compliance 적용 시기> | CTO | N |
| OQ-9-2 | <RPO 가능한 storage 비용> | Eng | Y |

## 10. 다음 phase 인풋

Phase 10 (Test Strategy)에:
- 측정가능 NFR 모두 (테스트 케이스 매핑)

Phase 11 (Operations)에:
- Availability·Backup·Monitoring NFR

Phase 12 (ADR)에:
- 모든 ADR-CAND-{n}
````

---

## DELTA Mode

기존 NFR 위에 변경.

### 형식

`changes/{date}-{topic}/deltas/09-nfr-delta.md`:

````markdown
## ADDED NFR
| ID | NFR | 목표 | 이유 (변경 trigger) |

## MODIFIED NFR
### NFR-{existing}
- 목표 Δ: <before → after>
- Reason
- Impact: <어느 ARCH 영향>

## REMOVED NFR
- NFR-{n}: 더 이상 유효 안 함 / 다른 NFR으로 대체

## STRIDE Δ
새 threat 또는 변경된 완화

## Privacy Δ
새 데이터 종류, 새 분류

## i18n Δ
언어 추가/제거
````

---

## Self-Check

```bash
# 측정 단위 없는 NFR
grep -E "^\| NFR-" 09-nfr.md | awk -F'|' '{print $4}' | grep -iE "좋|빠르|편하|쉽" && echo "측정값 모호"

# STRIDE 6 카테고리 모두
for cat in Spoofing Tampering Repudiation Disclosure DoS Elevation; do
  grep -q "$cat" 09-nfr.md || echo "STRIDE $cat 누락"
done

# WCAG 명시 (UI product)
grep -i "WCAG\|2.1\|AA\|AAA" 09-nfr.md

# i18n 언어 명시
grep -E "한국어|영어|Korean|English|언어" 09-nfr.md

# NFR ↔ ARCH 매핑 존재
grep "NFR.*ARCH\|매핑" 09-nfr.md
```

체크리스트:
- [ ] 7 domains 모두 (PERF·SCAL·AVAIL·SEC·PRIV·A11Y·I18N)
- [ ] 모든 NFR 측정 단위·목표·방법
- [ ] STRIDE 6 카테고리 모두
- [ ] WCAG 2.1 AA 기본 (UI product)
- [ ] i18n 언어·시간대·통화 명시
- [ ] Privacy 데이터 분류
- [ ] NFR ↔ ARCH 매핑
- [ ] 기준 모름 → ADR-CAND
- [ ] PRD §4 KPI와 NFR-PERF 일치
- [ ] Phase 8 EXT fallback과 NFR-AVAIL 일치

---

<HARD-GATE>
Self-check 통과 + 사용자 승인. Phase 10 진행.
</HARD-GATE>
