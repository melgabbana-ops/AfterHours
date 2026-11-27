import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/20261123_afterhours_experience_run_terminal_delete_guard.sql", import.meta.url)),
  "utf8",
);
const baseMigration = readFileSync(
  fileURLToPath(new URL("../supabase/migrations/20261120234051_afterhours_world_modules.sql", import.meta.url)),
  "utf8",
);
const cinematicWorld = readFileSync(
  fileURLToPath(new URL("../src/CinematicWorld.tsx", import.meta.url)),
  "utf8",
);

describe("experience-run deletion safety proposal", () => {
  it("layers a restrictive owner-and-status guard over the original owner policy", () => {
    expect(baseMigration).toContain("create policy afterhours_experience_runs_delete_own");
    expect(baseMigration).toContain("for delete to authenticated using (user_id = (select auth.uid()))");
    expect(proposal).toContain("create policy afterhours_experience_runs_terminal_delete_guard");
    expect(proposal).toContain("as restrictive");
    expect(proposal).toContain("for delete");
    expect(proposal).toContain("to authenticated");
    expect(proposal).toContain("user_id = (select auth.uid())");
    expect(proposal).toContain("status in ('ready', 'completed', 'stopped')");
    expect(proposal).not.toContain("drop policy if exists afterhours_experience_runs_delete_own");
    expect(proposal).not.toMatch(/status in \([^)]*'active'|status in \([^)]*'paused'/i);
  });

  it("does not attempt to delete consent-visible runs owned by another account", () => {
    expect(cinematicWorld).toMatch(/if \(run\.user_id === remoteProfileId\) await deleteExperienceRun\(run\.id, remoteProfileId\)/);
  });

  it("does not add elevated grants or a privileged function", () => {
    expect(proposal.toLowerCase()).not.toContain("grant ");
    expect(proposal.toLowerCase()).not.toContain("security definer");
    expect(proposal.toLowerCase()).not.toContain("service_role");
  });
});
