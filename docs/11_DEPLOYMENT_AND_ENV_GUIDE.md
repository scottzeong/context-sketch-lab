# 배포 및 환경 변수 가이드

## 서비스 구성

- Repository: GitHub `scottzeong/context-sketch-lab`
- Hosting: Vercel
- Database/Auth/Storage: Supabase
- AI: OpenAI API
- Production domain: `https://roterfaden.kr`

## 필수 환경 변수

Vercel Project Settings > Environment Variables에 아래 값을 Production 환경으로 등록합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
```

로컬 개발에서는 `.env.local`에 같은 값을 넣습니다.

## 환경 변수 주의사항

- `NEXT_PUBLIC_`으로 시작하는 값은 브라우저에 노출됩니다.
- `SUPABASE_SERVICE_ROLE_KEY`와 `OPENAI_API_KEY`는 절대 클라이언트 코드에서 사용하지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 `/api/admin/create-user`에서 관리자 계정 생성에 사용됩니다.
- OpenAI 모델명은 `OPENAI_TEXT_MODEL`로 관리합니다.

## Supabase SQL 실행 순서

Supabase SQL Editor에서 migration 파일을 번호 순서대로 실행합니다.

```text
001_core_schema.sql
002_texts_sessions_reviews.sql
003_auth_storage_rls.sql
004_profile_admin_policies.sql
005_learning_group_policies.sql
006_parent_view_policies.sql
007_parent_link_admin_policies.sql
008_account_status.sql
009_security_hardening.sql
010_report_drafts.sql
```

중요한 의존성:

- `008_account_status.sql`은 `009_security_hardening.sql`보다 먼저 실행해야 합니다.
- `010_report_drafts.sql`은 리포트 초안 저장 기능에 필요합니다.
- `003_auth_storage_rls.sql`은 `submission-images` Storage bucket과 기본 RLS를 설정합니다.

## Vercel 배포 절차

1. 로컬에서 검증합니다.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

2. 변경 사항을 커밋합니다.

```powershell
git add .
git commit -m "..."
git push
```

3. Vercel Deployments에서 Production 배포 성공 여부를 확인합니다.
4. 배포 후 `https://roterfaden.kr/login` 접속을 확인합니다.
5. Supabase migration이 필요한 배포라면 SQL Editor에서 해당 파일을 실행합니다.

## 배포 후 확인 화면

```text
/login
/onboarding
/admin/users
/tutor/workbench
/tutor/texts
/tutor/groups
/tutor/sessions
/tutor/sessions/new
/tutor/submissions
/tutor/reports
/student/dashboard
/student/portfolio
/parent/dashboard
```

## 배포 체크리스트

- Vercel Production 배포가 성공했는가?
- 환경 변수가 Production에 모두 들어갔는가?
- Supabase migration을 순서대로 적용했는가?
- `submission-images` bucket이 private으로 생성되어 있는가?
- 관리자 계정으로 `/admin/users`에 접속되는가?
- 비관리자가 `/admin/users`에 접근할 때 차단되는가?
- 학생은 자기 세션/제출/피드백만 볼 수 있는가?
- 보호자는 연결 승인된 학생 피드백만 볼 수 있는가?
- 리포트 초안 저장이 정상 동작하는가?
- AI 생성/분석 API가 정상 응답하는가?
