import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

import { loadRemoteState } from "./backend";

describe("loadRemoteState error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  });

  it("throws when the authentication check fails instead of treating it as a missing profile", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "temporary auth outage" },
    });

    await expect(loadRemoteState()).rejects.toThrow("Accountstatus kon niet worden gecontroleerd: temporary auth outage");
  });

  it("throws when the profile query fails instead of silently returning no remote state", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "temporary database outage" },
    });

    await expect(loadRemoteState()).rejects.toThrow("Profiel kon niet worden geladen: temporary database outage");
  });

  it("returns null only when an authenticated account genuinely has no profile yet", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(loadRemoteState()).resolves.toBeNull();
  });
});
