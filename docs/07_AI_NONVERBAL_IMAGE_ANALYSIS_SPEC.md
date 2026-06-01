# AI 글 생성 및 글 구조 분석 명세

## 1. 목적

v1의 AI는 이미지 분석을 하지 않는다.

AI의 목적은 튜터가 수업 준비와 피드백 작성을 빠르고 체계적으로 할 수 있도록 돕는 것이다.

## 2. Text Generator Agent

### 입력

```json
{
  "topic": "친구의 웃음소리를 오해한 발표 상황",
  "ageRange": "AGE_9_10",
  "difficultyLevel": "L4",
  "targetLength": "600자",
  "textType": "story",
  "textStructure": "cause_effect",
  "learningGoal": "감정 추론과 원인-결과 구조화",
  "mustInclude": ["오해", "긴장", "발표"],
  "avoid": ["노골적인 교훈 문장"],
  "tone": "따뜻하고 현실적인 이야기"
}
```

### 출력

```json
{
  "title": "발표 전의 웃음소리",
  "body": "생성된 학습용 글",
  "estimatedReadingLevel": "AGE_9_10",
  "difficultyLevel": "L4",
  "structureType": "cause_effect",
  "tutorRevisionNotes": [],
  "safetyNotes": []
}
```

## 3. Text Structure Analyzer Agent

### 입력

```json
{
  "title": "발표 전의 웃음소리",
  "body": "분석할 글",
  "learningGoal": "감정 추론과 원인-결과 구조화",
  "targetAgeRange": "AGE_9_10"
}
```

### 출력

```json
{
  "summary": "글 요약",
  "mainIdea": "중심 생각",
  "structureType": "cause_effect",
  "paragraphs": [
    {
      "index": 1,
      "role": "situation_setup",
      "summary": "상황 제시",
      "keyDetails": []
    }
  ],
  "keyRelations": [
    {
      "from": "웃음소리",
      "to": "긴장",
      "relationType": "misinterpreted_cause",
      "explanation": "민수는 친구들의 웃음소리를 자신에 대한 비웃음으로 추측함"
    }
  ],
  "inferencePoints": [],
  "vocabulary": [],
  "discussionQuestions": [],
  "worksheetSuggestions": []
}
```

## 4. Tutor Feedback Evaluation Agent

### 입력

```json
{
  "textAnalysisId": "uuid",
  "studentExplanation": "학생의 짧은 설명",
  "tutorObservation": "튜터 관찰 메모",
  "keyConnections": ["웃음소리", "오해", "긴장", "발표 중단"],
  "strengths": ["감정 흐름을 잘 표현함"],
  "misconceptions": ["사실과 추측을 혼동함"],
  "nextStep": "사실, 추측, 감정을 다른 기호로 표시해 보기"
}
```

### 출력

```json
{
  "rubricScores": [
    {
      "axis": "situation_inference",
      "score": 3,
      "rationale": "감정 변화는 파악했으나 실제 사실과 추측을 구분하는 데 보완이 필요함"
    }
  ],
  "feedbackDraft": {
    "studentFacing": "민수의 긴장한 마음을 잘 잡아냈어요...",
    "tutorNotes": "다음 활동에서 사실/추측 구분을 강화하면 좋음",
    "parentSummary": "감정 추론은 강점이며, 근거 구분 연습이 필요합니다."
  },
  "recommendedNextActivities": [],
  "needsTutorReview": true
}
```

## 5. 공통 원칙

```text
- AI 결과는 최종 판정이 아니다.
- 튜터가 수정할 수 있는 초안으로 작성한다.
- 과도한 확신을 피한다.
- 튜터가 입력하지 않은 관찰을 사실처럼 꾸며내지 않는다.
- 모든 출력은 JSON schema/Zod로 검증한다.
- 모든 호출은 ai_logs에 저장한다.
```
