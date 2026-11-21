import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/proposals/20261121001230_afterhours_shared_run_checkins.sql", import.meta.url),
  "utf8"
);

describe("shared experience check-in migration", () => {
  it("restricts table access to authenticated users", () => {
    expect(migration).toMatch(/enable row level security/i);
    expect(migration).toMatch(/revoke all on public\.afterhours_experience_run_checkins from public, anon, authenticated/i);
    expect(migration).toMatch(/grant select, insert on public\.afterhours_experience_run_checkins to authenticated/i);
    expect(migration).toMatch(/grant update \(run_id, user_id, step_index, signal\) on public\.afterhours_experience_run_checkins to authenticated/i);
    expect(migration).toMatch(/create or replace function public\.afterhours_guard_run_checkin_identity\(\)[\s\S]*?new\.run_id is distinct from old\.run_id[\s\S]*?new\.user_id is distinct from old\.user_id[\s\S]*?new\.step_index is distinct from old\.step_index/i);
    expect(migration).toMatch(/create trigger afterhours_run_checkins_identity_guard[\s\S]*?before update on public\.afterhours_experience_run_checkins/i);
    expect(migration).toMatch(/revoke all on function public\.afterhours_guard_run_checkin_identity\(\) from public, anon, authenticated/i);
  });

  it("limits each experience to one accepted invitee plus its owner", () => {
    expect(migration).toMatch(/create unique index if not exists afterhours_invites_one_accepted_per_run[\s\S]*?on public\.afterhours_experience_invitations \(run_id\)[\s\S]*?where status = 'accepted' and accepted_user_id is not null/i);
  });

  it("allows reads only to the participant or the owner of the related run", () => {
    expect(migration).toMatch(/create policy afterhours_run_checkins_read_owner_or_participant[\s\S]*?for select to authenticated[\s\S]*?using \([\s\S]*?user_id = \(select auth\.uid\(\)\)[\s\S]*?or exists \([\s\S]*?r\.user_id = \(select auth\.uid\(\)\)/i);
  });

  it("limits inserts to the signed-in participant with active consent on the current step", () => {
    expect(migration).toMatch(/user_id = \(select auth\.uid\(\)\)/);
    expect(migration).toMatch(/c\.user_id = \(select auth\.uid\(\)\)/);
    expect(migration).toMatch(/c\.revoked_at is null/i);
    expect(migration).toMatch(/r\.status in \('active', 'paused'\)/i);
    expect(migration).toMatch(/r\.current_step = afterhours_experience_run_checkins\.step_index/i);
    expect(migration).toMatch(/r\.user_id <> \(select auth\.uid\(\)\)/i);
  });

  it("limits updates to the participant's own current-step row", () => {
    expect(migration).toMatch(/for update to authenticated/i);
    expect(migration).toMatch(/using \([\s\S]*?user_id = \(select auth\.uid\(\)\)[\s\S]*?r\.current_step = afterhours_experience_run_checkins\.step_index/i);
    expect(migration).toMatch(/with check \([\s\S]*?user_id = \(select auth\.uid\(\)\)[\s\S]*?r\.current_step = afterhours_experience_run_checkins\.step_index/i);
  });

  it("lets accepted participants see a paused run after consent was revoked", () => {
    expect(migration).toMatch(/private\.afterhours_is_accepted_run_participant/);
    expect(migration).toMatch(/status = 'paused'[\s\S]*?afterhours_is_accepted_run_participant/i);
    expect(migration).toMatch(/accepted_user_id = p_user_id[\s\S]*?status = 'accepted'/i);
  });

  it("renews consent only for the accepted invitee on a paused run", () => {
    expect(migration).toMatch(/private\.renew_afterhours_experience_consent_impl/);
    expect(migration).toMatch(/r\.status = 'paused'/i);
    expect(migration).toMatch(/i\.accepted_user_id = v_user_id/i);
    expect(migration).toMatch(/i\.status = 'accepted'/i);
    expect(migration).toMatch(/on conflict \(run_id, user_id\) do update[\s\S]*?revoked_at = null/i);
    expect(migration).toMatch(/public\.renew_afterhours_experience_consent[\s\S]*?security invoker/i);
    expect(migration).toMatch(/grant execute on function public\.renew_afterhours_experience_consent\(uuid\) to authenticated/i);
  });

  it("rejects invalid step indexes and unsupported signals", () => {
    expect(migration).toMatch(/step_index >= 0 and step_index < 40/i);
    expect(migration).toMatch(/signal in \('ready', 'pause_requested', 'stop_requested'\)/i);
    expect(migration).toMatch(/unique \(run_id, user_id, step_index\)/i);
  });
  it("keeps consent renewal behind an authenticated invoker wrapper", () => {
    expect(migration).toMatch(/create or replace function private\.renew_afterhours_experience_consent_impl\(p_run_id uuid\)[\s\S]*?security definer[\s\S]*?set search_path = ''/i);
    expect(migration).toMatch(/v_user_id uuid := auth\.uid\(\)/i);
    expect(migration).toMatch(/i\.inviter_user_id = r\.user_id[\s\S]*?i\.accepted_user_id = v_user_id[\s\S]*?i\.status = 'accepted'/i);
    expect(migration).toMatch(/revoke all on function private\.renew_afterhours_experience_consent_impl\(uuid\) from public, anon, authenticated/i);
    expect(migration).toMatch(/grant execute on function private\.renew_afterhours_experience_consent_impl\(uuid\) to authenticated/i);
    expect(migration).toMatch(/create or replace function public\.renew_afterhours_experience_consent\(p_run_id uuid\)[\s\S]*?security invoker[\s\S]*?select private\.renew_afterhours_experience_consent_impl\(p_run_id\)/i);
    expect(migration).toMatch(/revoke all on function public\.renew_afterhours_experience_consent\(uuid\) from public, anon/i);
  });
});
