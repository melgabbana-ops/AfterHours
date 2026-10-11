-- AFTER HOURS: bilingual session-round content.
-- Apply once in the production Supabase SQL Editor after reviewing the change.
begin;

alter table public.experience_rounds
  add column if not exists title_nl text not null default '',
  add column if not exists body_nl text not null default '',
  add column if not exists title_en text not null default '',
  add column if not exists body_en text not null default '';

insert into public.experience_rounds
  (slug, title, body, title_nl, body_nl, title_en, body_en, duration_seconds, sort_order)
values
  ('eerste-stap',
   'De Eerste Stap',
   'Neem even de tijd. Spreek af wat vandaag welkom is, wat niet past en wat openblijft voor overleg.',
   'De Eerste Stap',
   'Neem even de tijd. Spreek af wat vandaag welkom is, wat niet past en wat openblijft voor overleg.',
   'The First Step',
   'Take a moment. Agree on what feels welcome today, what is off-limits, and what remains open for discussion.',
   1200, 1),
  ('richting',
   'De Richting',
   'Kies één opdracht binnen de afgesproken grenzen. Communiceer helder en geef ruimte om van richting te veranderen.',
   'De Richting',
   'Kies één opdracht binnen de afgesproken grenzen. Communiceer helder en geef ruimte om van richting te veranderen.',
   'Choose Your Direction',
   'Choose a prompt within the agreed boundaries. Communicate clearly and leave room to change direction.',
   1200, 2),
  ('verdieping',
   'De Verdieping',
   'Blijf aanwezig, check bij elkaar in en gebruik het afgesproken stopwoord als dat nodig is. Sluit af met aftercare.',
   'De Verdieping',
   'Blijf aanwezig, check bij elkaar in en gebruik het afgesproken stopwoord als dat nodig is. Sluit af met aftercare.',
   'Go Deeper, Stay Present',
   'Stay present, check in with each other, and use the agreed safeword when needed. Finish with aftercare.',
   1200, 3)
on conflict (slug) do update set
  title = excluded.title,
  body = excluded.body,
  title_nl = excluded.title_nl,
  body_nl = excluded.body_nl,
  title_en = excluded.title_en,
  body_en = excluded.body_en,
  duration_seconds = excluded.duration_seconds,
  sort_order = excluded.sort_order,
  active = true;

commit;
