export const DIRECTOR_SCENE_LIMITS = {
  title: 80,
  description: 500,
  stepsText: 5000,
  steps: 40
} as const;

export type DirectorSceneDraftIssue =
  | "title-required"
  | "title-too-long"
  | "description-too-long"
  | "steps-text-too-long"
  | "steps-required"
  | "too-many-steps";

export type DirectorSceneDraftInput = {
  title: string;
  description: string;
  stepsText: string;
};

export type DirectorSceneDraftValidation =
  | { ok: true; value: { title: string; description: string; steps: string[] } }
  | { ok: false; reason: DirectorSceneDraftIssue };

export function validateDirectorSceneDraft(input: DirectorSceneDraftInput): DirectorSceneDraftValidation {
  const title = input.title.trim();
  if (!title) return { ok: false, reason: "title-required" };
  if (input.title.length > DIRECTOR_SCENE_LIMITS.title) return { ok: false, reason: "title-too-long" };
  if (input.description.length > DIRECTOR_SCENE_LIMITS.description) return { ok: false, reason: "description-too-long" };
  if (input.stepsText.length > DIRECTOR_SCENE_LIMITS.stepsText) return { ok: false, reason: "steps-text-too-long" };

  const steps = input.stepsText
    .split(/\r\n?|\n/)
    .map((step) => step.trim())
    .filter(Boolean);

  if (!steps.length) return { ok: false, reason: "steps-required" };
  if (steps.length > DIRECTOR_SCENE_LIMITS.steps) return { ok: false, reason: "too-many-steps" };

  return {
    ok: true,
    value: {
      title,
      description: input.description.trim(),
      steps
    }
  };
}
