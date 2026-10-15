-- Allow approved private in-browser video/voice captures in the existing private media bucket.
-- Storage stays private, user-owned and capped at 20 MiB.
begin;

update storage.buckets
set public = false,
    file_size_limit = 20971520,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/gif','image/avif',
      'video/webm','video/mp4',
      'audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/x-wav',
      'audio/ogg','audio/webm','audio/flac'
    ]::text[]
where id = 'after-hours-private-media';

commit;
