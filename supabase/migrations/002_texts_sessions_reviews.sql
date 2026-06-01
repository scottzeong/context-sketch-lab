create table public.texts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  source_type text not null check (source_type in ('ai_generated', 'tutor_written', 'imported')),
  age_range text,
  difficulty_level text,
  text_type text,
  structure_type text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.text_analyses (
  id uuid primary key default gen_random_uuid(),
  text_id uuid not null references public.texts(id) on delete cascade,
  analysis_json jsonb not null,
  structure_type text,
  learning_goal text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.worksheet_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  template_type text not null,
  description text,
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learning_group_id uuid references public.learning_groups(id) on delete set null,
  group_name text,
  text_id uuid references public.texts(id) on delete set null,
  text_analysis_id uuid references public.text_analyses(id) on delete set null,
  title text not null,
  learning_goal text,
  worksheet_template_id uuid references public.worksheet_templates(id) on delete set null,
  worksheet_template text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  scheduled_for date,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete set null,
  student_name text,
  student_explanation text,
  important_connection text,
  difficult_part text,
  status text not null default 'submitted' check (
    status in ('submitted', 'under_review', 'feedback_published')
  ),
  submitted_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submission_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  storage_path text not null,
  image_kind text not null default 'original' check (image_kind in ('original', 'revision')),
  created_at timestamptz not null default now()
);

create table public.tutor_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  observation text,
  key_connections text[] not null default '{}',
  strengths text[] not null default '{}',
  misconceptions text[] not null default '{}',
  next_step text,
  review_status text not null default 'draft' check (review_status in ('draft', 'ai_drafted', 'approved', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  tutor_review_id uuid references public.tutor_reviews(id) on delete set null,
  student_facing text,
  tutor_notes text,
  parent_summary text,
  ai_draft_json jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  agent_name text not null,
  model_name text not null,
  input_json jsonb,
  output_json jsonb,
  status text not null,
  error_message text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  estimated_cost_usd numeric(12, 6),
  latency_ms integer,
  request_id text,
  created_at timestamptz not null default now()
);

alter table public.texts enable row level security;
alter table public.text_analyses enable row level security;
alter table public.worksheet_templates enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_images enable row level security;
alter table public.tutor_reviews enable row level security;
alter table public.feedbacks enable row level security;
alter table public.ai_logs enable row level security;
