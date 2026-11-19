import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = [
  "src/approved-cinematic.css",
  "src/reference-home.css",
  "src/reference-pages.css",
].map((path) => readFileSync(resolve(root, path), "utf8")).join("\n");
const serviceWorker = readFileSync(resolve(root, "public/sw.js"), "utf8");
const insightsSource = readFileSync(resolve(root, "src/Insights.tsx"), "utf8");
const mainSource = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const teaserSource = readFileSync(resolve(root, "src/Teaser.tsx"), "utf8");
const onboardingSource = readFileSync(resolve(root, "src/Onboarding.tsx"), "utf8");

const mappings = [
  { selector: ".game-select-screen:before", asset: "reference-experience.svg" },
  { selector: ".ah-session-screen:before", asset: "reference-experience.svg" },
  { selector: ".aftercare-screen:before", asset: "reference-aftercare.svg" },
  { selector: ".completion-screen:before", asset: "reference-completion.svg" },
  { selector: ".ah-profile-screen:before", asset: "reference-profile.svg" },
  { selector: ".consent-screen:before", asset: "reference-consent.svg" },
  { selector: ".insights:before", asset: "reference-tarot.svg" },
  { selector: ".insights.insights-astro:before", asset: "reference-horoscope.svg" },
  { selector: ".radio-room:before", asset: "reference-radio.svg" },
  { selector: ".aftercare-card{", asset: "reference-aftercare.svg" },
  { selector: ".completion-card", asset: "reference-completion.svg" },
  { selector: ".insights .tarot-card", asset: "reference-tarot.svg" },
  { selector: ".insights .astro-card", asset: "reference-horoscope.svg" },
  { selector: ".radio-hero,.radio-player,.radio-note{", asset: "reference-radio.svg" },
];

const precachedAssets = [
  "reference-home.svg",
  "reference-consent.svg",
  "reference-experience.svg",
  "reference-aftercare.svg",
  "reference-completion.svg",
  "reference-tarot.svg",
  "reference-horoscope.svg",
  "reference-radio.svg",
  "reference-profile.svg",
];

function ruleFor(selector) {
  const index = css.lastIndexOf(selector);
  if (index < 0) return "";
  const start = css.lastIndexOf("}", index) + 1;
  const end = css.indexOf("}", index);
  return css.slice(start, end + 1);
}

describe("AFTER HOURS screen-specific artwork", () => {
  it.each(mappings)("maps $selector to $asset", ({ selector, asset }) => {
    expect(ruleFor(selector)).toContain(`/AfterHours/visuals/${asset}`);
  });

  it("uses the black-and-gold home artwork on the home screen, teaser and onboarding", () => {
    expect(mainSource).toContain("visuals/reference-home.svg");
    expect(teaserSource).toContain("visuals/reference-home.svg");
    expect(onboardingSource).toContain("visuals/reference-home.svg");
  });

  it("switches the Insights backdrop with the selected tab", () => {
    expect(insightsSource).toContain('className={`insights insights-${tab}`}');
  });

  it("ships every screen artwork asset with the service worker shell", () => {
    expect(serviceWorker).toContain('const CACHE_NAME = "after-hours-v20";');
    for (const asset of precachedAssets) {
      expect(serviceWorker).toContain(`asset("visuals/${asset}")`);
    }
  });

  it("keeps every dedicated screen artwork on a 4K canvas", () => {
    for (const asset of precachedAssets) {
      const svg = readFileSync(resolve(root, "public/visuals", asset), "utf8");
      expect(svg).toMatch(/<svg[^>]*width="3840"[^>]*height="2160"[^>]*viewBox="0 0 3840 2160"/);
    }
  });
});
