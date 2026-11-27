import type { DirectorSceneDraftInput } from "./directorSceneDraft";

function normalizeDraft(input: DirectorSceneDraftInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    stepsText: input.stepsText
      .split(/\r\n?|\n/)
      .map((step) => step.trim())
      .filter(Boolean)
      .join("\n")
  };
}

export function hasUnsavedDirectorSceneChanges(
  current: DirectorSceneDraftInput,
  saved: DirectorSceneDraftInput | null = null
): boolean {
  const normalizedCurrent = normalizeDraft(current);
  const normalizedSaved = saved
    ? normalizeDraft(saved)
    : { title: "", description: "", stepsText: "" };

  return normalizedCurrent.title !== normalizedSaved.title
    || normalizedCurrent.description !== normalizedSaved.description
    || normalizedCurrent.stepsText !== normalizedSaved.stepsText;
}
