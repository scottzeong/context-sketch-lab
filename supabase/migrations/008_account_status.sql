alter table public.profiles
add column if not exists account_status text not null default 'active'
check (account_status in ('active', 'disabled'));

update public.profiles
set account_status = 'active'
where account_status is null;
