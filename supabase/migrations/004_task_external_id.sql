-- Stable external identity for synced (moodle) tasks so re-syncs update
-- instead of duplicating. NULL external_id (manual tasks) never collides.
alter table public.tasks
  add column if not exists external_id text;

create unique index if not exists tasks_user_source_external_uq
  on public.tasks (user_id, source, external_id);
