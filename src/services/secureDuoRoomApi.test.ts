import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptSecureDuoInvitation, createSecureDuoRoom, previewSecureDuoInvitation,
  revokeSecureDuoInvitation, setSecureDuoConsent, setSecureDuoRoomState,\n  isSecureDuoLiveState, joinSecureDuoRealtime,
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


describe("private Duo Realtime transport",()=>{
  it("accepts only minimal state hints and rejects answer or media payloads",()=>{
    const valid={round:2,status:"paused",updatedAt:"2026-11-21T21:00:00.000Z"};
    expect(isSecureDuoLiveState(valid)).toBe(true);
    expect(isSecureDuoLiveState({...valid,answer:"private text"})).toBe(false);
    expect(isSecureDuoLiveState({...valid,round:99})).toBe(false);
    expect(isSecureDuoLiveState({...valid,updatedAt:"not-a-date"})).toBe(false);
  });

  it("joins the UUID-only private topic and authorizes state changes before broadcasting",async()=>{
    const channel:any={
      on:vi.fn().mockReturnThis(),
      subscribe:vi.fn((callback:any)=>{callback("SUBSCRIBED");return channel;}),
      track:vi.fn().mockResolvedValue("ok"),
      presenceState:vi.fn().mockReturnValue({[id]:[{online:true}]}),
      send:vi.fn().mockResolvedValue("ok"),
      untrack:vi.fn().mockResolvedValue("ok"),
    };
    const client=makeClient({
      channel:vi.fn().mockReturnValue(channel),
      removeChannel:vi.fn().mockResolvedValue("ok"),
      rpc:vi.fn().mockResolvedValue({data:{room_id:id,status:"active"},error:null}),
    });
    const connection=await joinSecureDuoRealtime(id,{},client);
    expect(client.channel).toHaveBeenCalledWith("afterhours-duo:"+id,expect.objectContaining({config:expect.objectContaining({private:true})}));
    await connection.setRoomState("active",1);
    expect(client.rpc).toHaveBeenCalledWith("set_afterhours_duo_room_state",{p_room_id:id,p_status:"active"});
    expect(channel.send).toHaveBeenCalledWith(expect.objectContaining({event:"duo-state",payload:expect.objectContaining({round:1,status:"active"})}));
    expect(connection.presence()).toEqual({[id]:[{online:true}]});
    await connection.leave();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });

  it("rejects invalid room ids before opening a Realtime channel",async()=>{
    const client=makeClient({channel:vi.fn()});
    await expect(joinSecureDuoRealtime("bad-id",{},client)).rejects.toThrow("ongeldig");
    expect(client.channel).not.toHaveBeenCalled();
  });
});
