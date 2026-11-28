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
  insert: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from },
}));

import { createExperienceInvitation, loadExperienceInvitations, deleteExperienceRun, deleteWorldRecord, ExperienceRunDeletionBlockedError, ExperienceRunResumeRollbackError, hasActiveExperienceRuns, loadExperienceRuns, loadWorldRecords, resumeExperienceRun, saveWorldRecord, updateExperienceRun } from "./worldRecords";

const chain = {
  select: mocks.select,
  eq: mocks.eq,
  in: mocks.in,
  gt: mocks.gt,
  is: mocks.is,
  order: mocks.order,
  limit: mocks.limit,
  upsert: mocks.upsert,
  insert: mocks.insert,
  single: mocks.single,
  update: mocks.update,
  delete: mocks.delete,
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
    mocks.is.mockReturnValue(chain);
    mocks.order.mockReturnValue(chain);
    mocks.limit.mockReturnValue(chain);
    mocks.upsert.mockReturnValue(chain);
    mocks.insert.mockReturnValue(chain);
    mocks.update.mockReturnValue(chain);
    mocks.delete.mockReturnValue(chain);
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

  it("confirms a private world record deletion only after the database returns the deleted row", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "record-1" }, error: null });

    await expect(deleteWorldRecord("director", "scene:1", "user-a")).resolves.toBeUndefined();

    expect(mocks.from).toHaveBeenCalledWith("afterhours_world_records");
    expect(mocks.delete).toHaveBeenCalledOnce();
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "user_id", "user-a");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "module", "director");
    expect(mocks.eq).toHaveBeenNthCalledWith(3, "record_key", "scene:1");
    expect(mocks.select).toHaveBeenCalledWith("id");
  });

  it("fails closed when RLS silently filters a private world-record deletion", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(deleteWorldRecord("vault", "vault:private-note", "user-a"))
      .rejects.toThrow("Deletion could not be confirmed. Refresh and try again.");
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
    expect(mocks.eq).toHaveBeenCalledOnce();
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-a");
  });

  it("detects persisted active or paused runs for the signed-in owner", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "run-live" }, error: null });

    await expect(hasActiveExperienceRuns("user-a")).resolves.toBe(true);
    expect(mocks.from).toHaveBeenCalledWith("afterhours_experience_runs");
    expect(mocks.select).toHaveBeenCalledWith("id");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(mocks.in).toHaveBeenCalledWith("status", ["active", "paused"]);
    expect(mocks.limit).toHaveBeenCalledWith(1);
  });

  it("allows bulk deletion preflight only when no owned run is active or paused", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(hasActiveExperienceRuns("user-a")).resolves.toBe(false);
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(mocks.in).toHaveBeenCalledWith("status", ["active", "paused"]);
  });

  it("fails closed when the live-run deletion preflight cannot be verified", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "Read failed" } });

    await expect(hasActiveExperienceRuns("user-a")).rejects.toThrow("Read failed");
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


  it("does not expose invitation token hashes when loading invitation history", async () => {
    const invitations = [{
      id: "invitation-1",
      run_id: "run-1",
      status: "pending",
      accepted_at: null,
      expires_at: "2026-11-30T12:00:00.000Z",
      created_at: "2026-11-23T12:00:00.000Z",
    }];
    mocks.limit.mockResolvedValue({ data: invitations, error: null });

    await expect(loadExperienceInvitations("user-a")).resolves.toEqual(invitations);
    expect(mocks.from).toHaveBeenCalledWith("afterhours_experience_invitations");
    expect(mocks.select).toHaveBeenCalledWith("id,run_id,status,accepted_at,expires_at,created_at");
    expect(mocks.select.mock.calls[0][0]).not.toContain("token_hash");
  });

  it("uses the database default for invitation expiry and keeps token hashes out of the response", async () => {
    const tokenHash = "a".repeat(64);
    const invitation = {
      id: "invitation-1",
      run_id: "run-1",
      status: "pending",
      accepted_at: null,
      expires_at: "2026-11-30T12:00:00.000Z",
      created_at: "2026-11-23T12:00:00.000Z",
    };
    mocks.single.mockResolvedValue({ data: invitation, error: null });

    await expect(createExperienceInvitation({
      runId: "run-1",
      tokenHash,
      expectedUserId: "user-a",
    })).resolves.toEqual(invitation);

    expect(mocks.insert).toHaveBeenCalledWith({
      run_id: "run-1",
      inviter_user_id: "user-a",
      token_hash: tokenHash,
    });
    expect(mocks.select).toHaveBeenCalledWith("id,run_id,status,accepted_at,expires_at,created_at");
    expect(mocks.select.mock.calls[0][0]).not.toContain("token_hash");
    expect(mocks.insert.mock.calls[0][0]).not.toHaveProperty("expires_at");
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
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: "consent-1" }, error: null });

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).rejects.toThrow("This experience run could not be resumed.");

    expect(mocks.gt).toHaveBeenCalledWith("total_steps", 2);
    expect(mocks.update).toHaveBeenNthCalledWith(3, expect.objectContaining({ revoked_at: expect.any(String) }));
    expect(mocks.select).toHaveBeenLastCalledWith("id");
  });

  it.each([
    ["database error", { data: null, error: { message: "RLS denied" } }],
    ["no confirmed row", { data: null, error: null }],
  ])("fails closed when temporary consent revocation cannot be confirmed (%s)", async (_caseName, rollbackResult) => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: { id: "run-1", total_steps: 3 }, error: null })
      .mockResolvedValueOnce({ data: { id: "consent-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce(rollbackResult);

    await expect(resumeExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      currentStep: 2,
    })).rejects.toBeInstanceOf(ExperienceRunResumeRollbackError);

    expect(mocks.update).toHaveBeenNthCalledWith(3, { revoked_at: expect.any(String) });
    expect(mocks.is).toHaveBeenCalledWith("revoked_at", null);
    expect(mocks.select).toHaveBeenLastCalledWith("id");
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

  it("keeps STOP independent of stale progress, completion, and interaction data", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "run-1" }, error: null });

    await expect(updateExperienceRun({
      runId: "run-1",
      expectedUserId: "user-a",
      status: "stopped",
      currentStep: Number.NaN,
      completed: true,
      interactionLog: [{ stepIndex: 99, choice: "stale-client-value", at: "2026-11-22T00:00:00.000Z" }],
    })).resolves.toBeUndefined();

    const stopUpdate = mocks.update.mock.calls[0][0];
    expect(stopUpdate).toEqual(expect.objectContaining({ status: "stopped" }));
    expect(stopUpdate).not.toHaveProperty("current_step");
    expect(stopUpdate).not.toHaveProperty("completed_at");
    expect(stopUpdate).not.toHaveProperty("interaction_log");
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


  it("refuses to delete an active or paused run so the owner retains the STOP path", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(deleteExperienceRun("run-1", "user-a"))
      .rejects.toBeInstanceOf(ExperienceRunDeletionBlockedError);

    expect(mocks.from).toHaveBeenCalledWith("afterhours_experience_runs");
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "id", "run-1");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "user_id", "user-a");
    expect(mocks.in).toHaveBeenCalledWith("status", ["ready", "completed", "stopped"]);
    expect(mocks.select).toHaveBeenCalledWith("id");
  });

  it("deletes an owned draft or terminal run and confirms the deleted row", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "run-1" }, error: null });

    await expect(deleteExperienceRun("run-1", "user-a")).resolves.toBeUndefined();

    expect(mocks.delete).toHaveBeenCalledOnce();
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "id", "run-1");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "user_id", "user-a");
    expect(mocks.in).toHaveBeenCalledWith("status", ["ready", "completed", "stopped"]);
  });

  it("surfaces database errors when deleting an experience run", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "Delete failed" } });

    await expect(deleteExperienceRun("run-1", "user-a")).rejects.toThrow("Delete failed");
  });

  it("does not write if authentication cannot be verified", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Auth unavailable" } });

    await expect(saveWorldRecord("vault", "vault:1", { ciphertext: "only-ciphertext" }, "user-a"))
      .rejects.toThrow("Auth unavailable");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
