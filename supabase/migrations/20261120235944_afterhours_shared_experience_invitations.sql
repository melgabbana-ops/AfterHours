-- AFTER HOURS: one-time invitations and account-bound participant consent.
begin;
create table if not exists public.afterhours_experience_invitations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.afterhours_experience_runs(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  accepted_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  check ((status = 'accepted') = (accepted_user_id is not null and accepted_at is not null))
);
create index if not exists afterhours_experience_invitations_owner on public.afterhours_experience_invitations (inviter_user_id, created_at desc);
create index if not exists afterhours_experience_invitations_run on public.afterhours_experience_invitations (run_id, status);
alter table public.afterhours_experience_invitations enable row level security;
revoke all on public.afterhours_experience_invitations from public, anon, authenticated;
grant select, insert, update, delete on public.afterhours_experience_invitations to authenticated;
create policy afterhours_experience_invitations_owner_select on public.afterhours_experience_invitations for select to authenticated using (inviter_user_id = (select auth.uid()));
create policy afterhours_experience_invitations_owner_insert on public.afterhours_experience_invitations for insert to authenticated with check (
  inviter_user_id = (select auth.uid()) and exists (
    select 1 from public.afterhours_experience_runs r where r.id = run_id and r.user_id = (select auth.uid())
  )
);
create policy afterhours_experience_invitations_owner_update on public.afterhours_experience_invitations for update to authenticated using (inviter_user_id = (select auth.uid())) with check (inviter_user_id = (select auth.uid()));
create policy afterhours_experience_invitations_owner_delete on public.afterhours_experience_invitations for delete to authenticated using (inviter_user_id = (select auth.uid()));

drop policy if exists afterhours_run_consents_select_own on public.afterhours_experience_run_consents;
create policy afterhours_run_consents_select_participant_or_owner on public.afterhours_experience_run_consents for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.afterhours_experience_runs r
    where r.id = afterhours_experience_run_consents.run_id and r.user_id = (select auth.uid())
  )
);
drop policy if exists afterhours_experience_runs_select_own on public.afterhours_experience_runs;
create policy afterhours_experience_runs_select_owner_or_consented on public.afterhours_experience_runs for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.afterhours_experience_run_consents c
    where c.run_id = afterhours_experience_runs.id and c.user_id = (select auth.uid()) and c.revoked_at is null
  )
);

create or replace function public.accept_afterhours_experience_invitation(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_experience_invitations%rowtype;
  v_run_status text;
begin
  if v_user_id is null then raise exception 'Sign in before accepting an invitation.' using errcode = '28000'; end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'This invitation link is invalid.' using errcode = '22023'; end if;
  select * into v_invitation from public.afterhours_experience_invitations where token_hash = p_token_hash for update;
  if not found then raise exception 'This invitation link is invalid or has expired.' using errcode = 'P0002'; end if;
  if v_invitation.inviter_user_id = v_user_id then raise exception 'You cannot accept your own invitation.' using errcode = '22023'; end if;
  if v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
    if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
      update public.afterhours_experience_invitations set status = 'expired' where id = v_invitation.id;
    end if;
    raise exception 'This invitation is no longer available.' using errcode = 'P0002';
  end if;
  select status into v_run_status from public.afterhours_experience_runs where id = v_invitation.run_id;
  if v_run_status not in ('active','paused') then raise exception 'This experience is no longer accepting participants.' using errcode = 'P0002'; end if;
  insert into public.afterhours_experience_run_consents (run_id, user_id, consent_version, consented_at, revoked_at)
  values (v_invitation.run_id, v_user_id, '1.0', now(), null)
  on conflict (run_id, user_id) do update set consent_version = excluded.consent_version, consented_at = excluded.consented_at, revoked_at = null;
  update public.afterhours_experience_invitations set status = 'accepted', accepted_user_id = v_user_id, accepted_at = now() where id = v_invitation.id;
  return jsonb_build_object('invitation_id', v_invitation.id, 'run_id', v_invitation.run_id, 'status', 'accepted', 'accepted_at', now());
end;
$$;
revoke all on function public.accept_afterhours_experience_invitation(text) from public, anon;
grant execute on function public.accept_afterhours_experience_invitation(text) to authenticated;
commit;
