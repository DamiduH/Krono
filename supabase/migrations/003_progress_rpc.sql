-- Progress aggregation RPC for domain-level goals

-- Link projects to an imported course so watched time can roll up to domains
alter table public.projects
  add column if not exists course_id uuid references public.courses (id) on delete set null;

create index if not exists idx_projects_course_id on public.projects (course_id);

create or replace function public.get_domain_progress(user_uuid uuid)
returns table (
  domain_id uuid,
  domain_title text,
  target_hours integer,
  completed_task_count bigint,
  total_video_seconds bigint
)
language sql
stable
as $$
  select
    d.id,
    d.title,
    d.target_hours,
    coalesce(task_stats.cnt, 0),
    coalesce(video_stats.total, 0)
  from public.domains d
  left join lateral (
    select count(*) as cnt
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where p.domain_id = d.id
      and t.user_id = user_uuid
      and t.is_completed
  ) task_stats on true
  left join lateral (
    select sum(mp.seconds_watched) as total
    from public.module_progress mp
    join public.course_modules cm on cm.id = mp.module_id
    join public.projects p on p.course_id = cm.course_id
    where p.domain_id = d.id
      and mp.user_id = user_uuid
  ) video_stats on true
  where d.user_id = user_uuid;
$$;
