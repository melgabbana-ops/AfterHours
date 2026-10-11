import { describe, expect, it } from "vitest";
import { renderText } from "./SocialStudio";

describe("social copy templates", () => {
  it.each(["Instagram", "TikTok", "Facebook", "YouTube", "X", "Pinterest", "Threads", "Website"] as const)(
    "renders non-empty copy for %s",
    (platform) => {
      const value = renderText(platform, "POST", "en", "YOUR NIGHT", "Consent-first copy", "Follow progress");
      expect(value).toContain("YOUR NIGHT");
      expect(value).toContain("Consent-first copy");
      expect(value).toContain("Follow progress");
    },
  );

  it("keeps story and cover formats compact", () => {
    expect(renderText("Instagram", "STORY", "en", "AFTER HOURS", "Under construction", "Soon")).toBe("AFTER HOURS\nUnder construction\nSoon");
    expect(renderText("Instagram", "REEL COVER", "nl", "AFTER HOURS", "JOUW REGELS", "BINNENKORT")).not.toContain("#AFTERHOURS");
  });

  it("uses platform-specific website and X copy formats", () => {
    expect(renderText("Website", "POST", "nl", "KOP", "BERICHT", "CTA")).toBe("KOP\n\nBERICHT\n\nCTA");
    expect(renderText("X", "POST", "nl", "KOP", "BERICHT", "CTA")).toContain("#AfterHours");
  });
});
