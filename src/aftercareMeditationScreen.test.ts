import componentSource from "./AftercareMeditation.tsx?raw";
import { describe, expect, it } from "vitest";

describe("aftercare meditation stage controls", () => {
  it("offers a separate, localized control to skip the current optional stage", () => {
    expect(componentSource).toContain('className="aftercare-meditation-skip"');
    expect(componentSource).toContain('t("Sla deze stap over", "Skip this stage")');
    expect(componentSource).toContain("skipAftercareMeditationPhase(currentElapsed)");
    expect(componentSource).toContain('SkipForward aria-hidden="true"');
  });

  it("describes thirty minutes as a maximum and avoids claiming skipped time elapsed", () => {
    expect(componentSource).toContain('t("Begeleide meditatie · maximaal 30 minuten", "Guided meditation · up to 30 minutes")');
    expect(componentSource).toContain('t("De oefening is afgerond.');
    expect(componentSource).not.toContain("De 30 minuten zijn voorbij.");
  });

  it("exposes the skip as a non-submitting control only before completion", () => {
    expect(componentSource).toContain('<button type="button" className="aftercare-meditation-skip" onClick={skipCurrentPhase}>');
    expect(componentSource).toContain("{!completed && (");
  });

  it("provides a localized, machine-readable countdown without a noisy live announcement", () => {
    expect(componentSource).toContain("getAftercareMeditationAccessibleTime(remainingSeconds, language)");
    expect(componentSource).toContain("dateTime={`PT${remainingSeconds}S`}");
    expect(componentSource).toContain("aria-label={getAftercareMeditationAccessibleTime");
    const clockMarkup = componentSource.split('className="aftercare-meditation-clock"')[1]?.split("</div>")[0] ?? "";
    expect(clockMarkup).not.toContain("aria-live");
  });
  it("restores the timer after a tab reload without auto-starting it", () => {
    expect(componentSource).toContain("loadAftercareMeditationProgress(window.sessionStorage)");
    expect(componentSource).toContain("saveAftercareMeditationProgress(window.sessionStorage, elapsedSeconds)");
    expect(componentSource).toContain("clearAftercareMeditationProgress(window.sessionStorage)");
    expect(componentSource).toContain("Bij het sluiten van de tab kan de voortgang verdwijnen.");
    expect(componentSource).toContain("Closing the tab may clear that progress.");
    expect(componentSource).toContain("const [running, setRunning] = useState(false)");
  });

});
