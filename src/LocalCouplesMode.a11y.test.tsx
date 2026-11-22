import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LocalCouplesMode from "./LocalCouplesMode";

describe("Local Couples Mode accessibility", () => {
  it("associates each participant name and consent control with its own label", () => {
    const markup = renderToStaticMarkup(createElement(LocalCouplesMode, {
      language: "nl",
      consentActive: true,
      onSafetyPause: () => undefined,
      onSafetyResume: () => undefined,
      onSafetyStop: () => undefined,
    }));

    expect(markup).toContain('role="group" aria-label="Deelnemers en afzonderlijke toestemming"');
    for (const participant of [1, 2]) {
      expect(markup).toContain('for="cw-local-name-' + participant + '"');
      expect(markup).toContain('id="cw-local-name-' + participant + '"');
      expect(markup).toContain('for="cw-local-consent-' + participant + '"');
      expect(markup).toContain('id="cw-local-consent-' + participant + '"');
      const consentInput = markup.match(new RegExp('<input id="cw-local-consent-' + participant + '"[^>]*>'))?.[0] ?? "";
      expect(consentInput).not.toContain('disabled=""');
    }
    expect(markup.match(/<label\b/g) ?? []).toHaveLength(4);
    expect(markup).not.toMatch(/<label\b[^>]*>(?:(?!<\/label>)[\s\S])*<label\b/);
  });


  it("keeps participant consent controls disabled until app-wide consent is active", () => {
    const markup = renderToStaticMarkup(createElement(LocalCouplesMode, {
      language: "nl",
      consentActive: false,
      onSafetyPause: () => undefined,
      onSafetyResume: () => undefined,
      onSafetyStop: () => undefined,
    }));

    for (const participant of [1, 2]) {
      const consentInput = markup.match(new RegExp('<input id="cw-local-consent-' + participant + '"[^>]*>'))?.[0] ?? "";
      expect(consentInput).toContain('disabled=""');
    }
  });
});
