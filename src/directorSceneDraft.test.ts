import { describe, expect, it } from "vitest";
import { validateDirectorSceneDraft } from "./directorSceneDraft";

describe("Director's Room scene draft validation", () => {
  it("trims the title, description and steps while supporting Windows line endings", () => {
    expect(validateDirectorSceneDraft({
      title: "  The Golden Hour  ",
      description: "  A calm shared scene.  ",
      stepsText: "  Arrive together  \r\n\r\n Confirm boundaries \r\n"
    })).toEqual({
      ok: true,
      value: {
        title: "The Golden Hour",
        description: "A calm shared scene.",
        steps: ["Arrive together", "Confirm boundaries"]
      }
    });
  });

  it("accepts exactly 40 non-empty steps", () => {
    const stepsText = Array.from({ length: 40 }, (_, index) => `Step ${index + 1}`).join("\n");
    const result = validateDirectorSceneDraft({ title: "Forty steps", description: "", stepsText });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.steps).toHaveLength(40);
  });

  it("rejects a 41st non-empty step instead of silently truncating the scene", () => {
    const stepsText = Array.from({ length: 41 }, (_, index) => `Step ${index + 1}`).join("\n");

    expect(validateDirectorSceneDraft({ title: "Too many", description: "", stepsText }))
      .toEqual({ ok: false, reason: "too-many-steps" });
  });

  it.each([
    [{ title: "   ", description: "", stepsText: "One step" }, "title-required"],
    [{ title: "x".repeat(81), description: "", stepsText: "One step" }, "title-too-long"],
    [{ title: "Scene", description: "x".repeat(501), stepsText: "One step" }, "description-too-long"],
    [{ title: "Scene", description: "", stepsText: "x".repeat(5001) }, "steps-text-too-long"],
    [{ title: "Scene", description: "", stepsText: "  \n  \r\n " }, "steps-required"]
  ] as const)("rejects invalid scene draft input", (input, reason) => {
    expect(validateDirectorSceneDraft(input)).toEqual({ ok: false, reason });
  });
});
