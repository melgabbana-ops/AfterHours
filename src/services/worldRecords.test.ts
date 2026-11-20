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
}));

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from },
}));

import { loadWorldRecords, saveWorldRecord } from "./worldRecords";

const chain = {
  select: mocks.select,
  eq: mocks.eq,
  order: mocks.order,
  limit: mocks.limit,
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
