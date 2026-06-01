create policy "parent_student_links_admin_insert_same_org"
on public.parent_student_links for insert
with check (
  public.is_admin()
  and exists (
    select 1
    from public.profiles parent_profile
    join public.profiles student_profile
      on student_profile.id = parent_student_links.student_id
    where parent_profile.id = parent_student_links.parent_id
      and parent_profile.role = 'parent'
      and student_profile.role = 'student'
      and parent_profile.organization_id = public.auth_user_organization_id()
      and student_profile.organization_id = public.auth_user_organization_id()
  )
);

create policy "parent_student_links_admin_update_same_org"
on public.parent_student_links for update
using (
  public.is_admin()
  and exists (
    select 1
    from public.profiles parent_profile
    join public.profiles student_profile
      on student_profile.id = parent_student_links.student_id
    where parent_profile.id = parent_student_links.parent_id
      and parent_profile.organization_id = public.auth_user_organization_id()
      and student_profile.organization_id = public.auth_user_organization_id()
  )
)
with check (
  public.is_admin()
  and exists (
    select 1
    from public.profiles parent_profile
    join public.profiles student_profile
      on student_profile.id = parent_student_links.student_id
    where parent_profile.id = parent_student_links.parent_id
      and parent_profile.role = 'parent'
      and student_profile.role = 'student'
      and parent_profile.organization_id = public.auth_user_organization_id()
      and student_profile.organization_id = public.auth_user_organization_id()
  )
);
