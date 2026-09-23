-- Initial schema for the course learning tracker

create extension if not exists "pgcrypto";

-- Courses imported from external sources (e.g. YouTube playlists)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  source_type text not null default 'youtube',
  source_id text,
  total_modules integer not null default 0,
  total_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

-- Individual videos / modules within a course
create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  external_id text,
  title text not null,
  duration_seconds integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- Per-user progress on each module
create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id uuid not null references public.course_modules (id) on delete cascade,
  completed boolean not null default false,
  seconds_watched integer not null default 0,
  completed_at timestamptz
);

create index if not exists idx_courses_user_id on public.courses (user_id);
create index if not exists idx_course_modules_course_id on public.course_modules (course_id);
create index if not exists idx_module_progress_module_id on public.module_progress (module_id);
create index if not exists idx_module_progress_user_id on public.module_progress (user_id);
create unique index if not exists idx_module_progress_unique on public.module_progress (user_id, module_id);
