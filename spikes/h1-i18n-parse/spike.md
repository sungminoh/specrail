# Spike: H1 — unified/remark 한국어+영어 mixed parse 검증

**Trigger:** Reviewer H1 (1차 검토), Phase 13 T0.9, NFR-I18N-1, EDGE-7·8
**Date:** 2026-05-13
**Status:** **PASSED**

## Hypothesis

Reviewer H1 — NFR-I18N-1 (한국어 우선) + EDGE-7 (한국어/영어 mix) + EDGE-8 (한자·emoji)에서 unified+remark+remark-frontmatter가 정확 parse?

## Acceptance

- [x] (a) ID extraction 정확 (R/F/S/ENT/INV/NFR 패턴이 한국어 본문에서 매치)
- [x] (b) Frontmatter YAML value에 한국어 string 보존
- [x] (c) Heading 위치 정보 정확

## Test fixture

`test-fixture.md` — 13줄 사양으로 6 종류 case mix:
1. YAML frontmatter에 한국어 string ("v4 plugin — 한국어 우선 spec")
2. 한국어 heading + emoji ("# Phase 1: PRD — 한국어 + 영어 mix 테스트 🚀")
3. 한국어 본문 + ID 인용 (F1.1, S1.2.3 등)
4. 한자 heading ("### F1.1: 한자 처리 — 改善·變化·建設")
5. 매우 긴 unicode 단어 ("꿈을꾸다잠을자다일어나다밥을먹다")
6. NFC vs NFD 언급

## Findings

```
yamlKoreanPreserved: true     (YAML 'title' field에 "한국어 우선" 보존)
headingCount: 5               (모든 heading 인식)
headingLines: [8, 10, 15, 18, 21]  (line 위치 정확)
idsExtracted: [F1.1, F1.2, INV-2, NFR-SCAL-1, R1, R2, S1.2.3]
expectedIds:  [F1.1, F1.2, INV-2, NFR-SCAL-1, R1, R2, S1.2.3]
```

7/7 expected IDs 모두 추출. 누락 0.

## Decision impact

- **ADR-4 (unified/remark) 결정:** 확인. 한국어·한자·emoji 모두 안정 처리.
- **NFR-I18N-1:** Satisfiable.
- **EDGE-7·8:** TC-46·47 작성 시 위 fixture 기반 가능.

## Caveat

- NFC vs NFD 정규화 (EDGE-10, macOS file system) 본 spike 미검증 — 실 file name 차이. file system 측 변환 필요 시 별도 패턴 (`path.normalize` 또는 NFC 강제). Phase 10 TC-49로 cover 예정.

## References

- Phase 13 T0.9
- Reviewer H1 (1차 검토)
- NFR-I18N-1, EDGE-7·8
