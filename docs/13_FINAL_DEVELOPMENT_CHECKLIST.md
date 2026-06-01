# 최종 개발 체크리스트

## 1. 범위 체크

```text
- AI 이미지 분석을 제거했는가?
- 튜터 입력 기반 스케치 해석으로 설계했는가?
- AI 역할이 글 생성, 글 분석, 평가/피드백/리포트 초안으로 제한되는가?
- v1 전체 흐름이 문서화되었는가?
```

## 2. 기능 체크

```text
- Auth와 role 기반 라우팅
- 튜터 글 생성
- 글 구조 분석
- 세션 생성
- 학생 제출
- 튜터 리뷰
- 평가/피드백 초안
- 튜터 승인
- 포트폴리오 저장
- 리포트 생성
- 매뉴얼/릴리즈 노트
```

## 3. AI 체크

```text
- OpenAI API만 사용하는가?
- AI key가 서버에서만 사용되는가?
- 모든 AI 응답이 Zod schema로 검증되는가?
- AI 로그가 저장되는가?
- 튜터 입력을 왜곡하거나 꾸며내지 않는가?
- 최종 판정처럼 말하지 않는가?
```

## 4. 보안 체크

```text
- RLS가 활성화되었는가?
- service role key가 client에 노출되지 않는가?
- 학생 제출 이미지는 private bucket에 저장되는가?
- signed URL 만료 시간이 짧은가?
- 튜터 승인 전 feedback은 학생/보호자에게 보이지 않는가?
```

## 5. 디자인 체크

```text
- 실제 작업 화면이 첫 경험의 중심인가?
- 튜터 워크벤치가 반복 사용에 편한가?
- AI 결과가 읽기 전용 장식이 아니라 편집 가능한 초안인가?
- 상태 흐름이 명확한가?
- 리포트와 포트폴리오가 공유 가능한 수준인가?
- 모바일에서 주요 텍스트와 버튼이 겹치지 않는가?
```

## 6. 배포 체크

```text
- npm.cmd run lint
- npm.cmd run typecheck
- npm.cmd run build
- Supabase migration 적용
- Vercel environment variables 설정
- Production 배포 확인
- User Manual 링크 확인
- Release Notes 작성
```
