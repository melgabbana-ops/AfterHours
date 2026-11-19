import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/reference-pages.css"), "utf8");
const main = readFileSync(resolve(process.cwd(), "src/main.tsx"), "utf8");

const photoFallbacks = [
  [".ah-reference-home .hero.home-hero", "bc8725cb-2e53-4c72-8cc0-e953ea8894ad.png", "reference-home.svg"],
  [".consent-screen:before,.consent-screen .consent-visual", "ee9b2312-7f4d-4299-b241-d3e16982fa36.png", "reference-consent.svg"],
  [".aftercare-screen:before,.aftercare-card", "e8f4402a-7e90-4143-8149-9bec98ab3241.png", "reference-aftercare.svg"],
  [".completion-screen:before,.completion-card", "f8a86f1b-af63-4831-bdc7-75741d1f1131.png", "reference-completion.svg"],
  [".ah-profile-screen:before,.ah-profile-screen .profile", "f8a86f1b-af63-4831-bdc7-75741d1f1131.png", "reference-profile.svg"],
  [".radio-room:before,.radio-hero,.radio-player,.radio-note", "5dbe1964-e376-4d2a-b693-1b06392abd82.png", "reference-radio.svg"],
  [".insights:before,.insights .insights-hero,.insights .tarot-card", "fad8c8e3-1edc-4ec5-96ea-40a5486e4128.png", "reference-tarot.svg"],
  [".insights.insights-astro:before,.insights .astro-card", "fad8c8e3-1edc-4ec5-96ea-40a5486e4128.png", "reference-horoscope.svg"],
  [".game-select-screen:before,.ah-session-screen:before,.experience-choice", "ee9b2312-7f4d-4299-b241-d3e16982fa36.png", "reference-experience.svg"],
];

function lastRule(selector) {
  const start = css.lastIndexOf(selector);
  if (start < 0) return "";
  const end = css.indexOf("}", start);
  return css.slice(start, end + 1);
}

describe("offline-safe editorial photography", () => {
  it.each(photoFallbacks)("keeps a bundled fallback for %s", (selector, remoteAsset, localAsset) => {
    const rule = lastRule(selector);
    expect(rule).toContain(remoteAsset);
    expect(rule).toContain(`/AfterHours/visuals/${localAsset}`);
  });

  it("falls back from the profile portrait to bundled artwork when the image host fails", () => {
    expect(main).toContain("event.currentTarget.onerror=null");
    expect(main).toContain("visuals/reference-profile.svg");
  });
});
