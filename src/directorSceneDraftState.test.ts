import { describe, expect, it } from "vitest";
import {
  DIRECTOR_SCENE_STARTER_STEPS,
  hasUnsavedDirectorSceneChanges
} from "./directorSceneDraftState";

const saved = {
  title: "The Golden Hour",
  description: "A calm shared scene.",
  stepsText: "Arrive together\nConfirm boundaries"
};

describe("Director's Room unsaved scene draft protection", () => {
  it("treats an empty new scene as clean", () => {
    expect(hasUnsavedDirectorSceneChanges({ title: "", description: "", stepsText: "" })).toBe(false);
  });

  it("treats the untouched starter outline as clean", () => {
    expect(hasUnsavedDirectorSceneChanges({
      title: "",
      description: "",
      stepsText: DIRECTOR_SCENE_STARTER_STEPS
    })).toBe(false);
  });

  it("detects content in a new scene draft", () => {
    expect(hasUnsavedDirectorSceneChanges({
      title: "New scene",
      description: "",
      stepsText: ""
    })).toBe(true);
  });

  it("detects edits made to the starter outline", () => {
    expect(hasUnsavedDirectorSceneChanges({
      title: "",
      description: "",
      stepsText: DIRECTOR_SCENE_STARTER_STEPS.replace("Aankomen", "Samen aankomen")
    })).toBe(true);
  });

  it("does not treat whitespace-only formatting changes as edits", () => {
    expect(hasUnsavedDirectorSceneChanges({
      title: " The Golden Hour ",
      description: " A calm shared scene. ",
      stepsText: " Arrive together \r\n\r\n Confirm boundaries "
    }, saved)).toBe(false);
  });

  it.each([
    { ...saved, title: "A different title" },
    { ...saved, description: "A different intention" },
    { ...saved, stepsText: "Arrive together\nA different step" }
  ])("detects changed saved scene content", (current) => {
    expect(hasUnsavedDirectorSceneChanges(current, saved)).toBe(true);
  });

  it("detects unsaved changes if the previously edited scene is no longer available", () => {
    expect(hasUnsavedDirectorSceneChanges(saved, null, true)).toBe(true);
  });
});
