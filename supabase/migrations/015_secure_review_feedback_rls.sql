drop policy if exists "tutor_reviews_select_same_org" on public.tutor_reviews;
drop policy if exists "tutor_reviews_parent_select_linked_student" on public.tutor_reviews;
drop policy if exists "tutor_reviews_staff_insert_same_org" on public.tutor_reviews;
drop policy if exists "tutor_reviews_staff_update_same_org" on public.tutor_reviews;

create policy "tutor_reviews_staff_select_same_org"
on public.tutor_reviews for select
using (
  public.auth_user_is_staff()
  and exists (
    select 1
    from public.submissions submission
    where submission.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
);

create policy "tutor_reviews_student_select_published_own"
on public.tutor_reviews for select
using (
  review_status = 'published'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = tutor_reviews.submission_id
      and submission.student_id = auth.uid()
      and submission.status = 'feedback_published'
      and public.auth_user_is_active()
  )
);

create policy "tutor_reviews_parent_select_published_linked_student"
on public.tutor_reviews for select
using (
  review_status = 'published'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = tutor_reviews.submission_id
      and submission.status = 'feedback_published'
      and submission.student_id is not null
      and public.auth_user_can_access_student(submission.student_id)
  )
);

create policy "tutor_reviews_tutor_insert_same_org"
on public.tutor_reviews for insert
with check (
  public.auth_user_role() = 'tutor'
  and tutor_id = auth.uid()
  and exists (
    select 1
    from public.submissions submission
    where submission.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
);

create policy "tutor_reviews_tutor_update_same_org"
on public.tutor_reviews for update
using (
  public.auth_user_role() = 'tutor'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
)
with check (
  public.auth_user_role() = 'tutor'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = tutor_reviews.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
);

drop policy if exists "feedbacks_select_same_org" on public.feedbacks;
drop policy if exists "feedbacks_parent_select_linked_student" on public.feedbacks;
drop policy if exists "feedbacks_staff_insert_same_org" on public.feedbacks;
drop policy if exists "feedbacks_staff_update_same_org" on public.feedbacks;

create policy "feedbacks_staff_select_same_org"
on public.feedbacks for select
using (
  public.auth_user_is_staff()
  and exists (
    select 1
    from public.submissions submission
    where submission.id = feedbacks.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
);

create policy "feedbacks_student_select_published_own"
on public.feedbacks for select
using (
  status = 'published'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = feedbacks.submission_id
      and submission.student_id = auth.uid()
      and submission.status = 'feedback_published'
      and public.auth_user_is_active()
  )
);

create policy "feedbacks_parent_select_published_linked_student"
on public.feedbacks for select
using (
  status = 'published'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = feedbacks.submission_id
      and submission.status = 'feedback_published'
      and submission.student_id is not null
      and public.auth_user_can_access_student(submission.student_id)
  )
);

create policy "feedbacks_tutor_insert_same_org"
on public.feedbacks for insert
with check (
  public.auth_user_role() = 'tutor'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = feedbacks.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
  and (
    tutor_review_id is null
    or exists (
      select 1
      from public.tutor_reviews review
      where review.id = feedbacks.tutor_review_id
        and review.submission_id = feedbacks.submission_id
    )
  )
);

create policy "feedbacks_tutor_update_same_org"
on public.feedbacks for update
using (
  public.auth_user_role() = 'tutor'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = feedbacks.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
)
with check (
  public.auth_user_role() = 'tutor'
  and exists (
    select 1
    from public.submissions submission
    where submission.id = feedbacks.submission_id
      and public.session_in_auth_org(submission.session_id)
  )
  and (
    tutor_review_id is null
    or exists (
      select 1
      from public.tutor_reviews review
      where review.id = feedbacks.tutor_review_id
        and review.submission_id = feedbacks.submission_id
    )
  )
);
