import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/afterhours_duo_two_member_cap.sql", import.meta.url)),
  "utf8",
);

describe("shared experience invitation capacity guard", () => {
  it("serializes acceptance against the parent run to prevent concurrent overbooking", () => {
    expect(proposal).toContain("from public.afterhours_experience_runs r");
    expect(proposal).toContain("for update");
    expect(proposal).toContain("v_active_member_count >= 2");
  });

  it("counts the host and all currently consenting accounts as the two permitted members", () => {
    expect(proposal).toContain("select c.user_id");
    expect(proposal).toContain("c.revoked_at is null");
    expect(proposal).toContain("union");
    expect(proposal).toContain("select v_host_user_id");
  });

  it("does not double-count an already-consenting invitee and keeps acceptance paused-only", () => {
    expect(proposal).toContain("if not v_already_member and v_active_member_count >= 2 then");
    expect(proposal).toContain("v_run_status <> 'paused'");
    expect(proposal).toContain("c.user_id = v_user_id");
  });

  it("keeps the acceptance RPC executable only by authenticated accounts", () => {
    expect(proposal).toContain("revoke all on function public.accept_afterhours_experience_invitation(text) from public, anon");
    expect(proposal).toContain("grant execute on function public.accept_afterhours_experience_invitation(text) to authenticated");
  });
});
