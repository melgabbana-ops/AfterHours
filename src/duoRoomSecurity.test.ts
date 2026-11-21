import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/afterhours_secure_duo_rooms.sql", import.meta.url)),
  "utf8",
);
const client = readFileSync(
  fileURLToPath(new URL("./services/duoRooms.ts", import.meta.url)),
  "utf8",
);

describe("proposed secure Duo backend guardrails", () => {
  it("keeps room, member and invitation tables RLS-protected and denies direct client writes", () => {
    expect(proposal).toContain("alter table public.afterhours_duo_rooms enable row level security");
    expect(proposal).toContain("alter table public.afterhours_duo_room_members enable row level security");
    expect(proposal).toContain("alter table public.afterhours_duo_invitations enable row level security");
    expect(proposal).toContain("revoke all on public.afterhours_duo_rooms from public, anon, authenticated");
    expect(proposal).toContain("revoke all on public.afterhours_duo_room_members from public, anon, authenticated");
    expect(proposal).toContain("revoke all on public.afterhours_duo_invitations from public, anon, authenticated");
  });

  it("uses one-time hashed invitations and enforces a maximum of two accounts", () => {
    expect(proposal).toContain("token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$')");
    expect(proposal).toContain("for update");
    expect(proposal).toContain("if v_member_count <> 1 then");
    expect(proposal).toContain("status = 'accepted', accepted_user_id = v_user_id");
  });

  it("requires two currently consenting members before the host can activate a room", () => {
    expect(proposal).toContain("if v_room.owner_user_id <> v_user_id then");
    expect(proposal).toContain("if v_member_count <> 2 or v_consented_count <> 2 then");
    expect(proposal).toContain("set consent_revoked_at = clock_timestamp()");
    expect(proposal).toContain("if p_consent is null then");
  });


  it("uses only a private UUID topic and server RPCs in the proposed browser adapter", () => {
    expect(client).toContain('private: true');
    expect(client).toContain('`afterhours-duo:${requireRoomId(roomId)}`');
    expect(client).toContain('create_afterhours_duo_room');
    expect(client).toContain('preview_afterhours_duo_invitation');
    expect(client).toContain('accept_afterhours_duo_invitation');
    expect(client).toContain('set_afterhours_duo_consent');
    expect(client).toContain('set_afterhours_duo_room_state');
    expect(client).toContain('revoke_afterhours_duo_invitation');
  });

  it("authorizes both private Broadcast and Presence by authenticated room membership and exact topic", () => {
    expect(proposal).toContain("on realtime.messages for select to authenticated");
    expect(proposal).toContain("on realtime.messages for insert to authenticated");
    expect(proposal).toContain("extension in ('broadcast', 'presence')");
    expect(proposal).toContain("('afterhours-duo:' || m.room_id::text) = (select realtime.topic())");
    expect(proposal).toContain("m.user_id = (select auth.uid())");
    expect(proposal).toContain("r.status <> 'stopped' and r.expires_at > now()");
    expect(proposal.toLowerCase()).not.toContain("alter table realtime.messages enable row level security");
  });
});
