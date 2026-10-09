-- AFTER HOURS private media storage.
-- Object paths must begin with the authenticated user's UUID:
-- <auth.uid()>/<session-id>/<filename>
-- Keep the bucket private; use authenticated downloads or short-lived signed URLs.

begin;

insert into storage.buckets (id, name, public)
values ('after-hours-private-media', 'after-hours-private-media', false)
on conflict (id) do update set public = false;

drop policy if exists "after_hours_media_read_own" on storage.objects;
drop policy if exists "after_hours_media_insert_own" on storage.objects;
drop policy if exists "after_hours_media_update_own" on storage.objects;
drop policy if exists "after_hours_media_delete_own" on storage.objects;

create policy "after_hours_media_read_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'after-hours-private-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "after_hours_media_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'after-hours-private-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "after_hours_media_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'after-hours-private-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'after-hours-private-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "after_hours_media_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'after-hours-private-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
