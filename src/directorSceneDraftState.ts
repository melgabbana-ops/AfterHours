import type { DirectorSceneDraftInput } from "./directorSceneDraft";

export const DIRECTOR_SCENE_STARTER_STEPS = [
  "Aankomen en afstemmen",
  "Grenzen en signalen bevestigen",
  "Een gezamenlijke opdracht kiezen",
  "Aftercare en reflectie"
].join("\n");

const EMPTY_DRAFT: DirectorSceneDraftInput = {
  title: "",
  description: "",
  stepsText: ""
};

const STARTER_DRAFT: DirectorSceneDraftInput = {
  ...EMPTY_DRAFT,
  stepsText: DIRECTOR_SCENE_STARTER_STEPS
};

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

function sameDraft(left: DirectorSceneDraftInput, right: DirectorSceneDraftInput): boolean {
  const normalizedLeft = normalizeDraft(left);
  const normalizedRight = normalizeDraft(right);

  return normalizedLeft.title === normalizedRight.title
    && normalizedLeft.description === normalizedRight.description
    && normalizedLeft.stepsText === normalizedRight.stepsText;
}

export function hasUnsavedDirectorSceneChanges(
  current: DirectorSceneDraftInput,
  saved: DirectorSceneDraftInput | null = null,
  existingSceneExpected = false
): boolean {
  // The editor opens with a built-in starter outline. It is guidance, not a user edit.
  // A completely blank new draft is also clean.
  if (!saved && !existingSceneExpected) {
    return !sameDraft(current, EMPTY_DRAFT) && !sameDraft(current, STARTER_DRAFT);
  }

  // If a scene being edited disappears from the loaded list, fail closed and
  // keep the discard warning rather than silently treating its draft as new.
  if (!saved && existingSceneExpected) return true;

  return !sameDraft(current, saved ?? EMPTY_DRAFT);
}
