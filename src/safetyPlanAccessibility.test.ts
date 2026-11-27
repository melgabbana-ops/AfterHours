import safetyPlanSource from "./SafetyPlan.tsx?raw";
import { describe, expect, it } from "vitest";

describe("safety readiness accessibility", () => {
  it("exposes checklist completion as a localized semantic progress bar", () => {
    const start = safetyPlanSource.indexOf('<div className="safety-readiness-meter"');
    const end = safetyPlanSource.indexOf(">", start);
    const meter = safetyPlanSource.slice(start, end + 1);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(meter).toContain('role="progressbar"');
    expect(meter).toContain('aria-label={t("Voortgang veiligheidscheck", "Safety check progress")}');
    expect(meter).toContain("aria-valuemin={0}");
    expect(meter).toContain("aria-valuemax={3}");
    expect(meter).toContain("aria-valuenow={readinessCount}");
    expect(meter).toContain('aria-valuetext={t(readinessCount + " van 3 punten afgevinkt", readinessCount + " of 3 items checked")}');
  });

  it("keeps the readiness meter tied to the three existing preparation checks", () => {
    expect(safetyPlanSource).toContain("const readinessCount = Object.values(plan.readiness).filter(Boolean).length;");
    expect(safetyPlanSource).toContain("plan.readiness.consentDiscussed");
    expect(safetyPlanSource).toContain("plan.readiness.signalsDiscussed");
    expect(safetyPlanSource).toContain("plan.readiness.aftercareDiscussed");
  });
});
