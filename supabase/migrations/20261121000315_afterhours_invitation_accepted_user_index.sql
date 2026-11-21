-- AFTER HOURS: index the accepted participant foreign key for efficient account deletion and lookups.
create index if not exists afterhours_experience_invitations_accepted_user
on public.afterhours_experience_invitations (accepted_user_id)
where accepted_user_id is not null;
