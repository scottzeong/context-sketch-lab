create policy "profiles_admin_select_same_org"
on public.profiles for select
using (
  public.is_admin()
  and organization_id = public.auth_user_organization_id()
);

create policy "profiles_admin_update_same_org"
on public.profiles for update
using (
  public.is_admin()
  and organization_id = public.auth_user_organization_id()
)
with check (
  public.is_admin()
  and organization_id = public.auth_user_organization_id()
);
