# Codex 작업 프롬프트 모음

## 1. 문서 개정 프롬프트

```text
Context Sketch Lab / SketchFlow 문서 세트를 v1 방향으로 개정해 주세요.

핵심 변경:
- AI 이미지 분석 제거
- 스케치 해석은 튜터 입력으로 처리
- AI는 글 생성, 글 구조 분석, 튜터 피드백 기반 평가/피드백/리포트 초안 생성
- MVP가 아니라 실사용 가능한 v1 전체 범위로 개발
- 디자인 수준은 튜터 워크벤치와 교육 연구실 느낌으로 높게 설정
```

## 2. Phase 0 텍스트 AI 스파이크 프롬프트

```text
/docs/04_PHASE0_NONVERBAL_SKETCH_SPIKE.md와 /docs/07_AI_NONVERBAL_IMAGE_ANALYSIS_SPEC.md의 개정 내용을 기준으로 Phase 0 텍스트 AI 스파이크를 구현해 주세요.

구현 범위:
1. /api/ai/generate-text-test
2. /api/ai/analyze-text-structure-test
3. /api/ai/evaluate-tutor-feedback-test
4. /src/lib/ai/openai.ts
5. /src/lib/schemas/textGeneration.ts
6. /src/lib/schemas/textStructureAnalysis.ts
7. /src/lib/schemas/tutorFeedbackEvaluation.ts
8. 테스트 화면

주의:
- AI 이미지 분석은 구현하지 마세요.
- OpenAI API key는 서버에서만 사용하세요.
- 모든 AI 결과는 Zod schema로 검증하세요.
```

## 3. 디자인 시스템 프롬프트

```text
Context Sketch Lab v1의 디자인 시스템과 앱 shell을 구현해 주세요.

톤:
- 교육 연구실
- 튜터 워크벤치
- 차분하고 전문적
- 반복 작업에 적합한 고밀도 화면

구현:
- 공통 레이아웃
- 사이드바
- 상단 작업 바
- 상태 배지
- 폼 컴포넌트
- AI 결과 패널
- 리뷰/승인 패턴
```

## 4. Supabase/Auth 프롬프트

```text
/docs/08_SUPABASE_SCHEMA_RLS_GUIDE.md를 기준으로 Supabase schema, RLS, Auth 연동을 구현해 주세요.

우선순위:
1. profiles
2. organizations
3. learning_groups
4. learning_group_members
5. texts
6. text_analyses
7. learning_sessions
8. submissions
9. tutor_reviews
10. feedbacks
11. portfolios
12. ai_logs
```

## 5. 튜터 워크벤치 프롬프트

```text
튜터가 글 생성, 글 분석, 세션 생성, 제출물 리뷰, 피드백 승인을 한 흐름에서 처리할 수 있는 워크벤치를 구현해 주세요.

AI 결과는 항상 편집 가능한 초안으로 보여 주세요.
튜터 승인 전에는 학생에게 공개하지 마세요.
```
