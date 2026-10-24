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

  it("drops malformed nested records without resetting session or consent", () => {
    const state = defaultState();
    state.session.status = "paused";
    state.consent = {
      status: "active",
      confirmedAt: "2026-10-24T00:00:00.000Z",
      revokedAt: null,
    };
    state.history = [{ id: "history-1", completedAt: "2026-10-24T00:00:00.000Z", xpEarned: 20, rounds: 1 }];
    state.notifications = [{
      id: "notice-1",
      kind: "safety",
      title: "Safety reminder",
      body: "Take a pause whenever you need one.",
      createdAt: "2026-10-24T00:00:00.000Z",
      read: false,
    }];

    saveState(state);

    const raw = JSON.parse(values.get("afterhours.state.v1") ?? "{}") as Record<string, unknown>;
    raw.history = [
      state.history[0],
      null,
      { id: 12, completedAt: "not-a-record", xpEarned: "20", rounds: -1 },
      { id: "", completedAt: "2026-10-24T00:00:00.000Z", xpEarned: 5, rounds: 1 },
      { id: "history-2", completedAt: "not-a-date", xpEarned: 5, rounds: 1 },
    ];
    raw.notifications = [
      state.notifications[0],
      null,
      { id: "notice-2", kind: "unknown", title: "Bad kind", body: "", createdAt: "", read: false },
      { id: "", kind: "message", title: "Empty ID", body: "Body", createdAt: "2026-10-24T00:00:00.000Z", read: false },
      { id: "notice-3", kind: "message", title: "Invalid timestamp", body: "Body", createdAt: "not-a-date", read: false },
    ];
    values.set("afterhours.state.v1", JSON.stringify(raw));

    const restored = loadState();

    expect(restored.session.status).toBe("paused");
    expect(restored.consent).toEqual(state.consent);
    expect(restored.history).toEqual(state.history);
    expect(restored.notifications).toEqual(state.notifications);
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

  it("clears a saved timer", () => {
    saveTimer("profile-a", 0, 45, false);

    expect(clearTimer("profile-a")).toBe(true);
    expect(loadTimer("profile-a", 0, 60)).toBe(60);
  });
});
