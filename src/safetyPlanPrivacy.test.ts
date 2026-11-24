import safetyPlanSource from "./SafetyPlan.tsx?raw";
import { describe, expect, it } from "vitest";

describe("safety signal privacy controls", () => {
  it("masks both personal signals by default", () => {
    expect(safetyPlanSource).toContain("const [showSafeword, setShowSafeword] = useState(false);");
    expect(safetyPlanSource).toContain("const [showAmberSignal, setShowAmberSignal] = useState(false);");
    expect(safetyPlanSource).toContain('type={showSafeword ? "text" : "password"}');
    expect(safetyPlanSource).toContain('type={showAmberSignal ? "text" : "password"}');
  });

  it("provides separate, localized reveal controls for STOP and PAUSE", () => {
    expect(safetyPlanSource).toContain('t("Toon stopwoord", "Show safeword")');
    expect(safetyPlanSource).toContain('t("Verberg stopwoord", "Hide safeword")');
    expect(safetyPlanSource).toContain('t("Toon pauzesignaal", "Show pause signal")');
    expect(safetyPlanSource).toContain('t("Verberg pauzesignaal", "Hide pause signal")');
    expect(safetyPlanSource).toContain("aria-pressed={showSafeword}");
    expect(safetyPlanSource).toContain("aria-pressed={showAmberSignal}");
  });

  it("keeps browser autofill and spell-checking away from the signal fields", () => {
    expect(safetyPlanSource.match(/autoComplete="off"/g)).toHaveLength(2);
    expect(safetyPlanSource.match(/spellCheck=\{false\}/g)).toHaveLength(2);
    expect(safetyPlanSource.match(/aria-describedby="safety-signals-help"/g)).toHaveLength(2);
  });

  it("re-hides both signals after a successful save or clear", () => {
    expect(safetyPlanSource.match(/setShowSafeword\(false\)/g)).toHaveLength(2);
    expect(safetyPlanSource.match(/setShowAmberSignal\(false\)/g)).toHaveLength(2);
  });


  it("requires a second explicit action before permanently clearing the local safety plan", () => {
    expect(safetyPlanSource).toContain("const [confirmClear, setConfirmClear] = useState(false);");
    expect(safetyPlanSource).toContain("if (!confirmClear) {");
    expect(safetyPlanSource).toContain('t("Definitief wissen", "Confirm deletion")');
    expect(safetyPlanSource).toContain('t("Verwijderen geannuleerd. Je veiligheidsafspraken zijn behouden.", "Deletion cancelled. Your safety agreements were kept.")');
    expect(safetyPlanSource).toContain("setConfirmClear(false);");
  });

  it("explains that signals are hidden on screen but remain local to the device", () => {
    expect(safetyPlanSource).toContain("De signalen zijn standaard verborgen op het scherm.");
    expect(safetyPlanSource).toContain("Signals are hidden on screen by default.");
    expect(safetyPlanSource).toContain("Ze worden niet naar de server gestuurd.");
    expect(safetyPlanSource).toContain("They are not sent to the server.");
  });
});
