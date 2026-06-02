create table if not exists public.report_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  student_name text not null,
  title text not null,
  body text not null,
  period_start date,
  period_end date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, student_name)
);

alter table public.report_drafts enable row level security;

create policy "report_drafts_staff_select_same_org"
on public.report_drafts for select
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "report_drafts_staff_insert_same_org"
on public.report_drafts for insert
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);

create policy "report_drafts_staff_update_same_org"
on public.report_drafts for update
using (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
)
with check (
  public.auth_user_is_staff()
  and organization_id = public.auth_user_organization_id()
);
