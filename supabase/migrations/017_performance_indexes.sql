create index if not exists profiles_org_role_status_idx
on public.profiles (organization_id, role, account_status);

create index if not exists learning_groups_org_name_idx
on public.learning_groups (organization_id, name);

create index if not exists learning_group_members_group_role_idx
on public.learning_group_members (learning_group_id, member_role);

create index if not exists learning_group_members_profile_role_idx
on public.learning_group_members (profile_id, member_role);

create index if not exists parent_student_links_parent_status_idx
on public.parent_student_links (parent_id, status);

create index if not exists parent_student_links_student_status_idx
on public.parent_student_links (student_id, status);

create index if not exists texts_org_status_updated_idx
on public.texts (organization_id, status, updated_at desc);

create index if not exists text_analyses_text_created_idx
on public.text_analyses (text_id, created_at desc);

create index if not exists learning_sessions_org_status_updated_idx
on public.learning_sessions (organization_id, status, updated_at desc);

create index if not exists learning_sessions_group_status_idx
on public.learning_sessions (learning_group_id, status);

create index if not exists learning_sessions_text_idx
on public.learning_sessions (text_id);

create index if not exists submissions_session_status_updated_idx
on public.submissions (session_id, status, updated_at desc);

create index if not exists submissions_student_status_updated_idx
on public.submissions (student_id, status, updated_at desc);

create index if not exists submission_images_submission_kind_idx
on public.submission_images (submission_id, image_kind);

create index if not exists submission_images_storage_path_idx
on public.submission_images (storage_path);

create index if not exists tutor_reviews_submission_status_updated_idx
on public.tutor_reviews (submission_id, review_status, updated_at desc);

create index if not exists tutor_reviews_tutor_updated_idx
on public.tutor_reviews (tutor_id, updated_at desc);

create index if not exists feedbacks_submission_status_updated_idx
on public.feedbacks (submission_id, status, updated_at desc);

create index if not exists feedbacks_tutor_review_idx
on public.feedbacks (tutor_review_id);

create index if not exists report_drafts_org_updated_idx
on public.report_drafts (organization_id, updated_at desc);

create index if not exists ai_logs_org_created_idx
on public.ai_logs (organization_id, created_at desc);
