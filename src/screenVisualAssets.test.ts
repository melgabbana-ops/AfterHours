import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(resolve(root, "src/approved-cinematic.css"), "utf8");
const serviceWorker = readFileSync(resolve(root, "public/sw.js"), "utf8");
const insightsSource = readFileSync(resolve(root, "src/Insights.tsx"), "utf8");
const marker = "/* AFTER HOURS page-specific visual art mapping.";
const markerIndex = css.lastIndexOf(marker);
const pageArtCss = markerIndex >= 0 ? css.slice(markerIndex + marker.length) : "";

const mappings = [
  { selector: ".game-select-screen:before", asset: "ah-experience-photo.svg" },
  { selector: ".ah-session-screen:before", asset: "ah-experience-photo.svg" },
  { selector: ".aftercare-screen:before", asset: "ah-aftercare-photo.svg" },
  { selector: ".completion-screen:before", asset: "ah-completion-photo.svg" },
  { selector: ".ah-profile-screen:before", asset: "ah-profile-photo.svg" },
  { selector: ".insights:before", asset: "ah-tarot-photo.svg" },
  { selector: ".insights.insights-astro:before", asset: "ah-horoscope-photo.svg" },
  { selector: ".radio-room:before", asset: "ah-radio-photo.svg" },
  { selector: ".experience-choice:before", asset: "ah-experience-photo.svg" },
  { selector: ".aftercare-screen .aftercare-card", asset: "ah-aftercare-photo.svg" },
  { selector: ".completion-screen .completion-card", asset: "ah-completion-photo.svg" },
  { selector: ".app .insights .tarot-card", asset: "ah-tarot-photo.svg" },
  { selector: ".app .insights .astro-card", asset: "ah-horoscope-photo.svg" },
  { selector: ".app .radio-room .radio-player", asset: "ah-radio-photo.svg" },
  { selector: ".app .ah-tarot-card", asset: "ah-tarot-frame.svg" },
  { selector: ".app .radio-disc", asset: "ah-radio-vinyl.svg" },
];

const precachedAssets = [
  "ah-experience-photo.svg",
  "ah-aftercare-photo.svg",
  "ah-completion-photo.svg",
  "ah-horoscope-photo.svg",
  "ah-profile-photo.svg",
  "ah-radio-photo.svg",
  "ah-tarot-photo.svg",
  "ah-radio-vinyl.svg",
  "ah-tarot-frame.svg",
];

function ruleFor(selector: string): string {
  const index = pageArtCss.indexOf(selector);
  if (index < 0) return "";
  const start = pageArtCss.lastIndexOf("}", index) + 1;
  const end = pageArtCss.indexOf("}", index);
  return pageArtCss.slice(start, end + 1);
}

describe("AFTER HOURS page-specific visual assets", () => {
  it.each(mappings)("maps $selector to $asset", ({ selector, asset }) => {
    expect(ruleFor(selector)).toContain(`/AfterHours/visuals/${asset}`);
  });

  it("switches the Insights backdrop with the selected tab", () => {
    expect(insightsSource).toContain('className={`insights insights-${tab}`}');
  });

  it("ships every page-specific artwork asset with the service worker shell", () => {
    expect(serviceWorker).toContain('const CACHE_NAME = "after-hours-v17";');
    for (const asset of precachedAssets) {
      expect(serviceWorker).toContain(`asset("visuals/${asset}")`);
    }
  });

  it("keeps the wide page artwork on a 4K canvas", () => {
    const wideAssets = [
      "ah-experience-photo.svg",
      "ah-aftercare-photo.svg",
      "ah-completion-photo.svg",
      "ah-horoscope-photo.svg",
      "ah-profile-photo.svg",
      "ah-radio-photo.svg",
      "ah-tarot-photo.svg",
    ];
    for (const asset of wideAssets) {
      const svg = readFileSync(resolve(root, "public/visuals", asset), "utf8");
      expect(svg).toMatch(/<svg[^>]*width="3840"[^>]*height="2160"[^>]*viewBox="0 0 3840 2160"/);
    }
  });
});
