import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptSecureDuoInvitation, createSecureDuoRoom, previewSecureDuoInvitation,
  revokeSecureDuoInvitation, setSecureDuoConsent, setSecureDuoRoomState,
} from "./secureDuoRoomApi";

const id="123e4567-e89b-42d3-a456-426614174000";
const token="a".repeat(64);
function makeClient(overrides:Record<string,unknown>={}) {
  return {
    auth:{getUser:vi.fn().mockResolvedValue({data:{user:{id}},error:null})},
    rpc:vi.fn(),
    ...overrides,
  } as any;
}
describe("secure account-bound Duo room API",()=>{
  beforeEach(()=>vi.restoreAllMocks());

  it("requires login before any room RPC",async()=>{
    const client=makeClient({auth:{getUser:vi.fn().mockResolvedValue({data:{user:null},error:null})}});
    await expect(previewSecureDuoInvitation(token,client)).rejects.toThrow("Log eerst in");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("hashes the raw invitation token before previewing",async()=>{
    const client=makeClient({rpc:vi.fn().mockResolvedValue({data:{room_id:id,status:"lobby",expires_at:"2026-11-22T00:00:00Z"},error:null})});
    const preview=await previewSecureDuoInvitation(token,client);
    expect(client.rpc.mock.calls[0][0]).toBe("preview_afterhours_duo_invitation");
    expect(client.rpc.mock.calls[0][1].p_token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(client.rpc.mock.calls[0][1].p_token_hash).not.toBe(token);
    expect(preview).toMatchObject({roomId:id,status:"lobby"});
  });

  it("accepts only a server-confirmed account-bound membership",async()=>{
    const client=makeClient({rpc:vi.fn().mockResolvedValue({data:{room_id:id,status:"accepted"},error:null})});
    await expect(acceptSecureDuoInvitation(token,client)).resolves.toEqual({roomId:id,accepted:true});
    expect(client.rpc.mock.calls[0][0]).toBe("accept_afterhours_duo_invitation");
  });

  it("records the current user's explicit consent through the server",async()=>{
    const client=makeClient({rpc:vi.fn().mockResolvedValue({data:{room_id:id,consent:true,status:"lobby"},error:null})});
    await expect(setSecureDuoConsent(id,true,client)).resolves.toEqual({roomId:id,consent:true,status:"lobby"});
    expect(client.rpc.mock.calls[0]).toEqual(["set_afterhours_duo_consent",{p_room_id:id,p_consent:true}]);
  });

  it("lets the server, not the client, decide whether both accounts can activate",async()=>{
    const client=makeClient({rpc:vi.fn().mockResolvedValue({data:{room_id:id,status:"active"},error:null})});
    await expect(setSecureDuoRoomState(id,"active",client)).resolves.toEqual({roomId:id,status:"active"});
    expect(client.rpc.mock.calls[0]).toEqual(["set_afterhours_duo_room_state",{p_room_id:id,p_status:"active"}]);
  });

  it("rejects malformed room ids before RPC and revokes only through the host RPC",async()=>{
    const client=makeClient();
    await expect(revokeSecureDuoInvitation("bad-id",client)).rejects.toThrow("ongeldig");
    expect(client.rpc).not.toHaveBeenCalled();
    client.rpc.mockResolvedValue({data:{room_id:id,status:"stopped"},error:null});
    await expect(revokeSecureDuoInvitation(id,client)).resolves.toBeUndefined();
    expect(client.rpc.mock.calls[0][0]).toBe("revoke_afterhours_duo_invitation");
  });

  it("validates create-room responses and returns the raw token only once",async()=>{
    vi.stubGlobal("crypto",{
      getRandomValues:(bytes:Uint8Array)=>{bytes.fill(7);return bytes;},
      subtle:{digest:vi.fn().mockResolvedValue(new Uint8Array(32).buffer)},
    });
    const client=makeClient({rpc:vi.fn().mockResolvedValue({data:{room_id:id,expires_at:"2026-11-22T00:00:00Z"},error:null})});
    const room=await createSecureDuoRoom(client);
    expect(room.roomId).toBe(id);
    expect(room.token).toMatch(/^[a-f0-9]{64}$/);
    expect(client.rpc.mock.calls[0][0]).toBe("create_afterhours_duo_room");
    expect(client.rpc.mock.calls[0][1].p_invitation_token_hash).not.toBe(room.token);
    vi.unstubAllGlobals();
  });
});
