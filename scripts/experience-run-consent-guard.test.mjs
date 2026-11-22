import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/20261122_afterhours_experience_run_insert_consent_guard.sql", import.meta.url)),
  "utf8",
);

describe("experience run consent activation proposal", () => {
  it("rejects direct inserts that do not start as a ready draft at step zero", () => {
    expect(proposal).toMatch(/before insert on public\.afterhours_experience_runs/i);
    expect(proposal).toMatch(/new\.status is distinct from 'ready'/i);
    expect(proposal).toMatch(/and status = 'ready'/i);
    expect(proposal).toMatch(/and current_step = 0/i);
  });
  it("keeps the trigger function non-definer and locks its search path", () => {
    expect(proposal).not.toMatch(/security definer/i);
    expect(proposal).toMatch(/set search_path = ''/i);
    expect(proposal).toMatch(/revoke all on function private\./i);
  });
});
