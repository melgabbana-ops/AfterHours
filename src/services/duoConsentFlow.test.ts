import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const createScreen = readFileSync(
  fileURLToPath(new URL("../SecureDuoCreate.tsx", import.meta.url)),
  "utf8",
);
const invitationScreen = readFileSync(
  fileURLToPath(new URL("../SecureDuoInvitation.tsx", import.meta.url)),
  "utf8",
);
const lobbyScreen = readFileSync(
  fileURLToPath(new URL("../SecureDuoLobby.tsx", import.meta.url)),
  "utf8",
);

describe("secure Duo consent flow", () => {
  it("requires the host's explicit opt-in before creating an invitation", () => {
    expect(createScreen).toContain("if (!authenticated || !consent || creating) return;");
    expect(createScreen).toContain("checked={consent}");
    expect(createScreen).toContain("onChange={(event) => setConsent(event.target.checked)}");
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

  it("keeps participant consent as a separate action inside the secure lobby", () => {
    expect(lobbyScreen).toContain("setSecureDuoConsent(roomId, true)");
    expect(lobbyScreen).toContain("setSecureDuoConsent(roomId, false)");
    expect(lobbyScreen).toContain("const bothConsented = snapshot?.members.length === 2");
    expect(lobbyScreen).toContain("snapshot.members.every(member => member.consented)");
    expect(lobbyScreen).toContain("const canStart = isHost && bothConsented");
  });
});
