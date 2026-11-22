import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/20261123_afterhours_experience_run_insert_consent_guard.sql", import.meta.url)),
  "utf8",
);

describe("experience-run consent activation proposal", () => {
  it("rejects direct inserts unless they are ready drafts at step zero without a start time", () => {
    expect(proposal).toMatch(/before insert on public\.afterhours_experience_runs/i);
    expect(proposal).toMatch(/new\.status is distinct from 'ready'/i);
    expect(proposal).toMatch(/new\.current_step is distinct from 0/i);
    expect(proposal).toMatch(/new\.started_at is not null/i);
    expect(proposal).toMatch(/and status = 'ready'/i);
    expect(proposal).toMatch(/and current_step = 0/i);
    expect(proposal).toMatch(/and started_at is null/i);
  });

  it("keeps the trigger function locked down with an empty search path", () => {
    expect(proposal).toMatch(/security definer/i);
    expect(proposal).toMatch(/set search_path = ''/i);
    expect(proposal).toMatch(/revoke all on function private\.require_afterhours_experience_run_draft_on_insert\(\) from public, anon, authenticated/i);
  });
});
