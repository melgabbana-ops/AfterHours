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

  it("rejects invalid step indexes and unsupported signals", () => {
    expect(migration).toMatch(/step_index >= 0 and step_index < 40/i);
    expect(migration).toMatch(/signal in \('ready', 'pause_requested', 'stop_requested'\)/i);
    expect(migration).toMatch(/unique \(run_id, user_id, step_index\)/i);
  });
});
