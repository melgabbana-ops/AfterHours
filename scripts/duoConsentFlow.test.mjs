import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const duoService = readFileSync(
  fileURLToPath(new URL("../src/services/duoRooms.ts", import.meta.url)),
  "utf8",
);
const createScreen = readFileSync(
  fileURLToPath(new URL("../src/SecureDuoCreate.tsx", import.meta.url)),
  "utf8",
);
const invitationScreen = readFileSync(
  fileURLToPath(new URL("../src/SecureDuoInvitation.tsx", import.meta.url)),
  "utf8",
);
const couplesPlay = readFileSync(
  fileURLToPath(new URL("../src/CouplesPlay.tsx", import.meta.url)),
  "utf8",
);
const appEntry = readFileSync(
  fileURLToPath(new URL("../src/main.tsx", import.meta.url)),
  "utf8",
);
const lobbyScreen = readFileSync(
  fileURLToPath(new URL("../src/SecureDuoLobby.tsx", import.meta.url)),
  "utf8",
);

describe("secure Duo consent flow", () => {
  it("requires the host's explicit opt-in before creating an invitation", () => {
    expect(createScreen).toContain("if (!authenticated || !consent || creating) return;");
    expect(createScreen).toContain("checked={consent}");
    expect(createScreen).toContain("onChange={(event) => setConsent(event.currentTarget.checked)}");
    expect(createScreen).toContain("await setSecureDuoConsent(room.roomId, true)");
  });

  it("revokes a newly created room if the host's consent cannot be recorded", () => {
    const create = createScreen.slice(
      createScreen.indexOf("const createInvitation"),
      createScreen.indexOf("const copyLink"),
    );
    expect(create).toContain("await revokeSecureDuoInvitation(room.roomId)");
    expect(create).toContain("throw reason;");
  });

  it("accepts an invitation into the lobby without granting play consent", () => {
    const accept = invitationScreen.slice(
      invitationScreen.indexOf("const accept"),
      invitationScreen.indexOf("const expiryDate"),
    );
    expect(accept).toContain("await acceptSecureDuoInvitation(token)");
    expect(accept).toContain("onAccepted(roomId)");
    expect(accept).not.toContain("setSecureDuoConsent");
    expect(invitationScreen).toContain("It is not consent to play.");
  });

  it("keeps private Duo RPCs disabled until the backend rollout is verified", () => {
    expect(duoService).toContain("SECURE_DUO_BACKEND_ENABLED = false");
    expect(duoService).toContain("if (!SECURE_DUO_BACKEND_ENABLED) throw new Error");
    expect(couplesPlay).toContain("disabled={!SECURE_DUO_BACKEND_ENABLED}");
  });

  it("wires the secure invitation creator and lobby into the couple-play entry point", () => {
    expect(appEntry).toContain('import("./SecureDuoCreate")');
    expect(appEntry).toContain('import("./SecureDuoInvitation")');
    expect(appEntry).toContain('import("./SecureDuoLobby")');
    expect(appEntry).toContain("onCreated={(roomId)");
  });

  it("offers local aftercare choices without persisting intimate selections", () => {
    expect(couplesPlay).toContain('status === "stopped" && <section className="couples-lobby couples-aftercare"');
    expect(couplesPlay).toContain("Your choices stay on this device and are not saved.");
    expect(couplesPlay).toContain("setAftercareChoices");
  });

  it("keeps legacy public room-code realtime disabled", () => {
    expect(couplesPlay).toContain('const [mode, setMode] = useState<Mode>("local")');
    expect(couplesPlay).toContain("if (mode === \"remote\")");
    expect(couplesPlay).toContain("Only the account-bound private invitation flow");
    expect(couplesPlay).toContain("disabled aria-describedby=\"couples-remote-unavailable\"");
  });

  it("routes private invitation tokens from the URL fragment, not the query string", () => {
    expect(appEntry).toContain("window.location.hash.slice(1)");
    expect(appEntry).toContain('get("duo-invite")');
  });

  it("offers a handoff to the host lobby after the invitation link is shared", () => {
    expect(createScreen).toContain("onCreated?: (roomId: string) => void");
    expect(createScreen).toContain("onCreated(roomId)");
  });

  it("keeps participant consent as a separate action inside the secure lobby", () => {
    expect(lobbyScreen).toContain("setSecureDuoConsent(roomId, true)");
    expect(lobbyScreen).toContain("setSecureDuoConsent(roomId, false)");
    expect(lobbyScreen).toContain("const bothConsented = snapshot?.members.length === 2");
    expect(lobbyScreen).toContain("snapshot.members.every(member => member.consented)");
    expect(lobbyScreen).toContain("const canStart = isHost && bothConsented");
  });
});
