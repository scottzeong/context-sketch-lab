insert into storage.buckets (id, name, public)
values ('submission-images', 'submission-images', false)
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  org_id uuid;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'tutor');

  if requested_role not in ('admin', 'tutor', 'student', 'parent') then
    requested_role := 'tutor';
  end if;

  if new.raw_user_meta_data ? 'organization_id' then
    org_id := (new.raw_user_meta_data->>'organization_id')::uuid;
  end if;

  if org_id is null then
    insert into public.organizations (name, slug)
    values (
      coalesce(new.raw_user_meta_data->>'organization_name', 'Context Sketch Lab'),
      'context-sketch-' || replace(new.id::text, '-', '')
    )
    returning id into org_id;
  end if;

  insert into public.profiles (
    id,
    role,
    display_name,
    email,
    organization_id,
    age_range,
    reading_level
  )
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    new.email,
    org_id,
    new.raw_user_meta_data->>'age_range',
    new.raw_user_meta_data->>'reading_level'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.auth_user_is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role in ('admin', 'tutor')
  );
$$;

create or replace function public.session_in_auth_org(session_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_sessions
    where id = session_id
      and organization_id = public.auth_user_organization_id()
  );
$$;

create policy "texts_select_same_org"
on public.texts for select
using (organization_id = public.auth_user_organization_id());

create policy "texts_staff_insert_same_org"
on public.texts for insert
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "texts_staff_update_same_org"
on public.texts for update
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
)
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "texts_staff_delete_same_org"
on public.texts for delete
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "text_analyses_select_same_org"
on public.text_analyses for select
using (
  exists (
    select 1 from public.texts
    where texts.id = text_analyses.text_id
      and texts.organization_id = public.auth_user_organization_id()
  )
);

create policy "text_analyses_staff_insert_same_org"
on public.text_analyses for insert
with check (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.texts
    where texts.id = text_analyses.text_id
      and texts.organization_id = public.auth_user_organization_id()
  )
);

create policy "learning_sessions_select_same_org"
on public.learning_sessions for select
using (organization_id = public.auth_user_organization_id());

create policy "learning_sessions_staff_insert_same_org"
on public.learning_sessions for insert
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "learning_sessions_staff_update_same_org"
on public.learning_sessions for update
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
)
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "learning_sessions_staff_delete_same_org"
on public.learning_sessions for delete
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "submissions_select_same_org"
on public.submissions for select
using (
  student_id = auth.uid()
  or public.auth_user_is_staff()
  and public.session_in_auth_org(session_id)
);

create policy "submissions_student_insert_same_org"
on public.submissions for insert
with check (
  student_id = auth.uid()
  and public.session_in_auth_org(session_id)
);

create policy "submissions_update_owner_or_staff_same_org"
on public.submissions for update
using (
  (student_id = auth.uid() or public.auth_user_is_staff())
  and public.session_in_auth_org(session_id)
)
with check (
  (student_id = auth.uid() or public.auth_user_is_staff())
  and public.session_in_auth_org(session_id)
);

create policy "submission_images_select_same_org"
on public.submission_images for select
using (
  exists (
    select 1 from public.submissions
    where submissions.id = submission_images.submission_id
      and (
        submissions.student_id = auth.uid()
        or public.auth_user_is_staff()
      )
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "submission_images_insert_owner_same_org"
on public.submission_images for insert
with check (
  exists (
    select 1 from public.submissions
    where submissions.id = submission_images.submission_id
      and submissions.student_id = auth.uid()
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "tutor_reviews_select_same_org"
on public.tutor_reviews for select
using (
  exists (
    select 1 from public.submissions
    where submissions.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "tutor_reviews_staff_insert_same_org"
on public.tutor_reviews for insert
with check (
  public.auth_user_is_staff()
  and tutor_id = auth.uid()
  and exists (
    select 1 from public.submissions
    where submissions.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "tutor_reviews_staff_update_same_org"
on public.tutor_reviews for update
using (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.submissions
    where submissions.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
)
with check (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.submissions
    where submissions.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "feedbacks_select_same_org"
on public.feedbacks for select
using (
  exists (
    select 1 from public.submissions
    where submissions.id = feedbacks.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "feedbacks_staff_insert_same_org"
on public.feedbacks for insert
with check (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.submissions
    where submissions.id = feedbacks.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "feedbacks_staff_update_same_org"
on public.feedbacks for update
using (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.submissions
    where submissions.id = feedbacks.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
)
with check (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.submissions
    where submissions.id = feedbacks.submission_id
      and public.session_in_auth_org(submissions.session_id)
  )
);

create policy "submission_images_storage_read_authenticated"
on storage.objects for select
using (
  bucket_id = 'submission-images'
  and auth.role() = 'authenticated'
);

create policy "submission_images_storage_insert_authenticated"
on storage.objects for insert
with check (
  bucket_id = 'submission-images'
  and auth.role() = 'authenticated'
);
