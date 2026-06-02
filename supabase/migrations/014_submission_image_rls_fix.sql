create or replace function public.auth_user_can_submit_to_session(target_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_sessions session
    join public.profiles profile on profile.organization_id = session.organization_id
    where session.id = target_session_id
      and profile.id = auth.uid()
      and profile.role = 'student'
      and profile.account_status = 'active'
  );
$$;

create or replace function public.auth_user_can_write_submission_image(
  target_submission_id uuid,
  object_path text default null
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.submissions submission
    join public.learning_sessions session on session.id = submission.session_id
    join public.profiles profile on profile.id = submission.student_id
    where submission.id = target_submission_id
      and submission.student_id = auth.uid()
      and profile.account_status = 'active'
      and session.organization_id = profile.organization_id
      and (
        object_path is null
        or (
          (storage.foldername(object_path))[1] = session.organization_id::text
          and (storage.foldername(object_path))[2] = session.id::text
          and (storage.foldername(object_path))[3] = auth.uid()::text
          and (storage.foldername(object_path))[4] = submission.id::text
        )
      )
  );
$$;

drop policy if exists "submissions_student_insert_same_org" on public.submissions;
create policy "submissions_student_insert_same_org"
on public.submissions for insert
with check (
  student_id = auth.uid()
  and public.auth_user_can_submit_to_session(session_id)
);

drop policy if exists "submission_images_select_same_org" on public.submission_images;
create policy "submission_images_select_same_org"
on public.submission_images for select
using (
  exists (
    select 1
    from public.submissions submission
    where submission.id = submission_images.submission_id
      and public.session_in_auth_org(submission.session_id)
      and (
        (
          submission.student_id = auth.uid()
          and public.auth_user_is_active()
        )
        or public.auth_user_is_staff()
        or (
          submission.student_id is not null
          and public.auth_user_can_access_student(submission.student_id)
        )
      )
  )
);

drop policy if exists "submission_images_insert_owner_same_org" on public.submission_images;
create policy "submission_images_insert_owner_same_org"
on public.submission_images for insert
with check (
  public.auth_user_can_write_submission_image(submission_id, storage_path)
);

drop policy if exists "submission_images_storage_insert_owner_path" on storage.objects;
create policy "submission_images_storage_insert_owner_path"
on storage.objects for insert
with check (
  bucket_id = 'submission-images'
  and public.auth_user_is_active()
  and (storage.foldername(name))[1] = public.auth_user_organization_id()::text
  and (storage.foldername(name))[3] = auth.uid()::text
);

drop policy if exists "submission_images_storage_update_owner_path" on storage.objects;
create policy "submission_images_storage_update_owner_path"
on storage.objects for update
using (
  bucket_id = 'submission-images'
  and public.auth_user_is_active()
  and (storage.foldername(name))[1] = public.auth_user_organization_id()::text
  and (storage.foldername(name))[3] = auth.uid()::text
)
with check (
  bucket_id = 'submission-images'
  and public.auth_user_is_active()
  and (storage.foldername(name))[1] = public.auth_user_organization_id()::text
  and (storage.foldername(name))[3] = auth.uid()::text
);

drop policy if exists "submission_images_storage_read_authorized" on storage.objects;
create policy "submission_images_storage_read_authorized"
on storage.objects for select
using (
  bucket_id = 'submission-images'
  and (
    public.auth_user_can_read_submission_image_path(name)
    or (
      public.auth_user_is_active()
      and (storage.foldername(name))[1] = public.auth_user_organization_id()::text
      and (storage.foldername(name))[3] = auth.uid()::text
    )
    or (
      public.auth_user_is_staff()
      and (storage.foldername(name))[1] = public.auth_user_organization_id()::text
    )
  )
);
