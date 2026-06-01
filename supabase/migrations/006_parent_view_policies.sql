create or replace function public.auth_user_can_access_student(student_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_student_links
    where parent_id = auth.uid()
      and student_id = student_profile_id
      and status = 'approved'
  );
$$;

create policy "parent_student_links_select_related"
on public.parent_student_links for select
using (
  parent_id = auth.uid()
  or student_id = auth.uid()
  or public.is_admin()
);

create policy "profiles_parent_select_linked_student"
on public.profiles for select
using (
  public.auth_user_can_access_student(id)
);

create policy "submissions_parent_select_linked_student"
on public.submissions for select
using (
  student_id is not null
  and public.auth_user_can_access_student(student_id)
);

create policy "submission_images_parent_select_linked_student"
on public.submission_images for select
using (
  exists (
    select 1
    from public.submissions
    where submissions.id = submission_images.submission_id
      and submissions.student_id is not null
      and public.auth_user_can_access_student(submissions.student_id)
  )
);

create policy "tutor_reviews_parent_select_linked_student"
on public.tutor_reviews for select
using (
  exists (
    select 1
    from public.submissions
    where submissions.id = tutor_reviews.submission_id
      and submissions.student_id is not null
      and public.auth_user_can_access_student(submissions.student_id)
  )
);

create policy "feedbacks_parent_select_linked_student"
on public.feedbacks for select
using (
  exists (
    select 1
    from public.submissions
    where submissions.id = feedbacks.submission_id
      and submissions.student_id is not null
      and public.auth_user_can_access_student(submissions.student_id)
  )
);
