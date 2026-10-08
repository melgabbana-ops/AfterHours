-- AFTER HOURS: allow renewed consent after a previous revocation.
-- The latest event is authoritative; repeated active requests remain idempotent.
create or replace function public.set_consent_state(
  p_session_id uuid,
  p_status text,
  p_confirmed_at timestamptz,
  p_revoked_at timestamptz
)
returns public.consent_records
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_session public.sessions%rowtype;
  v_result public.consent_records%rowtype;
  v_now timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
  if p_status not in ('active','revoked') then raise exception 'Ongeldige consentstatus.'; end if;
  select * into v_session
  from public.sessions
  where id=p_session_id and profile_id=auth.uid()
  for update;
  if not found then raise exception 'Sessie niet gevonden.'; end if;

  if p_status='active' then
    if p_confirmed_at is null or p_revoked_at is not null then
      raise exception 'Ongeldige actieve consent.';
    end if;

    select c.* into v_result
    from public.consent_records c
    where c.session_id=v_session.id
    order by c.created_at desc, c.id desc
    limit 1;

    if found and v_result.status='active' then return v_result; end if;

    insert into public.consent_records(session_id,status,confirmed_at)
    values(v_session.id,'active',v_now)
    returning * into v_result;
  else
    if p_revoked_at is null or p_confirmed_at is not null then
      raise exception 'Ongeldige ingetrokken consent.';
    end if;

    select c.* into v_result
    from public.consent_records c
    where c.session_id=v_session.id
    order by c.created_at desc, c.id desc
    limit 1;

    if found and v_result.status='revoked' then return v_result; end if;
    if not found or v_result.status <> 'active' then
      raise exception 'Actieve consent ontbreekt.';
    end if;

    insert into public.consent_records(session_id,status,revoked_at)
    values(v_session.id,'revoked',v_now)
    returning * into v_result;
  end if;

  return v_result;
end;
$func$;

revoke all on function public.set_consent_state(uuid,text,timestamptz,timestamptz) from public;
grant execute on function public.set_consent_state(uuid,text,timestamptz,timestamptz) to authenticated;
