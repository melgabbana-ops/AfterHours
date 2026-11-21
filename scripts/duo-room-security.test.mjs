import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/afterhours_secure_duo_rooms.sql", import.meta.url)),
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

  it("authorizes private Broadcast and Presence by authenticated room membership and exact topic", () => {
    expect(proposal).toContain("on realtime.messages for select to authenticated");
    expect(proposal).toContain("on realtime.messages for insert to authenticated");
    expect(proposal).toContain("extension in ('broadcast', 'presence')");
    expect(proposal).toContain("('afterhours-duo:' || m.room_id::text) = (select realtime.topic())");
    expect(proposal).toContain("m.user_id = (select auth.uid())");
    expect(proposal).toContain("r.status <> 'stopped' and r.expires_at > now()");
    expect(proposal.toLowerCase()).not.toContain("alter table realtime.messages enable row level security");
  });

  it("creates the host membership and stores only a hash for the one-time invitation", () => {
    const create = proposal.slice(proposal.indexOf("create or replace function public.create_afterhours_duo_room"), proposal.indexOf("create or replace function public.preview_afterhours_duo_invitation"));
    expect(create).toContain("auth.uid()");
    expect(create).toContain("insert into public.afterhours_duo_room_members");
    expect(create).toContain("values (v_room_id, v_user_id, 'host')");
    expect(create).toContain("p_invitation_token_hash");
    expect(create).not.toContain("p_invitation_token text");
  });

  it("locks both the invitation and room, rejects the host, and accepts only a single guest", () => {
    const accept = proposal.slice(proposal.indexOf("create or replace function public.accept_afterhours_duo_invitation"), proposal.indexOf("create or replace function public.set_afterhours_duo_consent"));
    expect(accept).toContain("where token_hash = p_token_hash");
    expect(accept).toContain("for update");
    expect(accept).toContain("where id = v_invitation.room_id");
    expect(accept).toContain("v_invitation.inviter_user_id = v_user_id");
    expect(accept).toContain("v_member_count <> 1");
    expect(accept).toContain("v_invitation.status <> 'pending'");
    expect(accept).toMatch(/values\s*\(\s*v_room\.id,\s*v_user_id,\s*'guest',\s*clock_timestamp\(\)\s*\)/);
    expect(accept).toContain("set status = 'accepted', accepted_user_id = v_user_id");
  });

  it("revokes both participants' consent when either person withdraws or the room stops", () => {
    const consent = proposal.slice(proposal.indexOf("create or replace function public.set_afterhours_duo_consent"), proposal.indexOf("create or replace function public.set_afterhours_duo_room_state"));
    const state = proposal.slice(proposal.indexOf("create or replace function public.set_afterhours_duo_room_state"), proposal.indexOf("create or replace function public.revoke_afterhours_duo_invitation"));
    expect(consent).toContain("set status = 'paused'");
    expect(consent).toContain("set consent_revoked_at = clock_timestamp()");
    expect(state).toContain("v_member_count <> 2 or v_consented_count <> 2");
    expect(state).toContain("v_room.owner_user_id <> v_user_id");
    expect(state).toContain("if p_status in ('paused', 'stopped') then");
    expect(state).toContain("set consent_revoked_at = clock_timestamp()");
  });

  it("does not authorize anonymous, non-member, expired, stopped, or unrelated-topic realtime access", () => {
    expect(proposal).not.toMatch(/create policy[\\s\\S]*?to anon/i);
    expect(proposal).toContain("to authenticated");
    expect(proposal).toContain("m.removed_at is null");
    expect(proposal).toContain("r.status <> 'stopped' and r.expires_at > now()");
    expect(proposal).toContain("('afterhours-duo:' || m.room_id::text) = (select realtime.topic())");
  });

});
