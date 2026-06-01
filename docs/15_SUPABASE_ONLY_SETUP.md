# Supabase-only 개발 세팅 체크리스트

이 프로젝트는 v1부터 localStorage fallback 없이 Supabase를 실제 저장소로 사용한다.

## 1. 환경 변수

`.env.local`에 다음 값을 넣는다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
```

`NEXT_PUBLIC_` 값은 브라우저 클라이언트용이다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용으로만 사용한다.

## 2. Migration 적용

Supabase SQL Editor 또는 Supabase CLI에서 아래 순서대로 적용한다.

```text
supabase/migrations/001_core_schema.sql
supabase/migrations/002_texts_sessions_reviews.sql
supabase/migrations/003_auth_storage_rls.sql
```

`003_auth_storage_rls.sql`은 다음을 포함한다.

- `submission-images` private Storage bucket 생성
- 신규 Auth 사용자 profile 자동 생성 trigger
- role 기반 protected route에 필요한 profile role 저장
- 텍스트, 세션, 제출물, 이미지, 리뷰, 피드백 RLS policy
- Storage object read/upload policy

## 3. 계정과 조직

신규 가입 시 `raw_user_meta_data.role` 값으로 `admin`, `tutor`, `student`, `parent` 중 하나를 넣을 수 있다. 없으면 기본 role은 `tutor`다.

튜터와 학생이 같은 수업 데이터를 보려면 같은 `organization_id`를 공유해야 한다. 학생 계정을 만들 때 기존 조직 id를 `raw_user_meta_data.organization_id`로 넣거나, Supabase Table Editor에서 profile의 `organization_id`를 같은 값으로 맞춘다.

## 4. 현재 구현 기준

- `/tutor/*`, `/student/*`, `/admin/*`, `/parent/*`는 Supabase Auth session이 있어야 접근된다.
- Tutor/Admin은 글 생성 결과 저장, 세션 생성/배포, 제출물 리뷰, 피드백 공개를 수행한다.
- Student는 배포된 세션 조회, 스케치 이미지 제출, 공개 피드백/포트폴리오 확인을 수행한다.
- 스케치 이미지는 Supabase Storage `submission-images` bucket에 저장되고 화면에서는 signed URL로 표시된다.
