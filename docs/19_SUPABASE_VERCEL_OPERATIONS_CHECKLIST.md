# Supabase 및 Vercel 운영 체크리스트

## Supabase 프로젝트 확인

- 프로젝트 이름과 URL이 현재 Production 환경과 맞는가?
- Auth가 활성화되어 있는가?
- Table Editor에 주요 테이블이 보이는가?
- Storage에 `submission-images` bucket이 있는가?
- bucket이 private인가?

## SQL Migration 실행 순서

아래 순서대로 실행합니다.

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

## SQL 실행 후 확인

- `profiles.account_status` 컬럼이 있는가?
- `report_drafts` 테이블이 있는가?
- `config_options` 테이블이 있는가?
- `config_options.prompt_text` 컬럼이 있는가?
- `config_options.category`가 `rubric_weight`를 허용하는가?
- 글구조/루브릭 평가구조 프롬프트가 저장되는가?
- 루브릭 가중치 항목이 저장되는가?
- RLS가 모든 주요 테이블에 활성화되어 있는가?
- `submission-images` Storage 정책이 공개 접근이 아닌 권한 기반으로 되어 있는가?
- 학생 계정으로 스케치 이미지를 제출했을 때 `submission_images` row가 생성되는가?
- 학생 포트폴리오 상세에서 제출 이미지가 signed URL로 표시되는가?
- 학생과 보호자 계정에서 공개된 피드백만 조회되는가?
- 학생이 제출물 상태를 `under_review` 또는 `feedback_published`로 직접 바꿀 수 없는가?
- 세션/제출/피드백/부모 연결 조회에 필요한 인덱스가 생성되었는가?

## Vercel 환경 변수

Production 환경에는 아래 값이 있어야 합니다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
OPENAI_TEXT_MODEL
```

권장값:

```text
OPENAI_TEXT_MODEL=gpt-4.1-mini
```

## Vercel 배포 확인

1. GitHub `main` push 후 Vercel deployment가 시작되는지 확인합니다.
2. Build가 성공했는지 확인합니다.
3. Production domain이 `https://roterfaden.kr`로 연결되는지 확인합니다.
4. `/` 프론트 페이지가 보이는지 확인합니다.
5. `/login` 접속이 되는지 확인합니다.
6. 로그인 후 role별 홈으로 이동하는지 확인합니다.

## 운영 중 자주 확인할 것

- Supabase Auth 사용자와 `profiles` row가 일치하는가?
- 신규 사용자에게 `organization_id`가 들어가는가?
- 비활성 계정 접근이 차단되는가?
- OpenAI API 오류가 발생하지 않는가?
- 이미지 업로드가 Storage에 저장되는가?
- 제출 이미지 연결 정보가 `submission_images`에 저장되는가?
- 리포트 저장이 `report_drafts`에 반영되는가?
- 운영 옵션 저장이 `config_options`에 반영되는가?
- 관리자 Settings에서 저장 후 실패 메시지가 뜨지 않는가?
