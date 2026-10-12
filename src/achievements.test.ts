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

  it("writes achievement events to the selected account bucket", () => {
    const values = installStorage();
    recordAchievement("tarot", { profileId: "alice" });

    expect(JSON.parse(values.get("afterhours.achievements.v1.alice") ?? "[]"))
      .toEqual([expect.objectContaining({ id: "tarot_reader", eventKey: "tarot:first" })]);
    expect(values.has("afterhours.achievements.v1")).toBe(false);
  });
});
