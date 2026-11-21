import { afterEach, describe, expect, it, vi } from "vitest";
import { listEarnedBadges, recordAchievement } from "./achievements";

function installStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
  });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal("CustomEvent", class CustomEvent {
    type: string;
    constructor(type: string) { this.type = type; }
  });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe("account-scoped achievements", () => {
  it("keeps earned badges separate for different accounts", () => {
    const alice = [{ id: "first_login", earnedAt: "2026-10-12T10:00:00.000Z", eventKey: "login:first" }];
    const bob = [{ id: "tarot_reader", earnedAt: "2026-10-12T11:00:00.000Z", eventKey: "tarot:first" }];
    installStorage({
      "afterhours.achievements.v1.alice": JSON.stringify(alice),
      "afterhours.achievements.v1.bob": JSON.stringify(bob),
    });

    expect(listEarnedBadges("alice")).toEqual(alice);
    expect(listEarnedBadges("bob")).toEqual(bob);
    expect(listEarnedBadges("charlie")).toEqual([]);
  });

  it("keeps anonymous demo badges in the legacy device-only bucket", () => {
    const guest = [{ id: "first_login", earnedAt: "2026-10-12T10:00:00.000Z", eventKey: "login:first" }];
    installStorage({ "afterhours.achievements.v1": JSON.stringify(guest) });

    expect(listEarnedBadges()).toEqual(guest);
    expect(listEarnedBadges("signed-in-user")).toEqual([]);
  });

  it("ignores unknown badges and records with invalid fields", () => {
    const valid = { id: "first_login", earnedAt: "2026-10-12T10:00:00.000Z", eventKey: "login:first" };
    installStorage({ "afterhours.achievements.v1.alice": JSON.stringify([valid, null, { id: "unknown", earnedAt: valid.earnedAt, eventKey: "unknown" }, { id: "first_login", earnedAt: "not-a-date", eventKey: "login:first" }, { id: "first_login", earnedAt: valid.earnedAt, eventKey: "   " }]) });
    expect(listEarnedBadges("alice")).toEqual([valid]);
  });

  it("awards each completed Story Mode chapter once per account", () => {
    const values = installStorage();
    recordAchievement("story_chapter_complete", { profileId: "alice", chapterId: "arrival" });
    recordAchievement("story_chapter_complete", { profileId: "alice", chapterId: "arrival" });
    recordAchievement("story_chapter_complete", { profileId: "alice", chapterId: "boundary" });
    recordAchievement("story_chapter_complete", { profileId: "alice", chapterId: "not-a-chapter" });

    expect(JSON.parse(values.get("afterhours.achievements.v1.alice") ?? "[]"))
      .toEqual([expect.objectContaining({ id: "story_arrival", eventKey: "story:arrival" }), expect.objectContaining({ id: "story_boundary", eventKey: "story:boundary" })]);
    expect(listEarnedBadges("bob")).toEqual([]);
  });

  it("writes achievement events to the selected account bucket", () => {
    const values = installStorage();
    recordAchievement("tarot", { profileId: "alice" });

    expect(JSON.parse(values.get("afterhours.achievements.v1.alice") ?? "[]"))
      .toEqual([expect.objectContaining({ id: "tarot_reader", eventKey: "tarot:first" })]);
    expect(values.has("afterhours.achievements.v1")).toBe(false);
  });
});


describe("Kink Profile achievements", () => {
  it("awards the first-discovery and boundary badges once per account", () => {
    const values = installStorage();
    recordAchievement("kink_test_complete", { profileId: "alice" });
    recordAchievement("kink_test_complete", { profileId: "alice" });
    recordAchievement("kink_test_boundaries", { profileId: "alice" });
    expect(JSON.parse(values.get("afterhours.achievements.v1.alice") ?? "[]"))
      .toEqual([
        expect.objectContaining({ id: "kink_self_knowing", eventKey: "kink-test:first" }),
        expect.objectContaining({ id: "kink_boundary_architect", eventKey: "kink-test:boundaries" }),
      ]);
    expect(listEarnedBadges("bob")).toEqual([]);
  });
});
