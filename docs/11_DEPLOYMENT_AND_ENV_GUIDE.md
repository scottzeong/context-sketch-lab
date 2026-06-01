# 배포 및 환경 변수 가이드

## 1. 배포 대상

```text
Repository: GitHub
Database/Auth/Storage: Supabase
Hosting: Vercel
AI: OpenAI API
```

## 2. 환경 변수

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
APP_BASE_URL=
```

주의:

```text
- OPENAI_API_KEY는 client component에서 사용하지 않는다.
- SUPABASE_SERVICE_ROLE_KEY는 서버 전용이다.
- 브라우저에 노출 가능한 값은 NEXT_PUBLIC_ 접두사가 있는 값으로 제한한다.
```

## 3. Supabase 준비

```text
1. 프로젝트 생성
2. Auth 설정
3. migration 실행
4. RLS 활성화
5. Storage bucket 생성
6. seed data 입력
7. helper function 동작 확인
```

## 4. Vercel 준비

```text
1. GitHub repository 연결
2. 환경 변수 입력
3. Production branch 설정
4. Preview deployment 확인
5. Production deployment 실행
```

## 5. 배포 전 점검

```text
- npm.cmd run lint
- npm.cmd run typecheck
- npm.cmd run build
- Supabase RLS 테스트
- 튜터 승인 전 feedback 비공개 확인
- AI 로그 저장 확인
- 이미지 signed URL 만료 확인
- 매뉴얼 링크 확인
```
