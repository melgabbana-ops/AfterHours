-- Only authenticated users may call session state/consent RPCs.
revoke all on function public.set_consent_state(uuid,text,timestamptz,timestamptz) from public, anon;
revoke all on function public.set_session_state(uuid,text,integer,timestamptz,timestamptz) from public, anon;
grant execute on function public.set_consent_state(uuid,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.set_session_state(uuid,text,integer,timestamptz,timestamptz) to authenticated;
