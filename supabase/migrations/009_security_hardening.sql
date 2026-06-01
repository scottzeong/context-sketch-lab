create or replace function public.auth_user_is_active()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'active'
  );
$$;

create or replace function public.auth_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and account_status = 'active';
$$;

create or replace function public.auth_user_organization_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
    and account_status = 'active';
$$;

create or replace function public.auth_user_account_status()
returns text
language sql
security definer
set search_path = public
as $$
  select account_status from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and account_status = 'active'
  );
$$;

create or replace function public.auth_user_is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'tutor')
      and account_status = 'active'
  );
$$;

create or replace function public.auth_user_can_access_student(student_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_student_links link
    join public.profiles parent_profile on parent_profile.id = link.parent_id
    join public.profiles student_profile on student_profile.id = link.student_id
    where link.parent_id = auth.uid()
      and link.student_id = student_profile_id
      and link.status = 'approved'
      and parent_profile.account_status = 'active'
      and student_profile.account_status = 'active'
  );
$$;

drop policy if exists "parent_student_links_select_related" on public.parent_student_links;
create policy "parent_student_links_select_related"
on public.parent_student_links for select
using (
  (
    parent_id = auth.uid()
    and public.auth_user_is_active()
  )
  or (
    student_id = auth.uid()
    and public.auth_user_is_active()
  )
  or public.is_admin()
);

drop policy if exists "profiles_update_self" on public.profiles;

create policy "profiles_update_self_safe_fields"
on public.profiles for update
using (
  id = auth.uid()
  and public.auth_user_is_active()
)
with check (
  id = auth.uid()
  and role = public.auth_user_role()
  and organization_id = public.auth_user_organization_id()
  and account_status = public.auth_user_account_status()
);

drop policy if exists "submissions_select_same_org" on public.submissions;
create policy "submissions_select_same_org"
on public.submissions for select
using (
  (
    student_id = auth.uid()
    and public.auth_user_is_active()
  )
  or (
    public.auth_user_is_staff()
    and public.session_in_auth_org(session_id)
  )
);

drop policy if exists "submissions_student_insert_same_org" on public.submissions;
create policy "submissions_student_insert_same_org"
on public.submissions for insert
with check (
  student_id = auth.uid()
  and public.auth_user_is_active()
  and public.session_in_auth_org(session_id)
);

drop policy if exists "submissions_update_owner_or_staff_same_org" on public.submissions;
create policy "submissions_update_owner_or_staff_same_org"
on public.submissions for update
using (
  (
    student_id = auth.uid()
    and public.auth_user_is_active()
  )
  or public.auth_user_is_staff()
  and public.session_in_auth_org(session_id)
)
with check (
  (
    student_id = auth.uid()
    and public.auth_user_is_active()
  )
  or public.auth_user_is_staff()
  and public.session_in_auth_org(session_id)
);

drop policy if exists "submission_images_select_same_org" on public.submission_images;
create policy "submission_images_select_same_org"
on public.submission_images for select
using (
  exists (
    select 1
    from public.submissions
    where submissions.id = submission_images.submission_id
      and (
        submissions.student_id = auth.uid()
        and public.auth_user_is_active()
        or public.auth_user_is_staff()
      )
      and public.session_in_auth_org(submissions.session_id)
  )
);

drop policy if exists "submission_images_insert_owner_same_org" on public.submission_images;
create policy "submission_images_insert_owner_same_org"
on public.submission_images for insert
with check (
  exists (
    select 1
    from public.submissions
    where submissions.id = submission_images.submission_id
      and submissions.student_id = auth.uid()
      and public.auth_user_is_active()
      and public.session_in_auth_org(submissions.session_id)
  )
);

create or replace function public.auth_user_can_read_submission_image_path(object_path text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.submission_images image
    join public.submissions submission on submission.id = image.submission_id
    join public.learning_sessions session on session.id = submission.session_id
    where image.storage_path = object_path
      and (
        (
          submission.student_id = auth.uid()
          and public.auth_user_is_active()
        )
        or (
          public.auth_user_is_staff()
          and session.organization_id = public.auth_user_organization_id()
        )
        or (
          submission.student_id is not null
          and public.auth_user_can_access_student(submission.student_id)
        )
      )
  );
$$;

drop policy if exists "submission_images_storage_read_authenticated" on storage.objects;
create policy "submission_images_storage_read_authorized"
on storage.objects for select
using (
  bucket_id = 'submission-images'
  and public.auth_user_can_read_submission_image_path(name)
);

drop policy if exists "submission_images_storage_insert_authenticated" on storage.objects;
create policy "submission_images_storage_insert_owner_path"
on storage.objects for insert
with check (
  bucket_id = 'submission-images'
  and public.auth_user_is_active()
  and (storage.foldername(name))[1] = public.auth_user_organization_id()::text
  and (storage.foldername(name))[3] = auth.uid()::text
);
