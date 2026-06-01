create policy "profiles_staff_select_same_org"
on public.profiles for select
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "learning_groups_select_same_org"
on public.learning_groups for select
using (organization_id = public.auth_user_organization_id());

create policy "learning_groups_staff_insert_same_org"
on public.learning_groups for insert
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "learning_groups_staff_update_same_org"
on public.learning_groups for update
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
)
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "learning_groups_staff_delete_same_org"
on public.learning_groups for delete
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "learning_group_members_select_same_org"
on public.learning_group_members for select
using (
  exists (
    select 1 from public.learning_groups
    where learning_groups.id = learning_group_members.learning_group_id
      and learning_groups.organization_id = public.auth_user_organization_id()
  )
);

create policy "learning_group_members_staff_insert_same_org"
on public.learning_group_members for insert
with check (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.learning_groups
    where learning_groups.id = learning_group_members.learning_group_id
      and learning_groups.organization_id = public.auth_user_organization_id()
  )
);

create policy "learning_group_members_staff_delete_same_org"
on public.learning_group_members for delete
using (
  public.auth_user_is_staff()
  and exists (
    select 1 from public.learning_groups
    where learning_groups.id = learning_group_members.learning_group_id
      and learning_groups.organization_id = public.auth_user_organization_id()
  )
);
