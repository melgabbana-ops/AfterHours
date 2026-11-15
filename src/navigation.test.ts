import { describe, expect, it } from "vitest";
import { initialScreenFromSearch } from "./navigation";

describe("initialScreenFromSearch", () => {
  it("opens every supported direct-link screen", () => {
    const screens = [
      "game", "gameSelect", "complete", "profile", "admin", "insights", "radio",
      "aftercare", "prompts", "safety", "store", "onboarding", "controlroom",
      "missions", "legal", "social", "lovense", "daily",
    ];
    for (const screen of screens) {
      expect(initialScreenFromSearch(`?screen=${screen}`)).toBe(screen);
    }
  });

  it("falls back safely for missing or unknown screens", () => {
    expect(initialScreenFromSearch("")).toBe("home");
    expect(initialScreenFromSearch("?screen=not-a-screen")).toBe("home");
    expect(initialScreenFromSearch("?screen=capture")).toBe("home");
  });

  it("does not confuse unrelated query parameters with a screen", () => {
    expect(initialScreenFromSearch("?campaign=radio&ref=home")).toBe("home");
    expect(initialScreenFromSearch("?ref=home&screen=daily")).toBe("daily");
  });
});
