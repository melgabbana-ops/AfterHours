import { describe, expect, it } from "vitest";
import { initialScreenFromSearch, shouldShowTeaser } from "./navigation";
import manifestText from "../public/manifest.webmanifest?raw";

describe("initialScreenFromSearch", () => {
  it("opens every supported direct-link screen", () => {
    const screens = [
      "game", "gameSelect", "complete", "profile", "admin", "insights", "radio",
      "aftercare", "prompts", "safety", "store", "onboarding", "controlroom",
      "missions", "legal", "social", "lovense", "daily", "capture", "cinematic", "couples", "kinktest",
    ];
    for (const screen of screens) {
      expect(initialScreenFromSearch(`?screen=${screen}`)).toBe(screen);
    }
  });

  it("opens private couple-room invitations directly in duo play", () => {
    expect(initialScreenFromSearch("?couple=ABCD2345XY")).toBe("couples");
  });

  it("falls back safely for missing or unknown screens", () => {
    expect(initialScreenFromSearch("")).toBe("home");
    expect(initialScreenFromSearch("?screen=not-a-screen")).toBe("home");
  });

  it("keeps every installed-app shortcut mapped to a supported screen", async () => {
    const manifest = JSON.parse(manifestText) as { shortcuts: Array<{ url: string }> };
    for (const shortcut of manifest.shortcuts) {
      const url = new URL(shortcut.url, "https://after-hours.example");
      expect(initialScreenFromSearch(url.search)).not.toBe("home");
    }
  });

  it("does not confuse unrelated query parameters with a screen", () => {
    expect(initialScreenFromSearch("?campaign=radio&ref=home")).toBe("home");
    expect(initialScreenFromSearch("?ref=home&screen=daily")).toBe("daily");
  });
});


describe("shouldShowTeaser", () => {
  it("shows the promotional landing only when explicitly requested", () => {
    expect(shouldShowTeaser("?teaser=1")).toBe(true);
    expect(shouldShowTeaser("")).toBe(false);
    expect(shouldShowTeaser("?enter=1")).toBe(false);
    expect(shouldShowTeaser("?screen=radio")).toBe(false);
    expect(shouldShowTeaser("?screen=profile")).toBe(false);
    expect(shouldShowTeaser("?maintenance=1")).toBe(false);
  });
});


describe("Kink Profile deep link", () => {
  it("opens the Kink Profile test from a direct link", () => {
    expect(initialScreenFromSearch("?screen=kinktest")).toBe("kinktest");
  });
});
