-- Prevent any RPC session-state update from rewriting a completed session.
-- Completion and XP/history remain authoritative and immutable after completion.
begin;

create or replace function public.set_session_state(p_session_id uuid,p_status text,p_round integer,p_started_at timestamptz,p_updated_at timestamptz)
returns public.sessions language plpgsql security definer set search_path=public as $func$
declare v_session public.sessions%rowtype; v_result public.sessions%rowtype; v_active_seconds integer; v_consent_status text;
begin
 if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
 if p_status not in ('ready','active','paused','completed','stopped') then raise exception 'Ongeldige sessiestatus.'; end if;
 if p_round not between 0 and 2 then raise exception 'Ongeldige ronde.'; end if;
 if p_updated_at is null then raise exception 'Ontbrekende state-versie.'; end if;
 if p_updated_at > now()+interval '5 seconds' then raise exception 'Ongeldige toekomstige state-versie.'; end if;
 select * into v_session from public.sessions where id=p_session_id and profile_id=auth.uid() for update;
 if not found then raise exception 'Sessie niet gevonden.'; end if;
 if v_session.status='completed' then raise exception 'Een afgeronde sessie kan niet meer worden gewijzigd.'; end if;

 -- Consent must still be active even for a stale/retried activation request.
 if p_status='active' then
   select c.status into v_consent_status
   from public.consent_records c
   where c.session_id=v_session.id
   order by c.created_at desc, c.id desc
   limit 1;
   if v_consent_status is distinct from 'active' then
     raise exception 'Actieve consent vereist om een sessie te starten of te hervatten.';
   end if;
 end if;

 if p_updated_at <= v_session.updated_at then return v_session; end if;
 if p_status='completed' then raise exception 'Gebruik complete_session voor afronden.'; end if;
 if p_status='ready' and p_round<>0 then raise exception 'Ready vereist ronde 0.'; end if;
 if p_status='ready' and v_session.status='completed' then raise exception 'Een afgeronde sessie kan niet worden herstart.'; end if;
 v_active_seconds:=v_session.active_seconds;
 if v_session.status='active' and v_session.active_started_at is not null then
   v_active_seconds:=v_active_seconds+greatest(0,floor(extract(epoch from(now()-v_session.active_started_at)))::integer);
 end if;
 if p_status='active' then
   if p_round<>v_session.round then raise exception 'Ronde moet via de rondeflow worden gewijzigd.'; end if;
   if v_session.status not in ('ready','active','paused','stopped') then raise exception 'Ongeldige overgang naar actief.'; end if;
   if v_session.status in ('ready','stopped') then p_started_at:=now(); v_active_seconds:=0; else p_started_at:=v_session.started_at; end if;
 elsif p_status='paused' then
   if p_round=v_session.round then
     if v_session.status not in ('active','paused') then raise exception 'Pauzeren kan alleen vanuit een actieve sessie.'; end if;
   elsif v_session.status='paused' and p_round=v_session.round+1 then null;
   else raise exception 'Ongeldige overgang naar de volgende ronde.'; end if;
 elsif p_status='stopped' then
   if p_round<>v_session.round then raise exception 'Stoppen mag de ronde niet wijzigen.'; end if;
   p_started_at:=null;
 elsif p_status='ready' then
   p_started_at:=null; v_active_seconds:=0;
 end if;
 update public.sessions set status=p_status,round=p_round,started_at=p_started_at,active_seconds=v_active_seconds,
 active_started_at=case when p_status='active' then now() else null end,updated_at=now()
 where id=v_session.id returning * into v_result;
 return v_result;
end;$func$;
revoke all on function public.set_session_state(uuid,text,integer,timestamptz,timestamptz) from public;
grant execute on function public.set_session_state(uuid,text,integer,timestamptz,timestamptz) to authenticated;

commit;
