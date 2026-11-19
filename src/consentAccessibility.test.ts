import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const consentSource = readFileSync(new URL("./ConsentScreen.tsx", import.meta.url), "utf8");

describe("consent screen accessibility", () => {
  it("groups all required acknowledgements in a labelled fieldset", () => {
    expect(consentSource).toMatch(/<fieldset[^>]*className="consent-checks"[^>]*aria-describedby="consent-checks-help"/);
    expect(consentSource).toMatch(/<fieldset[\\s\\S]*?<legend[^>]*>.*?<\\/legend>/);
    expect(consentSource).toContain('id="consent-checks-help"');
  });

  it("keeps each agreement as a native checkbox inside its label", () => {
    expect(consentSource).toContain('<input type="checkbox" checked={checks[index]}');
    expect(consentSource).toContain('<label className={"consent-check "+');
  });

  it("keeps the group heading and instructions available in Dutch and English", () => {
    expect(consentSource).toContain('t("Bevestig alle afspraken","Confirm all agreements")');
    expect(consentSource).toContain('t("Vink alle vier afspraken aan om verder te gaan.","Check all four agreements to continue.")');
  });

  it("still requires every consent acknowledgement before continuing", () => {
    expect(consentSource).toContain("const ready=checks.every(Boolean);");
    expect(consentSource).toContain("disabled={!ready}");
  });
});
