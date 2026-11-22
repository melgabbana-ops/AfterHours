import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  upsert: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from },
}));

import { loadExperienceRuns, loadWorldRecords, resumeExperienceRun, saveWorldRecord } from "./worldRecords";

const chain = {
  select: mocks.select,
  eq: mocks.eq,
  order: mocks.order,
  limit: mocks.limit,
  upsert: mocks.upsert,
  single: mocks.single,
  update: mocks.update,
  maybeSingle: mocks.maybeSingle,
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
    mocks.update.mockReturnValue(chain);
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


  it.each([-1, 1.5, 40, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid resume step index %s before authentication or database writes",
    async currentStep => {
      await expect(resumeExperienceRun({
        runId: "run-1",
        expectedUserId: "user-a",
        currentStep,
      })).rejects.toThrow("Invalid experience step.");

      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("resumes only a paused run after fresh consent is confirmed", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: { id: "consent-1" }, error: null })
      .mockResolvedValueOnce({ data: { id: "run-1" }, error: null });

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).resolves.toBeUndefined();

    expect(mocks.from).toHaveBeenNthCalledWith(1, "afterhours_experience_run_consents");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "afterhours_experience_runs");
    expect(mocks.eq).toHaveBeenCalledWith("status", "paused");
    expect(mocks.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: "active", current_step: 2 }));
  });

  it("does not reactivate a run that is no longer paused and revokes the temporary consent renewal", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: { id: "consent-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).rejects.toThrow("This experience run could not be resumed.");

    expect(mocks.eq).toHaveBeenCalledWith("status", "paused");
    expect(mocks.update).toHaveBeenNthCalledWith(3, expect.objectContaining({ revoked_at: expect.any(String) }));
  });

  it("does not write if authentication cannot be verified", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Auth unavailable" } });

    await expect(saveWorldRecord("vault", "vault:1", { ciphertext: "only-ciphertext" }, "user-a"))
      .rejects.toThrow("Auth unavailable");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
