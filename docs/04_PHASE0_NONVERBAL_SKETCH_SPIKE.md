# Phase 0 텍스트 AI 기능 검증 스파이크

## 1. 목적

기존의 비언어적 스케치 이미지 분석 스파이크는 폐기한다.

Phase 0의 새 목적은 OpenAI 텍스트 모델만으로 다음 세 가지가 가능한지 검증하는 것이다.

```text
1. 튜터 조건 기반 학습용 글 생성
2. 생성/등록된 글의 구조적 분석
3. 튜터 관찰과 피드백 입력 기반 평가/피드백 초안 생성
```

## 2. 전제

```text
- AI는 아이가 그린 스케치 이미지를 분석하지 않는다.
- 튜터가 스케치를 보고 의미, 관찰, 핵심 연결, 피드백 방향을 입력한다.
- AI는 튜터 입력을 문서화하고 구조화한다.
- AI 결과는 최종 판정이 아니라 튜터 검토용 초안이다.
- OpenAI API만 사용한다.
```

## 3. 테스트 API

```text
POST /api/ai/generate-text-test
POST /api/ai/analyze-text-structure-test
POST /api/ai/evaluate-tutor-feedback-test
```

## 4. 글 생성 입력

```json
{
  "topic": "친구의 웃음소리를 오해한 발표 상황",
  "ageRange": "AGE_9_10",
  "difficultyLevel": "L4",
  "targetLength": "600자",
  "textStructure": "cause_effect",
  "learningGoal": "감정 추론과 원인-결과 구조화",
  "tone": "따뜻하고 현실적인 이야기"
}
```

## 5. 글 구조 분석 출력

```json
{
  "summary": "글의 핵심 내용",
  "mainIdea": "중심 생각",
  "structureType": "cause_effect",
  "paragraphs": [],
  "keyRelations": [],
  "inferencePoints": [],
  "discussionQuestions": [],
  "worksheetSuggestions": []
}
```

## 6. 튜터 피드백 기반 평가 입력

```json
{
  "studentExplanation": "민수가 친구들이 자신을 비웃는다고 생각해서 발표를 멈춘 것 같다고 설명함",
  "tutorObservation": "학생은 감정 변화는 잘 잡았지만 친구들의 실제 의도와 민수의 추측을 구분하지 못했다.",
  "keyConnections": ["웃음소리", "오해", "긴장", "발표 중단"],
  "strengths": ["감정 변화를 시각적으로 표현함"],
  "misconceptions": ["사실과 추측을 구분하지 못함"],
  "nextStep": "사실, 추측, 감정을 서로 다른 기호로 구분해 보기"
}
```

## 7. 성공 기준

```text
- 글 생성 초안이 튜터가 3분 안에 수정할 수 있는 수준인가?
- 구조 분석이 세션 설계와 활동지 선택에 도움이 되는가?
- 평가 초안이 튜터 관찰을 왜곡하지 않는가?
- 피드백 문장이 학생에게 공개 가능한 톤인가?
- 모든 응답이 Zod schema로 검증되는가?
```
