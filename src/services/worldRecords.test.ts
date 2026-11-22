import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  gt: vi.fn(),
  is: vi.fn(),
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

import { loadExperienceRuns, loadWorldRecords, resumeExperienceRun, saveWorldRecord, updateExperienceRun } from "./worldRecords";

const chain = {
  select: mocks.select,
  eq: mocks.eq,
  in: mocks.in,
  gt: mocks.gt,
  is: mocks.is,
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
    mocks.in.mockReturnValue(chain);
    mocks.gt.mockReturnValue(chain);
    mocks.is.mockResolvedValue({ error: null });
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

  it("resumes only a paused run within its persisted length after fresh consent", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: { id: "run-1", total_steps: 3 }, error: null })
      .mockResolvedValueOnce({ data: { id: "consent-1" }, error: null })
      .mockResolvedValueOnce({ data: { id: "run-1" }, error: null });

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).resolves.toBeUndefined();

    expect(mocks.from).toHaveBeenNthCalledWith(1, "afterhours_experience_runs");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "afterhours_experience_run_consents");
    expect(mocks.from).toHaveBeenNthCalledWith(3, "afterhours_experience_runs");
    expect(mocks.eq).toHaveBeenCalledWith("status", "paused");
    expect(mocks.gt).toHaveBeenCalledWith("total_steps", 2);
    expect(mocks.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: "active", current_step: 2 }));
  });

  it("does not renew consent when the persisted run is no longer paused", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).rejects.toThrow("This experience run could not be resumed.");

    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a resume cursor at the persisted terminal step before renewing consent", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "run-1", total_steps: 2 }, error: null });

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).rejects.toThrow("Invalid experience step.");

    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.gt).not.toHaveBeenCalled();
  });

  it("revokes temporary consent if the paused state changes after the preflight read", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: { id: "run-1", total_steps: 3 }, error: null })
      .mockResolvedValueOnce({ data: { id: "consent-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).rejects.toThrow("This experience run could not be resumed.");

    expect(mocks.gt).toHaveBeenCalledWith("total_steps", 2);
    expect(mocks.update).toHaveBeenNthCalledWith(3, expect.objectContaining({ revoked_at: expect.any(String) }));
  });

  it.each([
    ["active", ["active"]],
    ["paused", ["active"]],
    ["completed", ["active"]],
    ["stopped", ["active", "paused"]],
  ] as const)(
    "allows %s updates only from the expected non-terminal state",
    async (status, allowedPreviousStates) => {
      mocks.maybeSingle.mockResolvedValue({ data: { id: "run-1" }, error: null });

      await expect(updateExperienceRun({
        runId: "run-1",
        expectedUserId: "user-a",
        status,
        currentStep: 1,
      })).resolves.toBeUndefined();

      if (allowedPreviousStates.length === 1) {
        expect(mocks.eq).toHaveBeenCalledWith("status", "active");
        expect(mocks.in).not.toHaveBeenCalled();
      } else {
        expect(mocks.in).toHaveBeenCalledWith("status", ["active", "paused"]);
      }
      if (status === "stopped") {
        expect(mocks.update.mock.calls[0][0]).not.toHaveProperty("current_step");
        expect(mocks.gt).not.toHaveBeenCalled();
      } else if (status === "completed") {
        expect(mocks.eq).toHaveBeenCalledWith("total_steps", 1);
        expect(mocks.gt).not.toHaveBeenCalled();
      } else {
        expect(mocks.gt).toHaveBeenCalledWith("total_steps", 1);
      }
      if (status === "active") {
        expect(mocks.is).not.toHaveBeenCalled();
      } else {
        expect(mocks.is).toHaveBeenCalledWith("revoked_at", null);
      }
    },
  );

  it.each(["paused", "completed"] as const)(
    "does not let a stale %s update overwrite a terminal run",
    async status => {
      mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(updateExperienceRun({
        runId: "run-1",
        expectedUserId: "user-a",
        status,
        currentStep: 1,
      })).rejects.toThrow("This experience run changed state");

      expect(mocks.from).toHaveBeenCalledTimes(1);
      expect(mocks.is).not.toHaveBeenCalled();
    },
  );

  it.each([-1, 1.5, 40, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid progress cursor %s before authentication or database writes",
    async currentStep => {
      await expect(updateExperienceRun({
        runId: "run-1",
        expectedUserId: "user-a",
        status: "active",
        currentStep,
      })).rejects.toThrow("Invalid experience step.");

      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it.each([-1, 0, 1.5, 41, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid completion cursor %s before authentication or database writes",
    async currentStep => {
      await expect(updateExperienceRun({
        runId: "run-1",
        expectedUserId: "user-a",
        status: "completed",
        currentStep,
        completed: true,
      })).rejects.toThrow("Invalid experience step.");

      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("rejects unsupported runtime statuses before authentication or database writes", async () => {
    await expect(updateExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      status: "ready" as never,
      currentStep: 0,
    })).rejects.toThrow("Invalid experience run status.");

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("keeps STOP available with a malformed stale cursor and preserves the server progress", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "run-1" }, error: null });

    await expect(updateExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      status: "stopped",
      currentStep: Number.NaN,
    })).resolves.toBeUndefined();

    expect(mocks.update.mock.calls[0][0]).toEqual(expect.objectContaining({ status: "stopped" }));
    expect(mocks.update.mock.calls[0][0]).not.toHaveProperty("current_step");
    expect(mocks.in).toHaveBeenCalledWith("status", ["active", "paused"]);
    expect(mocks.is).toHaveBeenCalledWith("revoked_at", null);
  });

  it("uses the persisted total step count to reject an out-of-range progress cursor atomically", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(updateExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      status: "active",
      currentStep: 3,
    })).rejects.toThrow("This experience run changed state");

    expect(mocks.gt).toHaveBeenCalledWith("total_steps", 3);
  });

  it("does not write if authentication cannot be verified", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Auth unavailable" } });

    await expect(saveWorldRecord("vault", "vault:1", { ciphertext: "only-ciphertext" }, "user-a"))
      .rejects.toThrow("Auth unavailable");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
