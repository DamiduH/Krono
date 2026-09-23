-- Recency tracking for "continue learning": bump on every progress update
alter table public.module_progress
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_module_progress_updated_at
  on public.module_progress (user_id, updated_at desc);
