-- OS-style academic & professional tracker schema

-- Master domains (e.g. Fintech & ML)
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  target_hours integer not null default 0,
  deadline timestamptz,
  created_at timestamptz not null default now()
);

-- Projects belonging to a domain
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  domain_id uuid not null references public.domains (id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);

-- Tasks belonging to a project, optionally linked to a course module or external source
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  due_date timestamptz,
  notion_url text,
  linked_video_id uuid references public.course_modules (id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'moodle'))
);

-- Recurring daily habits (is_negative = habit to avoid, e.g. doomscrolling)
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  is_negative boolean not null default false,
  target_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

-- Per-day logs: habit completions or free-form focus sessions
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  habit_id uuid references public.habits (id) on delete cascade,
  type text not null check (type in ('habit', 'focus')),
  minutes_logged integer not null default 0,
  date date not null default current_date
);

create index if not exists idx_domains_user_id on public.domains (user_id);
create index if not exists idx_projects_domain_id on public.projects (domain_id);
create index if not exists idx_tasks_project_id on public.tasks (project_id);
create index if not exists idx_tasks_linked_video_id on public.tasks (linked_video_id);
create index if not exists idx_habits_user_id on public.habits (user_id);
create index if not exists idx_daily_logs_user_date on public.daily_logs (user_id, date);
create index if not exists idx_daily_logs_habit_id on public.daily_logs (habit_id);

-- ---------------------------------------------------------------------------
-- Mock data (mock user id matches lib/mock-user.ts). Safe to re-run.
-- ---------------------------------------------------------------------------

insert into public.domains (user_id, title, target_hours, deadline)
select
  '00000000-0000-0000-0000-000000000001',
  'Fintech & ML',
  300,
  now() + interval '90 days'
where not exists (
  select 1 from public.domains
  where user_id = '00000000-0000-0000-0000-000000000001' and title = 'Fintech & ML'
);

insert into public.projects (user_id, domain_id, title, status)
select
  '00000000-0000-0000-0000-000000000001',
  d.id,
  'System Dev',
  'active'
from public.domains d
where d.user_id = '00000000-0000-0000-0000-000000000001'
  and d.title = 'Fintech & ML'
  and not exists (
    select 1 from public.projects p
    where p.user_id = '00000000-0000-0000-0000-000000000001' and p.title = 'System Dev'
  );

insert into public.habits (user_id, title, is_negative, target_minutes)
select
  '00000000-0000-0000-0000-000000000001',
  'Mandatory GitHub Hour',
  false,
  60
where not exists (
  select 1 from public.habits
  where user_id = '00000000-0000-0000-0000-000000000001' and title = 'Mandatory GitHub Hour'
);
