import componentSource from "./AftercareMeditation.tsx?raw";
import stylesSource from "./AftercareMeditation.css?raw";
import { describe, expect, it } from "vitest";

describe("aftercare meditation stage controls", () => {
  it("offers a separate, localized control to skip the current optional stage", () => {
    expect(componentSource).toContain('className="aftercare-meditation-skip"');
    expect(componentSource).toContain('t("Sla deze stap over", "Skip this stage")');
    expect(componentSource).toContain("skipAftercareMeditationPhase(currentElapsed)");
    expect(componentSource).toContain("SkipForward aria-hidden={true}");
  });

  it("describes thirty minutes as a maximum and avoids claiming skipped time elapsed", () => {
    expect(componentSource).toContain('t("Begeleide meditatie · maximaal 30 minuten", "Guided meditation · up to 30 minutes")');
    expect(componentSource).toContain('t("De oefening is afgerond.');
    expect(componentSource).not.toContain("De 30 minuten zijn voorbij.");
  });

  it("keeps the skip control touch-sized and visibly keyboard-focusable", () => {
    expect(stylesSource).toContain(".aftercare-meditation-actions button{");
    expect(stylesSource).toContain("min-height:48px");
    expect(stylesSource).toContain(".aftercare-meditation button:focus-visible");
  });
});
