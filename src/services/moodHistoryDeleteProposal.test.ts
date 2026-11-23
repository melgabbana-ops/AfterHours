import { describe, expect, it } from "vitest";
import proposal from "../../supabase/proposals/20261123_afterhours_session_mood_event_owner_delete.sql?raw";

const normalized = proposal.replace(/\\s+/g, " ").toLowerCase();

describe("private mood-history deletion proposal", () => {
  it("derives ownership only from the authenticated Supabase identity", () => {
    expect(normalized).toContain("v_user uuid := auth.uid()");
    expect(proposal).toMatch(/if v_user is null then[\\s\\S]*?errcode = '42501'/i);
    expect(proposal).toMatch(/delete from public\\.session_mood_events[\\s\\S]*?where mood_event\\.id = p_event_id[\\s\\S]*?and mood_event\\.profile_id = v_user/i);
  });

  it("returns only whether exactly one owned event was deleted", () => {
    expect(normalized).toContain("get diagnostics v_deleted = row_count");
    expect(normalized).toContain("return v_deleted = 1");
    expect(normalized).toContain("returns boolean");
  });

  it("grants the RPC only to authenticated users without table-wide delete access", () => {
    expect(normalized).toContain("revoke all on function public.delete_session_mood_event(uuid) from public, anon");
    expect(normalized).toContain("grant execute on function public.delete_session_mood_event(uuid) to authenticated");
    expect(proposal).not.toMatch(/grant\\s+(?:delete|all)\\s+on\\s+(?:table\\s+)?public\\.session_mood_events/i);
  });

  it("uses a fixed empty search path and rejects a missing event id", () => {
    expect(normalized).toContain("set search_path = ''");
    expect(proposal).toMatch(/if p_event_id is null then[\\s\\S]*?errcode = '22023'/i);
  });
});
