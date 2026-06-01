# Supabase Schema 및 RLS 가이드

## 1. 핵심 원칙

```text
- Supabase Postgres를 사용한다.
- 모든 주요 테이블에 RLS를 적용한다.
- AI 이미지 분석 테이블은 만들지 않는다.
- 스케치 이미지는 저장하되, 의미 분석은 tutor_reviews에 튜터 입력으로 저장한다.
- OpenAI API key와 service role key는 client에 노출하지 않는다.
```

## 2. 권장 migration 구조

```text
/supabase/migrations/001_core_schema.sql
/supabase/migrations/002_texts_and_sessions.sql
/supabase/migrations/003_submissions_reviews_feedback.sql
/supabase/migrations/004_portfolios_reports_manual.sql
/supabase/migrations/005_rls_policies.sql
/supabase/migrations/006_storage_policies.sql
```

## 3. Core tables

```text
profiles
organizations
learning_groups
learning_group_members
parent_student_links
```

profiles 주요 필드:

```text
id
role: admin | tutor | student | parent
display_name
email
organization_id
birth_date
age_range
reading_level
created_at
updated_at
```

## 4. Text and session tables

```text
texts
text_versions
text_analyses
learning_sessions
session_materials
worksheet_templates
```

texts:

```text
id
organization_id
created_by
title
body
source_type: ai_generated | tutor_written | imported
age_range
difficulty_level
text_type
structure_type
status: draft | approved | archived
created_at
updated_at
```

text_analyses:

```text
id
text_id
analysis_json
structure_type
learning_goal
created_by
created_at
```

learning_sessions:

```text
id
organization_id
learning_group_id
text_id
text_analysis_id
title
learning_goal
worksheet_template_id
status: draft | published | closed
published_at
created_by
created_at
updated_at
```

## 5. Submission and review tables

```text
submissions
submission_images
tutor_reviews
rubric_scores
feedbacks
reflections
```

submissions:

```text
id
session_id
student_id
student_explanation
status: submitted | under_review | feedback_published
submitted_at
created_at
updated_at
```

submission_images:

```text
id
submission_id
storage_path
image_kind: original | revision
created_at
```

tutor_reviews:

```text
id
submission_id
tutor_id
observation
key_connections text[]
strengths text[]
misconceptions text[]
next_step
review_status: draft | ai_drafted | approved
created_at
updated_at
```

feedbacks:

```text
id
submission_id
tutor_review_id
student_facing
tutor_notes
parent_summary
ai_draft_json
status: draft | approved | published
published_at
created_at
updated_at
```

## 6. Portfolio/report/manual tables

```text
portfolios
tutor_reports
recommendations
manual_docs
manual_revisions
release_notes
ai_logs
```

ai_logs 필수 필드:

```text
id
organization_id
user_id
agent_name
model_name
input_json
output_json
status
error_message
prompt_tokens
completion_tokens
total_tokens
estimated_cost_usd
latency_ms
request_id
created_at
```

## 7. Storage buckets

```text
submission-images: private
worksheet-pdfs: private 또는 restricted
reports: private
manual-assets: public 가능, 민감 이미지 금지
```

## 8. RLS helper functions

```sql
create or replace function public.auth_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.auth_user_organization_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
```

추가 helper:

```text
is_tutor_of_group(group_id uuid)
is_student_in_group(group_id uuid)
is_parent_of_student(student_id uuid)
```

## 9. 보안 원칙

```text
- 학생 제출 이미지는 private bucket에 저장한다.
- signed URL은 짧은 만료 시간으로 발급한다.
- 튜터 승인 전 feedback은 학생/보호자에게 공개하지 않는다.
- 만 14세 미만 학습자 데이터는 보호자 동의와 삭제 정책을 문서화한다.
- AI 학습용 재사용은 명시적 동의 없이는 허용하지 않는다.
```
