-- Persist the choices made inside an AFTER HOURS Experience Engine run.
alter table public.afterhours_experience_runs
  add column if not exists interaction_log jsonb not null default '[]'::jsonb
  check (jsonb_typeof(interaction_log) = 'array' and octet_length(interaction_log::text) <= 100000);
