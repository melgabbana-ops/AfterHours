import { describe, expect, it } from "vitest";
import { isMissionCompletionPayload, isRemoteMissionProgressPayload } from "./missions";

const validCompletion = {
  mission_id: "daily-intention",
  mission_kind: "daily",
  reward_points: 10,
  period_key: "2026-10-24",
  already_completed: false,
  completed_at: "2026-10-24T07:00:00.000Z",
};

const validProgress = {
  mission_id: "daily-intention",
  mission_kind: "daily",
  reward_points: 10,
  period_key: "2026-10-24",
  completed: true,
  completed_at: "2026-10-24T07:00:00.000Z",
};

describe("mission progress RPC payload", () => {
  it("accepts a complete daily progress row", () => {
    expect(isRemoteMissionProgressPayload(validProgress)).toBe(true);
  });

  it("accepts the matching weekly and special mission kinds", () => {
    expect(isRemoteMissionProgressPayload({
      ...validProgress,
      mission_id: "weekly-care",
      mission_kind: "weekly",
      period_key: "2026-W43",
    })).toBe(true);
    expect(isRemoteMissionProgressPayload({
      ...validProgress,
      mission_id: "special-consent",
      mission_kind: "special",
      period_key: "season-1",
      completed_at: null,
    })).toBe(true);
  });

  it.each([
    ["unknown mission", { ...validProgress, mission_id: "unexpected" }],
    ["mismatched mission kind", { ...validProgress, mission_kind: "special" }],
    ["negative reward", { ...validProgress, reward_points: -1 }],
    ["empty period key", { ...validProgress, period_key: "  " }],
    ["invalid completion timestamp", { ...validProgress, completed_at: "not-a-date" }],
    ["missing completion flag", (({ completed: _ignored, ...rest }) => rest)(validProgress)],
  ])("rejects %s", (_label, payload) => {
    expect(isRemoteMissionProgressPayload(payload)).toBe(false);
  });

  it("rejects nulls, arrays, and non-object rows", () => {
    expect(isRemoteMissionProgressPayload(null)).toBe(false);
    expect(isRemoteMissionProgressPayload([])).toBe(false);
    expect(isRemoteMissionProgressPayload("daily-intention")).toBe(false);
  });
});

describe("mission completion RPC payload", () => {
  it("accepts a complete, correctly typed daily completion", () => {
    expect(isMissionCompletionPayload(validCompletion, "daily-intention")).toBe(true);
  });

  it("accepts supported weekly and special mission kinds", () => {
    expect(isMissionCompletionPayload({
      ...validCompletion,
      mission_id: "weekly-care",
      mission_kind: "weekly",
      period_key: "2026-W43",
    }, "weekly-care")).toBe(true);
    expect(isMissionCompletionPayload({
      ...validCompletion,
      mission_id: "special-consent",
      mission_kind: "special",
      period_key: "season-1",
    }, "special-consent")).toBe(true);
  });

  it.each([
    ["wrong mission kind", { ...validCompletion, mission_kind: "special" }],
    ["missing completion flag", (({ already_completed: _ignored, ...rest }) => rest)(validCompletion)],
    ["negative reward", { ...validCompletion, reward_points: -1 }],
    ["empty period key", { ...validCompletion, period_key: "  " }],
    ["invalid completion timestamp", { ...validCompletion, completed_at: "not-a-date" }],
  ])("rejects %s", (_label, payload) => {
    expect(isMissionCompletionPayload(payload, "daily-intention")).toBe(false);
  });

  it("rejects nulls, arrays, and unknown mission IDs", () => {
    expect(isMissionCompletionPayload(null, "daily-intention")).toBe(false);
    expect(isMissionCompletionPayload([], "daily-intention")).toBe(false);
    expect(isMissionCompletionPayload(validCompletion, "unknown-mission")).toBe(false);
  });
});
