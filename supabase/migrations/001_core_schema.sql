create extension if not exists "pgcrypto";

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'tutor', 'student', 'parent')),
  display_name text,
  email text,
  organization_id uuid references public.organizations(id) on delete set null,
  birth_date date,
  age_range text check (
    age_range in ('AGE_7_8', 'AGE_9_10', 'AGE_11_12', 'AGE_13_15', 'AGE_16_18', 'ADULT')
    or age_range is null
  ),
  reading_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  age_range text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_group_members (
  id uuid primary key default gen_random_uuid(),
  learning_group_id uuid not null references public.learning_groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('tutor', 'student')),
  created_at timestamptz not null default now(),
  unique (learning_group_id, profile_id)
);

create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  relationship text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.learning_groups enable row level security;
alter table public.learning_group_members enable row level security;
alter table public.parent_student_links enable row level security;

create or replace function public.auth_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_user_organization_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_self_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "organizations_select_same_org"
on public.organizations for select
using (id = public.auth_user_organization_id() or public.is_admin());
