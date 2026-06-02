# 배포 및 환경 변수 가이드

## 서비스 구성

- Repository: GitHub `scottzeong/context-sketch-lab`
- Hosting: Vercel
- Database/Auth/Storage: Supabase
- AI: OpenAI API
- Production domain: `https://roterfaden.kr`

## Vercel 환경 변수

Vercel Project Settings > Environment Variables에 Production 기준으로 아래 값을 등록합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
```

주의:

- `NEXT_PUBLIC_` 값은 브라우저에 노출됩니다.
- `SUPABASE_SERVICE_ROLE_KEY`와 `OPENAI_API_KEY`는 클라이언트 코드에서 사용하지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 관리자 계정 생성 API에서만 사용합니다.

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
011_config_options.sql
012_rubric_config_options.sql
013_admin_option_prompts_and_weights.sql
014_submission_image_rls_fix.sql
015_secure_review_feedback_rls.sql
016_split_submission_update_rls.sql
017_performance_indexes.sql
```

중요:

- `003_auth_storage_rls.sql`은 `submission-images` Storage bucket과 기본 RLS에 필요합니다.
- `010_report_drafts.sql`은 리포트 초안 저장에 필요합니다.
- `011_config_options.sql`은 운영 옵션 드롭다운 저장에 필요합니다.
- `012_rubric_config_options.sql`은 루브릭 평가구조 설정에 필요합니다.
- `013_admin_option_prompts_and_weights.sql`은 글구조/루브릭 프롬프트 입력과 루브릭 가중치에 필요합니다.
- `014_submission_image_rls_fix.sql`은 학생 이미지 업로드와 Storage RLS 정리에 필요합니다.
- `015_secure_review_feedback_rls.sql`은 학생/보호자가 공개 피드백만 볼 수 있게 리뷰/피드백 RLS를 강화합니다.
- `016_split_submission_update_rls.sql`은 학생 제출 편집과 튜터 상태 변경 권한을 분리합니다.
- `017_performance_indexes.sql`은 운영 조회 성능을 위한 인덱스를 추가합니다.

## 배포 절차

1. 로컬에서 검증합니다.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

2. 변경사항을 커밋하고 GitHub에 push합니다.

```powershell
git add .
git commit -m "..."
git push
```

3. Vercel Deployments에서 Production 배포 성공 여부를 확인합니다.
4. 필요한 신규 SQL migration을 Supabase SQL Editor에서 실행합니다.
5. `https://roterfaden.kr`에서 주요 화면을 확인합니다.

## 배포 후 확인 화면

```text
/
/login
/manual
/onboarding
/admin/users
/tutor/workbench
/tutor/texts
/tutor/groups
/tutor/sessions
/tutor/submissions
/tutor/reports
/student/dashboard
/student/portfolio
/parent/dashboard
```

## 운영 체크

- Vercel Production 배포가 성공했는가?
- Supabase 환경 변수가 Production에 모두 들어갔는가?
- SQL migration 001-017이 순서대로 적용되었는가?
- `submission-images` bucket이 private으로 존재하는가?
- 관리자 Settings에서 운영 옵션 저장이 되는가?
- 글구조/루브릭 프롬프트와 루브릭 가중치가 저장되는가?
- AI 글 생성, 구조 분석, 피드백 평가 API가 정상 응답하는가?
