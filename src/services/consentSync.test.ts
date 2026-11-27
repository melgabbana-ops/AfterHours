import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function activeSessionState() {
  return {
    profile: {
      id: "user-123",
      displayName: "Night Walker",
      username: "nightwalker",
      avatarStyle: "sigil" as const,
    },
    session: {
      id: SESSION_ID,
      status: "active" as const,
      round: 0,
      startedAt: "2026-11-19T08:00:00.000Z",
      updatedAt: "2026-11-19T08:00:00.000Z",
    },
    consent: {
      status: "active" as const,
      confirmedAt: "2026-11-19T07:59:00.000Z",
      revokedAt: null,
    },
  } as import("../types").AfterHoursState;
}

describe("consent revocation ordering", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mocks.from.mockImplementation(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: SESSION_ID },
        error: null,
      }),
    }));
  });

  it("applies STOP after an in-flight sync and drops older queued active snapshots", async () => {
    const activeStarted = deferred<void>();
    const activeWrite = deferred<{ error: null }>();
    const calls: Array<{ name: string; status?: string }> = [];

    mocks.rpc.mockImplementation((name: string, args: { p_status?: string }) => {
      calls.push({ name, status: args?.p_status });
      if (name === "set_consent_state" && args?.p_status === "active") {
        activeStarted.resolve();
        return activeWrite.promise;
      }
      return Promise.resolve({ error: null });
    });

    const { syncRemoteState, revokeRemoteConsent } = await import("./backend");
    const state = activeSessionState();

    const inFlightSync = syncRemoteState(state, "user-123");
    await activeStarted.promise;

    // This older snapshot is waiting behind the in-flight sync when STOP occurs.
    const queuedStaleSync = syncRemoteState(state, "user-123");
    const revocation = revokeRemoteConsent(SESSION_ID, "2026-11-19T08:01:00.000Z");

    await Promise.resolve();
    expect(calls).toEqual([{ name: "set_consent_state", status: "active" }]);

    activeWrite.resolve({ error: null });
    await expect(Promise.all([inFlightSync, queuedStaleSync, revocation])).resolves.toEqual([
      null,
      null,
      null,
    ]);

    expect(calls).toEqual([
      { name: "set_consent_state", status: "active" },
      { name: "set_session_state", status: "active" },
      { name: "set_consent_state", status: "revoked" },
    ]);
  });

  it("does not write a queued snapshot after the authenticated account changes", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-456" } },
      error: null,
    });

    const { syncRemoteState } = await import("./backend");
    const result = await syncRemoteState(activeSessionState(), "user-123");

    expect(result).toContain("Het aangemelde account is gewijzigd");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

});


describe("offline STOP acknowledgement", () => {
  it("does not report a missing server session as a successful revocation", async () => {
    mocks.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    const { revokeRemoteConsent } = await import("./backend");
    await expect(revokeRemoteConsent(SESSION_ID, "2026-11-19T08:01:00.000Z"))
      .resolves.toContain("Server-sessie niet gevonden");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a non-UUID session identifier instead of silently skipping STOP sync", async () => {
    const { revokeRemoteConsent } = await import("./backend");
    await expect(revokeRemoteConsent("local-session", "2026-11-19T08:01:00.000Z"))
      .resolves.toContain("Sessie-ID kan niet veilig worden gecontroleerd");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
