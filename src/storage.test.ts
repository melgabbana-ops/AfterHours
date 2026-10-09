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
