import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptSecureDuoRoom, createSecureDuoRoom, previewSecureDuoRoom,
  revokeSecureDuoRoom, setSecureDuoConsent, setSecureDuoRoomState
} from "./duoSecureRoomApi";

const roomId = "123e4567-e89b-42d3-a456-426614174000";
const token = "a".repeat(64);
function client(overrides: Record<string, unknown> = {}) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: roomId } }, error: null }) },
    rpc: vi.fn(),
    ...overrides
  } as any;
}
describe("secure private Duo room RPC client", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("requires authentication before creating a room", async () => {
    const c = client({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } });
    await expect(createSecureDuoRoom(c)).rejects.toThrow("Log eerst in");
    expect(c.rpc).not.toHaveBeenCalled();
  });

  it("creates a room with only the hashed invitation token sent to the server", async () => {
    const c = client({ rpc: vi.fn().mockResolvedValue({ data: { room_id: roomId, expires_at: "2026-11-25T00:00:00Z" }, error: null }) });
    const result = await createSecureDuoRoom(c);
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(c.rpc).toHaveBeenCalledWith("create_afterhours_duo_room", { p_invitation_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(c.rpc.mock.calls[0][1].p_invitation_token_hash).not.toBe(result.token);
  });

  it("previews without accepting and sends only a token hash", async () => {
    const c = client({ rpc: vi.fn().mockResolvedValue({ data: { room_id: roomId, status: "lobby", expires_at: "2026-11-25T00:00:00Z" }, error: null }) });
    await expect(previewSecureDuoRoom(token, c)).resolves.toMatchObject({ roomId, status: "lobby" });
    expect(c.rpc).toHaveBeenCalledWith("preview_afterhours_duo_invitation", { p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
  });

  it("accepts only a server-confirmed guest membership", async () => {
    const c = client({ rpc: vi.fn().mockResolvedValue({ data: { room_id: roomId, status: "accepted" }, error: null }) });
    await expect(acceptSecureDuoRoom(token, c)).resolves.toEqual({ roomId, status: "accepted" });
    expect(c.rpc).toHaveBeenCalledWith("accept_afterhours_duo_invitation", { p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
  });

  it("validates room IDs before calling consent, state or revoke RPCs", async () => {
    const c = client();
    await expect(setSecureDuoConsent("bad-id", true, c)).rejects.toThrow("ongeldig");
    await expect(setSecureDuoRoomState("bad-id", "active", c)).rejects.toThrow("ongeldig");
    await expect(revokeSecureDuoRoom("bad-id", c)).rejects.toThrow("ongeldig");
    expect(c.rpc).not.toHaveBeenCalled();
  });

  it("sends explicit per-member consent and host state changes to separate RPCs", async () => {
    const c = client({ rpc: vi.fn().mockResolvedValue({ data: {}, error: null }) });
    await setSecureDuoConsent(roomId, false, c);
    await setSecureDuoRoomState(roomId, "active", c);
    await revokeSecureDuoRoom(roomId, c);
    expect(c.rpc).toHaveBeenNthCalledWith(1, "set_afterhours_duo_consent", { p_room_id: roomId, p_consent: false });
    expect(c.rpc).toHaveBeenNthCalledWith(2, "set_afterhours_duo_room_state", { p_room_id: roomId, p_status: "active" });
    expect(c.rpc).toHaveBeenNthCalledWith(3, "revoke_afterhours_duo_invitation", { p_room_id: roomId });
  });

  it("rejects a server response that does not contain a valid room", async () => {
    const c = client({ rpc: vi.fn().mockResolvedValue({ data: { room_id: "not-a-uuid", status: "accepted" }, error: null }) });
    await expect(acceptSecureDuoRoom(token, c)).rejects.toThrow("geldige bevestiging");
  });
});
