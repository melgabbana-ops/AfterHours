-- Preserve the existing public-active and admin-read access while evaluating one SELECT policy.
create policy experience_rounds_read
  on public.experience_rounds
  for select to authenticated
  using (active = true or public.is_app_admin());

drop policy if exists experience_rounds_admin_read on public.experience_rounds;
drop policy if exists rounds_public_read on public.experience_rounds;
