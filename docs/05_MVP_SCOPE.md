# v1 범위 확정 문서

## 1. v1 목표

v1은 제한된 MVP가 아니라 실제 수업에 사용할 수 있는 1차 제품이다.

핵심 목표:

```text
튜터가 글을 생성하고,
AI가 글을 분석하고,
튜터가 세션을 만들고,
학생이 종이 스케치를 제출하고,
튜터가 관찰과 피드백을 입력하고,
AI가 평가/피드백/리포트 초안을 돕고,
튜터 승인 결과가 포트폴리오로 누적된다.
```

## 2. v1 포함 기능

```text
- Supabase Auth
- role 기반 라우팅
- 관리자 기본 화면
- 튜터 대시보드
- 학생 대시보드
- 학습 그룹 관리
- 학생 등록/그룹 배정
- AI 글 생성
- AI 글 구조 분석
- 글 편집/승인
- 활동지 템플릿 선택
- 학습 세션 생성/배포
- 학생 세션 확인
- 스케치 이미지 업로드
- 학생 자기 설명 입력
- 튜터 리뷰 워크벤치
- 튜터 관찰/핵심 연결/오해/강점/다음 과제 입력
- AI 평가 초안 생성
- AI 피드백 초안 생성
- 튜터 수정/승인
- 학생 피드백 확인
- 성찰 입력
- 포트폴리오 누적
- 성장 리포트 초안
- User Manual
- Release Notes
- AI 로그 저장
```

## 3. v1 제외 기능

```text
- AI 이미지 분석
- OCR 기반 손글씨 판독
- 자동 최종 채점
- 결제/구독
- 고급 추천 엔진
- 모바일 네이티브 앱
- 실시간 채팅
- 다중 LLM provider
- 보호자 세부 권한 고도화
```

## 4. 주요 화면

### 공통

```text
/login
/manual
/manual/tutor
/manual/student
/manual/release-notes
```

### Admin

```text
/admin/dashboard
/admin/users
/admin/organizations
/admin/ai-logs
/admin/manual
```

### Tutor

```text
/tutor/dashboard
/tutor/groups
/tutor/students
/tutor/texts
/tutor/texts/new
/tutor/texts/[textId]
/tutor/sessions
/tutor/sessions/new
/tutor/sessions/[sessionId]
/tutor/submissions
/tutor/submissions/[submissionId]
/tutor/reports
```

### Student

```text
/student/dashboard
/student/sessions/[sessionId]
/student/sessions/[sessionId]/submit
/student/submissions/[submissionId]/feedback
/student/portfolio
```

### Parent

```text
/parent/dashboard
/parent/students/[studentId]/portfolio
/parent/students/[studentId]/reports
```

## 5. v1 성공 기준

```text
- 튜터가 조건 기반 글을 생성하고 수정할 수 있다.
- AI가 글 구조 분석 JSON을 생성한다.
- 튜터가 분석 결과를 기반으로 세션을 만들 수 있다.
- 학생이 스케치 이미지와 설명을 제출할 수 있다.
- 튜터가 스케치를 직접 관찰하고 평가 입력을 남길 수 있다.
- AI가 튜터 입력 기반 평가/피드백 초안을 만든다.
- 튜터가 초안을 수정하고 승인할 수 있다.
- 학생은 승인된 피드백만 볼 수 있다.
- 결과가 포트폴리오와 리포트에 누적된다.
- 디자인이 데모용 수준이 아니라 실제 튜터 워크벤치 수준이다.
```
