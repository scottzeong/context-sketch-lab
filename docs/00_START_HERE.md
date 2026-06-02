# Roter Faden v1 시작 문서

## 1. 방향 전환 요약

Roter Faden은 더 이상 AI가 아이의 손그림을 직접 해석하는 시스템을 핵심으로 삼지 않는다.

새 v1의 중심은 다음과 같다.

```text
튜터가 학습 목표와 글 조건을 설계한다.
AI가 조건에 맞는 학습용 글을 생성한다.
AI가 글의 사고 구조를 분석한다.
학습자는 종이에 비언어적 맥락스케치를 작성한다.
튜터가 스케치를 보고 관찰, 해석, 피드백을 입력한다.
AI는 튜터 입력을 바탕으로 평가 초안, 피드백 초안, 리포트 초안을 만든다.
튜터가 최종 승인한다.
결과는 학습자 포트폴리오로 축적된다.
```

이 전환으로 OpenAI Vision 기반 이미지 분석 리스크를 제거하고, 튜터의 전문 판단을 제품의 중심에 둔다.

## 2. AI 역할

AI는 다음 역할만 수행한다.

```text
1. Text Generator Agent
   튜터가 정한 주제, 분량, 연령, 난이도, 글 구조에 맞춰 학습용 글을 생성한다.

2. Text Structure Analyzer Agent
   생성되거나 등록된 글을 중심 생각, 문단 구조, 원인-결과, 비교-대조, 문제-해결, 주장-근거 등으로 분석한다.

3. Rubric Evaluator Agent
   튜터가 입력한 스케치 관찰과 피드백을 바탕으로 루브릭 평가 초안을 만든다.

4. Feedback Writer Agent
   튜터 입력과 평가 초안을 바탕으로 학습자용 피드백과 보호자/튜터용 요약을 작성한다.

5. Report Draft Agent
   누적 결과를 바탕으로 성장 리포트 초안을 만든다.
```

AI는 스케치 이미지를 최종 판단하지 않는다. 스케치 해석은 튜터의 입력 영역이다.

## 3. v1 개발 목표

MVP만 따로 작게 만들지 않고, 실사용 가능한 v1 전체 흐름을 개발한다.

단, 구현은 다음 순서로 진행한다.

```text
1. 문서 전면 개정 및 v1 범위 확정
2. 디자인 시스템과 정보 구조 설계
3. 텍스트 생성/분석 AI 스파이크
4. Supabase 스키마 및 Auth 구현
5. 튜터 워크벤치 구현
6. 학생 세션 및 제출 흐름 구현
7. 튜터 피드백/평가/승인 흐름 구현
8. 포트폴리오와 리포트 구현
9. 매뉴얼과 릴리즈 노트 구현
10. Vercel 배포 및 운영 점검
```

## 4. Codex에게 먼저 줄 문서

개발 시작 시 다음 문서를 우선 기준으로 삼는다.

```text
1. 01_MASTER_DEVELOPMENT_REQUEST.md
2. 02_DEVELOPMENT_ROADMAP.md
3. 04_PHASE0_TEXT_AI_SPIKE.md
4. 05_V1_SCOPE.md
5. 07_AI_TEXT_GENERATION_AND_ANALYSIS_SPEC.md
6. 08_SUPABASE_SCHEMA_RLS_GUIDE.md
```

이 저장소에는 기존 파일명 호환을 위해 `04_PHASE0_NONVERBAL_SKETCH_SPIKE.md`, `05_MVP_SCOPE.md`, `07_AI_NONVERBAL_IMAGE_ANALYSIS_SPEC.md` 파일명이 유지되어 있지만, 내용은 v1 텍스트 AI 중심으로 개정되어 있다.

## 5. 최우선 판단 기준

```text
AI가 아이 그림을 해석했는가?
```

가 아니라,

```text
튜터가 입력한 관찰과 피드백을 바탕으로 AI가 수업 운영에 바로 쓸 수 있는 글, 분석, 평가, 피드백 초안을 만들었는가?
```

이다.

