import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/20261123_afterhours_experience_run_terminal_delete_guard.sql", import.meta.url)),
  "utf8",
);

describe("experience-run deletion safety proposal", () => {
  it("keeps deletion owner-scoped and limited to drafts or terminal runs", () => {
    expect(proposal).toMatch(/drop policy if exists afterhours_experience_runs_delete_own/i);
    expect(proposal).toMatch(/create policy afterhours_experience_runs_delete_own/i);
    expect(proposal).toMatch(/user_id = \(select auth\.uid\(\)\)/i);
    expect(proposal).toMatch(/status in \('ready', 'completed', 'stopped'\)/i);
    expect(proposal).not.toMatch(/status in \([^)]*'active'|status in \([^)]*'paused'/i);
  });

  it("does not add elevated grants or a privileged function", () => {
    expect(proposal.toLowerCase()).not.toContain("grant ");
    expect(proposal.toLowerCase()).not.toContain("security definer");
    expect(proposal.toLowerCase()).not.toContain("service_role");
  });
});
