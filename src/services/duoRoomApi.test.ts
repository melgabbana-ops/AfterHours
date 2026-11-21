import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptDuoInvitation,
  createDuoInvitation,
  previewDuoInvitation,
  revokeDuoInvitation
} from "./duoRoomApi";

const validId = "123e4567-e89b-42d3-a456-426614174000";
const validToken = "a".repeat(64);

function makeClient(overrides: Record<string, unknown> = {}) {
  const client: any = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: validId } }, error: null }) },
    from: vi.fn(),
    rpc: vi.fn(),
    ...overrides
  };
  return client;
}

describe("account-bound Duo invitation API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("requires a signed-in account before creating an invite", async () => {
    const client = makeClient({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) }
    });
    await expect(createDuoInvitation(validId, client)).rejects.toThrow("Log eerst in");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("requires the host's run to be paused before creating an invite", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { status: "active" }, error: null }) };
    const client = makeClient({ from: vi.fn().mockReturnValue(query) });
    await expect(createDuoInvitation(validId, client)).rejects.toThrow("Pauzeer de ervaring eerst");
    expect(client.from).toHaveBeenCalledWith("afterhours_experience_runs");
  });

  it("hashes invitation tokens before sending them to the preview RPC", async () => {
    const client = makeClient({
      rpc: vi.fn().mockResolvedValue({
        data: { run_id: validId, title: "Shared scene", description: "A scene", steps: [], expires_at: "2026-11-22T00:00:00Z" },
        error: null
      })
    });
    const result = await previewDuoInvitation(validToken, client);
    const [rpcName, args] = client.rpc.mock.calls[0];
    expect(rpcName).toBe("preview_afterhours_experience_invitation");
    expect(args.p_token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(args.p_token_hash).not.toBe(validToken);
    expect(result.runId).toBe(validId);
  });

  it("accepts only a server-confirmed invitation result", async () => {
    const client = makeClient({
      rpc: vi.fn().mockResolvedValue({
        data: { invitation_id: validId, run_id: validId, status: "accepted", accepted_at: "2026-11-22T00:00:00Z" },
        error: null
      })
    });
    await expect(acceptDuoInvitation(validToken, client)).resolves.toMatchObject({ status: "accepted", runId: validId });
    expect(client.rpc.mock.calls[0][0]).toBe("accept_afterhours_experience_invitation");
  });

  it("revokes only a pending invitation belonging to the signed-in account", async () => {
    const query = {
      update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: validId }, error: null })
    };
    const client = makeClient({ from: vi.fn().mockReturnValue(query) });
    await expect(revokeDuoInvitation(validId, client)).resolves.toBeUndefined();
    expect(client.from).toHaveBeenCalledWith("afterhours_experience_invitations");
    expect(query.eq).toHaveBeenCalledWith("inviter_user_id", validId);
    expect(query.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("rejects malformed invitation ids before any database call", async () => {
    const client = makeClient();
    await expect(revokeDuoInvitation("not-a-uuid", client)).rejects.toThrow("ongeldig");
    expect(client.from).not.toHaveBeenCalled();
  });
});
