import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearTimer,
  defaultState,
  loadState,
  loadTimer,
  saveState,
  saveTimer,
} from "./storage";

const values = new Map<string, string>();

const localStorageMock = {
  get length() {
    return values.size;
  },
  clear() {
    values.clear();
  },
  getItem(key: string) {
    return values.get(key) ?? null;
  },
  key(index: number) {
    return Array.from(values.keys())[index] ?? null;
  },
  removeItem(key: string) {
    values.delete(key);
  },
  setItem(key: string, value: string) {
    values.set(key, String(value));
  },
};

describe("local persistence", () => {
  beforeEach(() => {
    values.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns a safe default when no saved state exists", () => {
    const state = loadState();

    expect(state.profile.username).toBe("nightwalker");
    expect(state.session.status).toBe("ready");
    expect(state.consent.status).toBe("pending");
    expect(state.ageConfirmed).toBe(false);
  });

  it("round-trips a saved profile and session", () => {
    const state = defaultState();
    state.profile.displayName = "Night Test";
    state.profile.xp = 240;
    state.session.status = "paused";
    state.session.round = 1;

    saveState(state);

    expect(loadState()).toEqual(state);
  });

  it("falls back safely when stored state is malformed", () => {
    localStorageMock.setItem("afterhours.state.v1", "{broken");

    const state = loadState();

    expect(state.profile.username).toBe("nightwalker");
    expect(state.session.status).toBe("ready");
  });

  it("filters malformed history and notifications without resetting the profile", () => {
    const state = defaultState();
    state.profile.displayName = "Night Test";
    const validHistory = {
      id: "history-1",
      completedAt: "2026-11-18T18:00:00.000Z",
      xpEarned: 45,
      rounds: 3,
    };
    const validNotification = {
      id: "notification-1",
      kind: "message" as const,
      title: "Sessie voltooid",
      body: "Je sessie is veilig opgeslagen.",
      createdAt: "2026-11-18T18:01:00.000Z",
      read: false,
    };
    state.history = [
      validHistory,
      { id: "bad-date", completedAt: "not-a-date", xpEarned: 10, rounds: 3 },
      null,
      { id: "", completedAt: "2026-11-18T18:00:00.000Z", xpEarned: 5, rounds: 1 },
    ] as unknown as typeof state.history;
    state.notifications = [
      validNotification,
      { ...validNotification, id: "unknown-kind", kind: "system" },
      { ...validNotification, id: "invalid-read", read: "false" },
      { ...validNotification, id: "empty-body", body: "  " },
      null,
    ] as unknown as typeof state.notifications;

    saveState(state);

    const restored = loadState();

    expect(restored.profile.displayName).toBe("Night Test");
    expect(restored.history).toEqual([validHistory]);
    expect(restored.notifications).toEqual([validNotification]);
  });

  it("keeps the newest history and notification records within their storage limits", () => {
    const state = defaultState();
    state.history = Array.from({ length: 15 }, (_, index) => ({
      id: `history-${index}`,
      completedAt: new Date(Date.UTC(2026, 10, 18, 0, 14 - index)).toISOString(),
      xpEarned: 10,
      rounds: 3,
    }));
    state.notifications = Array.from({ length: 25 }, (_, index) => ({
      id: `notification-${index}`,
      kind: "message" as const,
      title: "Update",
      body: "Nieuwe melding.",
      createdAt: new Date(Date.UTC(2026, 10, 18, 0, 24 - index)).toISOString(),
      read: false,
    }));

    saveState(state);

    expect(loadState().history).toHaveLength(12);
    expect(loadState().notifications).toHaveLength(20);
    expect(loadState().history[0].id).toBe("history-0");
    expect(loadState().notifications[0].id).toBe("notification-0");
  });

  it("subtracts elapsed wall-clock time from a running timer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    saveTimer("profile-a", 0, 60, true);

    vi.setSystemTime(new Date("2026-10-09T12:00:15.000Z"));

    expect(loadTimer("profile-a", 0, 60)).toBe(45);
  });

  it("does not subtract elapsed time from a paused timer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    saveTimer("profile-a", 0, 60, false);

    vi.setSystemTime(new Date("2026-10-09T12:05:00.000Z"));

    expect(loadTimer("profile-a", 0, 60)).toBe(60);
  });

  it("fails closed for corrupt timer values belonging to the active profile and round", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    const key = "afterhours.timer.v1:profile-a";
    const invalidSnapshots = [
      { profileId: "profile-a", round: 0, seconds: -1, savedAt: Date.now(), running: true },
      { profileId: "profile-a", round: 0, seconds: 12.5, savedAt: Date.now(), running: true },
      { profileId: "profile-a", round: 0, seconds: 61, savedAt: Date.now(), running: true },
      { profileId: "profile-a", round: 0, seconds: 30, savedAt: Date.now(), running: "yes" },
    ];

    for (const snapshot of invalidSnapshots) {
      localStorageMock.setItem(key, JSON.stringify(snapshot));
      expect(loadTimer("profile-a", 0, 60)).toBe(0);
    }
  });

  it("fails closed when the timer snapshot for the active profile cannot be parsed", () => {
    localStorageMock.setItem("afterhours.timer.v1:profile-a", "{broken");
    expect(loadTimer("profile-a", 0, 60)).toBe(0);
  });

  it("uses a fresh timer only when no snapshot exists or a valid snapshot belongs to another round", () => {
    expect(loadTimer("profile-a", 0, 60)).toBe(60);
    localStorageMock.setItem("afterhours.timer.v1:profile-a", JSON.stringify({
      profileId: "profile-a", round: 1, seconds: 20, savedAt: Date.now(), running: false,
    }));
    expect(loadTimer("profile-a", 0, 60)).toBe(60);
  });

  it("fails closed when the device clock moves behind an active timer snapshot", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    saveTimer("profile-a", 0, 30, true);

    vi.setSystemTime(new Date("2026-10-09T11:59:00.000Z"));

    expect(loadTimer("profile-a", 0, 60)).toBe(0);
  });

  it("does not expire a paused timer when the device clock is behind its snapshot", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    saveTimer("profile-a", 0, 30, false);

    vi.setSystemTime(new Date("2026-10-09T11:59:00.000Z"));

    expect(loadTimer("profile-a", 0, 60)).toBe(30);
  });

  it("returns zero when an active timer elapsed while the app was in the background", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    saveTimer("profile-a", 0, 10, true);

    vi.setSystemTime(new Date("2026-10-09T12:00:15.000Z"));

    expect(loadTimer("profile-a", 0, 60)).toBe(0);
  });

  it("does not restore a timer belonging to another profile or round", () => {
    saveTimer("profile-a", 1, 30, false);

    expect(loadTimer("profile-b", 1, 60)).toBe(60);
    expect(loadTimer("profile-a", 0, 60)).toBe(60);
  });

  it("clears a saved timer", () => {
    saveTimer("profile-a", 0, 45, false);

    expect(clearTimer("profile-a")).toBe(true);
    expect(loadTimer("profile-a", 0, 60)).toBe(60);
  });
});
