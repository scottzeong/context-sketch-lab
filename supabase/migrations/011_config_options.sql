create table if not exists public.config_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null check (
    category in ('age_range', 'difficulty_level', 'target_length', 'text_structure')
  ),
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, category, value)
);

alter table public.config_options enable row level security;

create policy "config_options_staff_select_same_org"
on public.config_options for select
using (
  public.auth_user_role() in ('admin', 'tutor')
  and organization_id = public.auth_user_organization_id()
);

create policy "config_options_admin_insert_same_org"
on public.config_options for insert
with check (
  public.auth_user_role() = 'admin'
  and organization_id = public.auth_user_organization_id()
);

create policy "config_options_admin_update_same_org"
on public.config_options for update
using (
  public.auth_user_role() = 'admin'
  and organization_id = public.auth_user_organization_id()
)
with check (
  public.auth_user_role() = 'admin'
  and organization_id = public.auth_user_organization_id()
);

create policy "config_options_admin_delete_same_org"
on public.config_options for delete
using (
  public.auth_user_role() = 'admin'
  and organization_id = public.auth_user_organization_id()
);

create index if not exists config_options_org_category_sort_idx
on public.config_options (organization_id, category, sort_order, label);

insert into public.config_options (
  organization_id,
  category,
  label,
  value,
  sort_order,
  created_by
)
select
  organizations.id,
  seed.category,
  seed.label,
  seed.value,
  seed.sort_order,
  null
from public.organizations
cross join (
  values
    ('age_range', '7-8세', 'AGE_7_8', 10),
    ('age_range', '9-10세', 'AGE_9_10', 20),
    ('age_range', '11-12세', 'AGE_11_12', 30),
    ('age_range', '13-15세', 'AGE_13_15', 40),
    ('age_range', '16-18세', 'AGE_16_18', 50),
    ('difficulty_level', 'L1 쉬움', 'L1', 10),
    ('difficulty_level', 'L2 기초', 'L2', 20),
    ('difficulty_level', 'L3 보통', 'L3', 30),
    ('difficulty_level', 'L4 중급', 'L4', 40),
    ('difficulty_level', 'L5 심화', 'L5', 50),
    ('target_length', '400자', '400자', 10),
    ('target_length', '600자', '600자', 20),
    ('target_length', '800자', '800자', 30),
    ('target_length', '1000자', '1000자', 40),
    ('text_structure', '이야기 구조', 'narrative', 10),
    ('text_structure', '원인-결과', 'cause_effect', 20),
    ('text_structure', '비교-대조', 'compare_contrast', 30),
    ('text_structure', '문제-해결', 'problem_solution', 40),
    ('text_structure', '주장-근거', 'claim_evidence', 50),
    ('text_structure', '순서/절차', 'sequence', 60),
    ('text_structure', '관점 전환', 'perspective_shift', 70)
) as seed(category, label, value, sort_order)
on conflict (organization_id, category, value) do nothing;
