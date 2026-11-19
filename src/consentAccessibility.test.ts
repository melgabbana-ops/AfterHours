import consentSource from "./ConsentScreen.tsx?raw";
import { describe, expect, it } from "vitest";

describe("consent screen accessibility", () => {
  it("groups the required acknowledgements in a labelled fieldset", () => {
    const fieldsetStart = consentSource.indexOf('<fieldset className="consent-checks"');
    const legendStart = consentSource.indexOf("<legend", fieldsetStart);
    const legendEnd = consentSource.indexOf("</legend>", legendStart);
    expect(fieldsetStart).toBeGreaterThanOrEqual(0);
    expect(legendStart).toBeGreaterThan(fieldsetStart);
    expect(legendEnd).toBeGreaterThan(legendStart);
    expect(consentSource).toContain('id="consent-checks-help"');
  });

  it("keeps each agreement as a native checkbox inside its label", () => {
    expect(consentSource).toContain('<input type="checkbox" checked={checks[index]}');
    expect(consentSource).toContain('<label className={"consent-check "+');
  });

  it("provides Dutch and English group instructions", () => {
    expect(consentSource).toContain('t("Bevestig alle afspraken","Confirm all agreements")');
    expect(consentSource).toContain('t("Vink alle vier afspraken aan om verder te gaan.","Check all four agreements to continue.")');
  });

  it("still requires all four acknowledgements before consent can continue", () => {
    expect(consentSource).toContain("const ready=checks.every(Boolean);");
    expect(consentSource).toContain("disabled={!ready}");
  });

  it("preserves the explicit STOP, PAUZE and consent-withdrawal guidance", () => {
    expect(consentSource).toContain("STOP betekent direct stoppen.");
    expect(consentSource).toContain("PAUZE betekent vertragen en opnieuw afstemmen.");
    expect(consentSource).toContain("Toestemming kan altijd worden ingetrokken.");
  });

});
