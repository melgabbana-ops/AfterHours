import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  upsert: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from },
}));

import { createExperienceRun, loadExperienceRuns, loadWorldRecords, saveWorldRecord } from "./worldRecords";

const chain = {
  select: mocks.select,
  eq: mocks.eq,
  order: mocks.order,
  limit: mocks.limit,
  upsert: mocks.upsert,
  insert: mocks.insert,
  update: mocks.update,
  delete: mocks.delete,
  maybeSingle: mocks.maybeSingle,
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
    mocks.upsert.mockReturnValue(chain);
    mocks.insert.mockReturnValue(chain);
    mocks.update.mockReturnValue(chain);
    mocks.delete.mockReturnValue(chain);
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("creates a run paused, records owner consent, and only then activates it", async () => {
    mocks.single.mockResolvedValue({ data: { id: "run-1" }, error: null });
    mocks.maybeSingle.mockResolvedValue({ data: { id: "run-1" }, error: null });

    await expect(createExperienceRun({
      sceneKey: "builtin:trust-protocol",
      sceneSnapshot: { title: "Trust protocol", steps: ["Check in"] },
      totalSteps: 1,
      expectedUserId: "user-a",
    })).resolves.toBe("run-1");

    expect(mocks.insert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      user_id: "user-a",
      status: "paused",
      started_at: null,
    }));
    expect(mocks.insert).toHaveBeenNthCalledWith(2, expect.objectContaining({
      run_id: "run-1",
      user_id: "user-a",
      consent_version: "1.0",
    }));
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "active",
      started_at: expect.any(String),
    }));
    expect(mocks.maybeSingle).toHaveBeenCalled();
  });

  it("deletes the paused run and never activates it when owner consent cannot be saved", async () => {
    mocks.single.mockResolvedValue({ data: { id: "run-2" }, error: null });
    mocks.insert.mockReturnValueOnce(chain).mockResolvedValueOnce({ error: { message: "consent denied" } });

    await expect(createExperienceRun({
      sceneKey: "builtin:trust-protocol",
      sceneSnapshot: { title: "Trust protocol", steps: ["Check in"] },
      totalSteps: 1,
      expectedUserId: "user-a",
    })).rejects.toThrow("The consent record could not be saved.");

    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.delete).toHaveBeenCalled();
  });

  it("revokes consent and cleans up when the database refuses to activate the run", async () => {
    mocks.single.mockResolvedValue({ data: { id: "run-3" }, error: null });
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "activation blocked" } });

    await expect(createExperienceRun({
      sceneKey: "builtin:trust-protocol",
      sceneSnapshot: { title: "Trust protocol", steps: ["Check in"] },
      totalSteps: 1,
      expectedUserId: "user-a",
    })).rejects.toThrow("activation blocked");

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }));
    expect(mocks.update).toHaveBeenCalledWith({ revoked_at: expect.any(String) });
    expect(mocks.delete).toHaveBeenCalled();
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
});
