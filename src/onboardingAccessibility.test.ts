import { describe, expect, it } from "vitest";
import onboardingSource from "./Onboarding.tsx?raw";

describe("onboarding accessibility", () => {
  it("exposes the four-step progress indicator as a labelled list", () => {
    expect(onboardingSource).toContain('role="list"');
    expect(onboardingSource).toContain('aria-label={t("Voortgang introductie", "Introduction progress")}');
    expect(onboardingSource).toContain('role="listitem"');
    expect(onboardingSource).toContain('aria-label={t(`Stap ${index + 1} van 4`, `Step ${index + 1} of 4`)}');
    expect(onboardingSource).toContain('aria-current={index === step ? "step" : undefined}');
  });

  it("announces the active platform in the installation selector", () => {
    expect(onboardingSource).toContain('role="group" aria-label={t("Kies je apparaat", "Choose your device")}');
    expect(onboardingSource).toContain('aria-pressed={platform === "iphone"}');
    expect(onboardingSource).toContain('aria-pressed={platform === "android"}');
  });

  it("keeps platform selection and navigation as native buttons", () => {
    expect(onboardingSource).toContain('<button type="button" className={platform === "iphone"');
    expect(onboardingSource).toContain('<button type="button" className={platform === "android"');
    expect(onboardingSource).toContain('className="onboarding-back"');
    expect(onboardingSource).toContain('className="onboarding-next"');
  });

  it("preserves the bilingual iPhone and Android installation instructions", () => {
    expect(onboardingSource).toContain('Open AFTER HOURS in Safari.');
    expect(onboardingSource).toContain('Open AFTER HOURS in Chrome.');
    expect(onboardingSource).toContain('Kies ‘Zet op beginscherm’.');
    expect(onboardingSource).toContain('Kies ‘App installeren’ of ‘Toevoegen aan startscherm’.');
  });
});
