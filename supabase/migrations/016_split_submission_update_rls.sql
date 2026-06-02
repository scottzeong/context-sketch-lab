drop policy if exists "submissions_update_owner_or_staff_same_org" on public.submissions;

create policy "submissions_student_update_own_submitted"
on public.submissions for update
using (
  student_id = auth.uid()
  and status = 'submitted'
  and public.auth_user_is_active()
  and public.auth_user_can_submit_to_session(session_id)
)
with check (
  student_id = auth.uid()
  and status = 'submitted'
  and public.auth_user_is_active()
  and public.auth_user_can_submit_to_session(session_id)
);

create policy "submissions_tutor_update_status_same_org"
on public.submissions for update
using (
  public.auth_user_role() = 'tutor'
  and public.session_in_auth_org(session_id)
)
with check (
  public.auth_user_role() = 'tutor'
  and public.session_in_auth_org(session_id)
);
