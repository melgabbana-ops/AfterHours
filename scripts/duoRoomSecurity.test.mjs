import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const proposal = readFileSync(
  fileURLToPath(new URL("../supabase/proposals/afterhours_secure_duo_rooms.sql", import.meta.url)),
  "utf8",
);
const client = readFileSync(
  fileURLToPath(new URL("../src/services/duoRooms.ts", import.meta.url)),
  "utf8",
);
const couplesUi = readFileSync(
  fileURLToPath(new URL("../src/CouplesPlay.tsx", import.meta.url)),
  "utf8",
);
const invitationUi = readFileSync(
  fileURLToPath(new URL("../src/SecureDuoInvitation.tsx", import.meta.url)),
  "utf8",
);
const secureLobby = readFileSync(
  fileURLToPath(new URL("../src/SecureDuoLobby.tsx", import.meta.url)),
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

  it("explains in both languages that joining the lobby is not consent to play", () => {
    expect(invitationUi).toContain("Accepteren brengt je alleen naar de wachtkamer.");
    expect(invitationUi).toContain("It is not consent to play.");
    expect(invitationUi).toContain("You will give consent separately there");
  });

  it("does not treat invitation acceptance as consent to participate", () => {
    const acceptance = proposal.slice(
      proposal.indexOf("function public.accept_afterhours_duo_invitation("),
      proposal.indexOf("function public.set_afterhours_duo_consent("),
    );
    expect(acceptance).toContain("insert into public.afterhours_duo_room_members (room_id, user_id, role)");
    expect(acceptance).toContain("values (v_room.id, v_user_id, 'guest')");
    expect(acceptance).not.toContain("consented_at");
    expect(client).toContain("Accepting joins the lobby only");
    expect(client).not.toContain("explicit consent action in the invitation review screen");
  });

  it("uses a complete PL/pgSQL dollar-quoted body for the room snapshot RPC", () => {
    const declaration = proposal.slice(proposal.indexOf("function public.get_afterhours_duo_room_state("));
    expect(declaration.slice(0, declaration.indexOf("declare"))).toContain("as $$");
    expect(declaration).toContain("\nend;\n$$;");
  });
  it("uses balanced dollar-quote delimiters for every privileged Duo RPC", () => {
    const privilegedFunctions = [
      "create_afterhours_duo_room",
      "preview_afterhours_duo_invitation",
      "accept_afterhours_duo_invitation",
      "set_afterhours_duo_consent",
      "set_afterhours_duo_room_state",
      "revoke_afterhours_duo_invitation",
      "get_afterhours_duo_room_state",
      "advance_afterhours_duo_session",
    ];
    for (const name of privilegedFunctions) {
      const functionStart = "create or replace function public." + name + "(";
      const start = proposal.indexOf(functionStart);
      expect(start).toBeGreaterThanOrEqual(0);
      const next = proposal.indexOf("\ncreate or replace function public.", start + 1);
      const declaration = proposal.slice(start, next < 0 ? proposal.length : next);
      expect(declaration).toContain("as $$\ndeclare");
      expect(declaration).toContain("\nend;\n$$;");
      expect(declaration).not.toContain("\nend;\n$;");
    }
  });

  it("requires two currently consenting members before the host can activate a room", () => {
    expect(proposal).toContain("if v_room.owner_user_id <> v_user_id then");
    expect(proposal).toContain("if v_member_count <> 2 or v_consented_count <> 2 then");
    expect(proposal).toContain("set consent_revoked_at = clock_timestamp()");
    expect(proposal).toContain("if p_consent is null then");
  });



  it("closes the room snapshot SQL body and includes a non-persistent bilingual aftercare step", () => {
    const snapshot = proposal.slice(
      proposal.indexOf("function public.get_afterhours_duo_room_state("),
      proposal.indexOf("function public.revoke_afterhours_duo_invitation("),
    );
    expect(snapshot).toContain("\nend;\n$$;");
    expect(snapshot).not.toContain("\nend;\n$;");
    expect(couplesUi).toContain("couples-aftercare");
    expect(couplesUi).toContain("setAftercareChoices");
    expect(couplesUi).toContain("not saved");
    expect(couplesUi).toContain("niet opgeslagen");
    expect(couplesUi).toContain("Finish + aftercare");
  });

  it("keeps the legacy public room-code UI unavailable until the backend is verified", () => {
    expect(couplesUi).toContain("function secureDuoBackendAvailable(): boolean");
    expect(couplesUi).toContain("return false;");
    expect(couplesUi).toContain('disabled aria-describedby="couples-remote-unavailable"');
    expect(couplesUi).toContain('client.channel("couples-" + roomCode');
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
    expect(client).toContain('get_afterhours_duo_room_state');
  });

  it("returns only a member-scoped authoritative lobby snapshot", () => {
    const declaration = proposal.slice(proposal.indexOf("function public.get_afterhours_duo_room_state("));
    expect(declaration).toContain("m.user_id = v_user_id and m.removed_at is null");
    expect(declaration).toContain("'is_self', m.user_id = v_user_id");
    expect(declaration).toContain("'consented', m.consented_at is not null");
    expect(declaration).toContain("set search_path = ''");
    expect(declaration).toContain("revoke all on function public.get_afterhours_duo_room_state(uuid)");
    expect(declaration).toContain("grant execute on function public.get_afterhours_duo_room_state(uuid)");
  });;

  it("keeps every privileged RPC behind an authenticated SECURITY DEFINER boundary", () => {
    const privilegedFunctions = [
      "create_afterhours_duo_room",
      "preview_afterhours_duo_invitation",
      "accept_afterhours_duo_invitation",
      "set_afterhours_duo_consent",
      "set_afterhours_duo_room_state",
      "revoke_afterhours_duo_invitation",
      "get_afterhours_duo_room_state",
      "advance_afterhours_duo_session",
    ];
    for (const name of privilegedFunctions) {
      const declaration = proposal.slice(proposal.indexOf(`function public.${name}(`));
      expect(declaration.slice(0, declaration.indexOf("$;"))).toContain("security definer");
      expect(declaration.slice(0, declaration.indexOf("$;"))).toContain("set search_path = ''");
      expect(proposal).toContain(`revoke all on function public.${name}(`);
      expect(proposal).toContain(`grant execute on function public.${name}(`);
    }
  });

  it("makes pause, stop and consent withdrawal invalidate prior consent", () => {
    expect(proposal).toContain("set status = 'paused', updated_at = clock_timestamp()");
    expect(proposal).toContain("set status = p_status, updated_at = clock_timestamp()");
    expect(proposal).toContain("if p_status in ('paused', 'stopped') then");
    expect(proposal).toContain("set consent_revoked_at = clock_timestamp()");
    expect(proposal).toContain("where room_id = p_room_id and removed_at is null and consent_revoked_at is null");
  });

  it("serializes all lobby refresh triggers and prevents stale overlapping snapshots", () => {
    expect(secureLobby).toContain("const refreshInFlight = useRef(false)");
    expect(secureLobby).toContain("if (refreshInFlight.current || !mounted.current) return");
    expect(secureLobby).toContain("const interval = window.setInterval(() => void refresh(), 5000)");
    expect(secureLobby).not.toContain("let inFlight = false");
  });

  it("prevents rapid duplicate actions and guards the lobby's online state", () => {
    expect(secureLobby).toContain("const actionInFlight = useRef(false)");
    expect(secureLobby).toContain("if (actionInFlight.current || !isOnline) return");
    expect(secureLobby).toContain("actionInFlight.current = false");
    expect(secureLobby).toContain('typeof navigator === "undefined" || navigator.onLine');
  });

  it("blocks shared state mutations while the participant device is offline", () => {
    expect(secureLobby).toContain('window.addEventListener("offline", handleOffline)');
    expect(secureLobby).toContain('setIsOnline(false)');
    expect(secureLobby).toContain('disabled={busy || !isOnline');
    expect(secureLobby).toContain("Status vernieuwen");
    expect(secureLobby).toContain("Refresh status");
  });

  it("refreshes the secure room snapshot after reconnect and app resume", () => {
    expect(secureLobby).toContain('window.addEventListener("online", handleOnline)');
    expect(secureLobby).toContain('document.addEventListener("visibilitychange", handleVisibility)');
    expect(secureLobby).toContain('document.visibilityState === "visible"');
    expect(secureLobby).toContain("navigator.onLine");
    expect(secureLobby).toContain("displayed room status may be out of date");
  });

  it("keeps secure Duo aftercare per browser and out of persistent storage", () => {
    expect(secureLobby).toContain("aftercareChoices");
    expect(secureLobby).toContain("These choices stay in your browser and are not shared or saved.");
    expect(secureLobby).toContain("Dit lijstje blijft alleen in jouw browser en wordt niet gedeeld of opgeslagen.");
    expect(secureLobby).not.toContain("set_afterhours_duo_aftercare");
    expect(secureLobby).not.toContain("localStorage");
  });

  it("renders the server-backed shared prompt cursor in the dormant secure lobby", () => {
    expect(secureLobby).toContain("advanceSecureDuoSession");
    expect(secureLobby).toContain("snapshot.session.revision");
    expect(secureLobby).toContain("Gedeelde stap");
    expect(secureLobby).toContain("Shared step");
    expect(secureLobby).toContain("De server synchroniseert deze stap");
  });

  it("backfills a zeroed shared cursor for rooms that already exist", () => {
    expect(proposal).toContain("insert into public.afterhours_duo_session_state (room_id)");
    expect(proposal).toContain("select id from public.afterhours_duo_rooms");
    expect(proposal).toContain("on conflict (room_id) do nothing");
  });

  it("synchronizes only the finite shared prompt cursor with revision checks and active consent", () => {
    expect(proposal).toContain("create table if not exists public.afterhours_duo_session_state");
    expect(proposal).toContain("current_step between 0 and 4");
    expect(proposal).toContain("revision bigint not null default 0");
    expect(proposal).toContain("function public.advance_afterhours_duo_session(");
    expect(proposal).toContain("p_expected_revision bigint");
    expect(proposal).toContain("v_session.revision <> p_expected_revision");
    expect(proposal).toContain("v_room.status <> 'active'");
    expect(proposal).toContain("v_member_count <> 2 or v_consented_count <> 2");
    expect(proposal).toContain("'current_step', v_session.current_step");
    expect(proposal).toContain("'revision', v_session.revision");
    expect(proposal).toContain("revoke all on function public.advance_afterhours_duo_session(uuid, text, bigint)");
    expect(proposal).toContain("grant execute on function public.advance_afterhours_duo_session(uuid, text, bigint) to authenticated");
    expect(client).toContain('advance_afterhours_duo_session');
    expect(client).toContain('Number(session.current_step) > 4');
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
