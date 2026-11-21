import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  in: vi.fn(),
  is: vi.fn(),
  rpc: vi.fn(),
  upsert: vi.fn(),
  single: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from, rpc: mocks.rpc },
}));

import { loadExperienceRunCheckIns, loadExperienceRuns, loadOwnExperienceRunConsentIds, loadWorldRecords, renewExperienceRunConsent, saveWorldRecord, submitExperienceRunCheckIn } from "./worldRecords";

const chain = {
  select: mocks.select,
  eq: mocks.eq,
  order: mocks.order,
  limit: mocks.limit,
  in: mocks.in,
  is: mocks.is,
  upsert: mocks.upsert,
  single: mocks.single,
};

describe("AFTER HOURS private world storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-a" } }, error: null });
    mocks.from.mockReturnValue(chain);
    mocks.select.mockReturnValue(chain);
    mocks.eq.mockReturnValue(chain);
    mocks.order.mockReturnValue(chain);
    mocks.in.mockReturnValue(chain);
    mocks.is.mockReturnValue(chain);
    mocks.upsert.mockReturnValue(chain);
  });

  it("refuses to read another account's records before making a database query", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-b" } }, error: null });

    await expect(loadWorldRecords("director", "user-a"))
      .rejects.toThrow("The signed-in account changed.");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("scopes private record reads to the verified user and selected module", async () => {
    const rows = [{ id: "record-1", record_key: "scene:1", payload: { title: "My scene" }, created_at: "2026-11-21T00:00:00Z", updated_at: "2026-11-21T00:00:00Z" }];
    mocks.limit.mockResolvedValue({ data: rows, error: null });

    await expect(loadWorldRecords("director", "user-a")).resolves.toEqual(rows);
    expect(mocks.from).toHaveBeenCalledWith("afterhours_world_records");
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "user_id", "user-a");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "module", "director");
  });

  it("loads only runs permitted by consent-based RLS without hiding shared participant runs", async () => {
    const rows = [{
      id: "run-1",
      user_id: "host-user",
      scene_key: "builtin:trust-protocol",
      scene_snapshot: { title: "Shared scene", steps: ["Check in"] },
      status: "paused",
      current_step: 0,
      total_steps: 1,
      created_at: "2026-11-21T00:00:00Z",
      updated_at: "2026-11-21T00:00:00Z",
      started_at: "2026-11-21T00:00:00Z",
      completed_at: null,
      interaction_log: []
    }];
    mocks.limit.mockResolvedValue({ data: rows, error: null });

    await expect(loadExperienceRuns("user-a")).resolves.toEqual(rows);
    expect(mocks.from).toHaveBeenCalledWith("afterhours_experience_runs");
    expect(mocks.select).toHaveBeenCalledWith("id,user_id,scene_key,scene_snapshot,status,current_step,total_steps,created_at,updated_at,started_at,completed_at,interaction_log");
    expect(mocks.eq).not.toHaveBeenCalled();
  });

  it("upserts records only after verifying the same authenticated account", async () => {
    const row = { id: "record-1", record_key: "profile", payload: { role: "Explorer" }, created_at: "2026-11-21T00:00:00Z", updated_at: "2026-11-21T00:00:00Z" };
    mocks.single.mockResolvedValue({ data: row, error: null });

    await expect(saveWorldRecord("dominion", "profile", { role: "Explorer" }, "user-a")).resolves.toEqual(row);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-a", module: "dominion", record_key: "profile" }),
      { onConflict: "user_id,module,record_key" }
    );
  });

  it("does not write if authentication cannot be verified", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Auth unavailable" } });

    await expect(saveWorldRecord("vault", "vault:1", { ciphertext: "only-ciphertext" }, "user-a"))
      .rejects.toThrow("Auth unavailable");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns an empty check-in list without querying Supabase when there are no runs", async () => {
    await expect(loadExperienceRunCheckIns([], "user-a")).resolves.toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("refuses to load check-ins when the authenticated account changed", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-b" } }, error: null });
    await expect(loadExperienceRunCheckIns(["run-1"], "user-a"))
      .rejects.toThrow("The signed-in account changed.");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("caps check-in reads to fifty run identifiers and 200 rows", async () => {
    mocks.limit.mockResolvedValue({ data: [], error: null });
    const runIds = Array.from({ length: 75 }, (_, index) => `run-${index}`);
    await expect(loadExperienceRunCheckIns(runIds, "user-a")).resolves.toEqual([]);
    expect(mocks.in).toHaveBeenCalledWith("run_id", runIds.slice(0, 50));
    expect(mocks.limit).toHaveBeenCalledWith(200);
  });

  it("loads only the requested run check-ins after verifying the account", async () => {
    const rows = [{ id: "checkin-1", run_id: "run-1", user_id: "user-a", step_index: 0, signal: "pause_requested", created_at: "2026-11-21T00:00:00Z" }];
    mocks.limit.mockResolvedValue({ data: rows, error: null });
    await expect(loadExperienceRunCheckIns(["run-1"], "user-a")).resolves.toEqual(rows);
    expect(mocks.from).toHaveBeenCalledWith("afterhours_experience_run_checkins");
    expect(mocks.in).toHaveBeenCalledWith("run_id", ["run-1"]);
  });

  it("upserts only the signed-in participant's current-step signal", async () => {
    mocks.upsert.mockResolvedValue({ error: null });
    await expect(submitExperienceRunCheckIn({
      runId: "run-1", stepIndex: 2, signal: "pause_requested", expectedUserId: "user-a",
    })).resolves.toBeUndefined();
    expect(mocks.from).toHaveBeenCalledWith("afterhours_experience_run_checkins");
    expect(mocks.upsert).toHaveBeenCalledWith({
      run_id: "run-1", user_id: "user-a", step_index: 2, signal: "pause_requested",
    }, { onConflict: "run_id,user_id,step_index" });
  });

  it("rejects invalid run IDs before writing a shared check-in", async () => {
    await expect(submitExperienceRunCheckIn({
      runId: "not-a-uuid", stepIndex: 0, signal: "ready", expectedUserId: "user-a",
    })).rejects.toThrow("Invalid experience run.");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects invalid step indexes and participant signals before writing", async () => {
    await expect(submitExperienceRunCheckIn({
      runId: "run-1", stepIndex: 40, signal: "ready", expectedUserId: "user-a",
    })).rejects.toThrow("Invalid experience step.");
    await expect(submitExperienceRunCheckIn({
      runId: "run-1", stepIndex: 0, signal: "unexpected" as never, expectedUserId: "user-a",
    })).rejects.toThrow("Invalid participant signal.");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("refuses to submit a check-in for a different authenticated account", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-b" } }, error: null });
    await expect(submitExperienceRunCheckIn({
      runId: "run-1", stepIndex: 0, signal: "ready", expectedUserId: "user-a",
    })).rejects.toThrow("The signed-in account changed.");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("loads only this account's active run consents", async () => {
    mocks.limit.mockResolvedValue({ data: [{ run_id: "run-1" }], error: null });
    await expect(loadOwnExperienceRunConsentIds(["run-1"], "user-a")).resolves.toEqual(["run-1"]);
    expect(mocks.from).toHaveBeenCalledWith("afterhours_experience_run_consents");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(mocks.is).toHaveBeenCalledWith("revoked_at", null);
  });

  it("does not query active consent rows for an empty run list", async () => {
    await expect(loadOwnExperienceRunConsentIds([], "user-a")).resolves.toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("renews consent only through the authenticated server RPC", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    await expect(renewExperienceRunConsent("11111111-1111-4111-8111-111111111111", "user-a")).resolves.toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledWith("renew_afterhours_experience_consent", { p_run_id: "11111111-1111-4111-8111-111111111111" });
  });

  it("rejects consent renewal for invalid run IDs before calling the server", async () => {
    await expect(renewExperienceRunConsent("not-a-uuid", "user-a")).rejects.toThrow("Invalid experience run.");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("does not renew consent after the authenticated account changes", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-b" } }, error: null });
    await expect(renewExperienceRunConsent("11111111-1111-4111-8111-111111111111", "user-a"))
      .rejects.toThrow("The signed-in account changed.");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

});
