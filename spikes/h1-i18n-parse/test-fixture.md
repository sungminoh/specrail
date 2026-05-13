---
phase: 1
status: Draft
title: "v4 plugin — 한국어 우선 spec"
mode: HOLD_SCOPE
---

# Phase 1: PRD — 한국어 + 영어 mix 테스트 🚀

## R1: 한글 식별자 본문에서 ID 추출 검증

본 spec은 한국어와 영어가 혼재한다. 인용 ID: F1.1, S1.2.3, ENT-한글이름은허용안됨.
이모지 처리 🎯·💡·🔥 → parser 영향 X.

### F1.1: 한자 처리 — 改善·變化·建設
한자 헤딩도 지원해야 한다. 인용 R1, INV-2.

### F1.2: 매우 긴 unicode 문자열
"꿈을꾸다잠을자다일어나다밥을먹다" 같은 긴 단어. NFR-SCAL-1 한계 직전.

## R2: NFC vs NFD 정규화 (macOS file system NFD)

macOS file system은 NFD 사용. 사용자 spec 안에서 가능한 차이.
