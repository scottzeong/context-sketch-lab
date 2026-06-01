# v1 개발 로드맵

## Phase 0. 텍스트 AI 기능 검증

목표:

```text
OpenAI API로 글 생성, 글 구조 분석, 튜터 입력 기반 평가/피드백 초안을 안정적으로 만들 수 있는지 검증한다.
```

구현:

```text
- /api/ai/generate-text-test
- /api/ai/analyze-text-structure-test
- /api/ai/evaluate-tutor-feedback-test
- 공통 OpenAI client
- Zod schema
- 테스트 화면
```

성공 기준:

```text
- 튜터가 수정 가능한 학습용 글 초안 생성
- 글 구조 분석 JSON이 세션 설계에 활용 가능
- 튜터 관찰 입력을 평가/피드백 초안으로 변환 가능
```

## Phase 1. 제품 기반 구축

```text
- Next.js 앱 구조 정리
- 디자인 시스템 도입
- Supabase 프로젝트 연결
- Auth/role 기반 라우팅
- profiles, organizations, groups 기본 스키마
- 공통 레이아웃과 네비게이션
```

## Phase 2. 튜터 워크벤치

```text
- 튜터 대시보드
- 글 생성 조건 입력
- AI 글 생성 결과 편집
- 글 구조 분석 보기
- 학습 목표 선택
- 활동지 템플릿 선택
- 세션 생성 및 배포
```

## Phase 3. 학생 세션 흐름

```text
- 학생 대시보드
- 세션 상세
- 글 읽기
- 활동 안내
- 스케치 이미지 업로드
- 학생 자기 설명 입력
- 제출 완료 상태
```

## Phase 4. 튜터 리뷰와 평가

```text
- 제출물 목록
- 이미지/학생 설명 보기
- 튜터 관찰 입력
- 핵심 연결/오해/강점/다음 과제 입력
- AI 평가 초안 생성
- AI 피드백 초안 생성
- 튜터 수정 및 승인
- 학생 공개
```

## Phase 5. 포트폴리오와 리포트

```text
- 학생별 결과 누적
- 루브릭 변화 추적
- 튜터 메모 히스토리
- 성장 리포트 초안 생성
- 보호자 열람용 리포트
```

## Phase 6. 매뉴얼, 운영, 배포

```text
- 웹 기반 User Manual
- Release Notes
- 관리자 화면
- AI 로그 확인
- Vercel 배포
- Supabase Storage/RLS 점검
```

## 개발 원칙

```text
- v1 전체 구조를 먼저 잡는다.
- 기능은 튜터 실제 작업 흐름 순서로 구현한다.
- AI 결과는 항상 초안이며 튜터 승인 후 저장/공개된다.
- 이미지 분석 기능은 구현하지 않는다.
- 디자인 품질을 기능 개발과 동시에 끌어올린다.
```
