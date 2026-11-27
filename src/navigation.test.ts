import { describe, expect, it } from "vitest";
import { initialScreenFromSearch, shouldShowTeaser } from "./navigation";
import manifestText from "../public/manifest.webmanifest?raw";

describe("initialScreenFromSearch", () => {
  it("opens every supported direct-link screen", () => {
    const screens = [
      "game", "gameSelect", "complete", "profile", "admin", "insights", "radio",
      "aftercare", "prompts", "safety", "store", "onboarding", "controlroom",
      "missions", "legal", "social", "lovense", "daily", "capture", "cinematic", "couples",
    ];
    for (const screen of screens) {
      expect(initialScreenFromSearch(`?screen=${screen}`)).toBe(screen);
    }
  });

  it("opens private couple-room invitations directly in duo play", () => {
    expect(initialScreenFromSearch("?couple=ABCD2345XY")).toBe("couples");
    expect(initialScreenFromSearch("?stop=1")).toBe("safety");
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
  it("shows the cinematic intro on a normal cold launch", () => {
    expect(shouldShowTeaser("")).toBe(true);
    expect(shouldShowTeaser("?campaign=radio&ref=home")).toBe(true);
    expect(shouldShowTeaser("?teaser=1")).toBe(true);
  });

  it("never blocks direct navigation or explicit entry", () => {
    for (const search of [
      "?enter=1", "?screen=radio", "?screen=profile", "?screen=safety",
      "?screen=aftercare", "?couple=ABCD2345XY", "?maintenance=1",
      "?stop=1", "?safeword=1", "?pause=1", "?screen=consent",
    ]) {
      expect(shouldShowTeaser(search)).toBe(false);
    }
  });

  it("never puts the intro in front of an active safety state", () => {
    expect(shouldShowTeaser("", true)).toBe(false);
    expect(shouldShowTeaser("?teaser=1", true)).toBe(false);
  });
});
