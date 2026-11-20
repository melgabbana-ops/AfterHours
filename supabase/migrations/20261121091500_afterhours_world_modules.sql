-- AFTER HOURS: private world modules and consent-audited experience runs.
-- Every record is scoped to auth.uid(); vault payloads are client-encrypted ciphertext.
begin;

create table if not exists public.afterhours_world_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('director','vault','dominion','sensory','invitation','ritual','club')),
  record_key text not null check (char_length(btrim(record_key)) between 1 and 120),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module, record_key)
);
create index if not exists afterhours_world_records_owner_module_updated on public.afterhours_world_records (user_id, module, updated_at desc);
alter table public.afterhours_world_records enable row level security;
revoke all on public.afterhours_world_records from public, anon, authenticated;
grant select, insert, update, delete on public.afterhours_world_records to authenticated;
create policy afterhours_world_records_select_own on public.afterhours_world_records for select to authenticated using (user_id = (select auth.uid()));
create policy afterhours_world_records_insert_own on public.afterhours_world_records for insert to authenticated with check (user_id = (select auth.uid()));
create policy afterhours_world_records_update_own on public.afterhours_world_records for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy afterhours_world_records_delete_own on public.afterhours_world_records for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.afterhours_experience_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scene_key text not null check (char_length(btrim(scene_key)) between 1 and 120),
  scene_snapshot jsonb not null check (jsonb_typeof(scene_snapshot) = 'object' and octet_length(scene_snapshot::text) <= 100000),
  status text not null default 'ready' check (status in ('ready','active','paused','completed','stopped')),
  current_step integer not null default 0 check (current_step >= 0),
  total_steps integer not null check (total_steps between 1 and 40),
  consent_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  check (current_step <= total_steps)
);
create index if not exists afterhours_experience_runs_owner_updated on public.afterhours_experience_runs (user_id, updated_at desc);
alter table public.afterhours_experience_runs enable row level security;
revoke all on public.afterhours_experience_runs from public, anon, authenticated;
grant select, insert, update, delete on public.afterhours_experience_runs to authenticated;
create policy afterhours_experience_runs_select_own on public.afterhours_experience_runs for select to authenticated using (user_id = (select auth.uid()));
create policy afterhours_experience_runs_insert_own on public.afterhours_experience_runs for insert to authenticated with check (user_id = (select auth.uid()));
create policy afterhours_experience_runs_update_own on public.afterhours_experience_runs for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy afterhours_experience_runs_delete_own on public.afterhours_experience_runs for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.afterhours_experience_run_consents (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.afterhours_experience_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_version text not null default '1.0',
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (run_id, user_id),
  check (revoked_at is null or revoked_at >= consented_at)
);
create index if not exists afterhours_run_consents_owner on public.afterhours_experience_run_consents (user_id, consented_at desc);
alter table public.afterhours_experience_run_consents enable row level security;
revoke all on public.afterhours_experience_run_consents from public, anon, authenticated;
grant select, insert, update on public.afterhours_experience_run_consents to authenticated;
create policy afterhours_run_consents_select_own on public.afterhours_experience_run_consents for select to authenticated using (
  user_id = (select auth.uid()) and exists (select 1 from public.afterhours_experience_runs r where r.id = afterhours_experience_run_consents.run_id and r.user_id = (select auth.uid()))
);
create policy afterhours_run_consents_insert_own on public.afterhours_experience_run_consents for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.afterhours_experience_runs r where r.id = afterhours_experience_run_consents.run_id and r.user_id = (select auth.uid()))
);
create policy afterhours_run_consents_update_own on public.afterhours_experience_run_consents for update to authenticated using (
  user_id = (select auth.uid()) and exists (select 1 from public.afterhours_experience_runs r where r.id = afterhours_experience_run_consents.run_id and r.user_id = (select auth.uid()))
) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.afterhours_experience_runs r where r.id = afterhours_experience_run_consents.run_id and r.user_id = (select auth.uid()))
);

commit;
