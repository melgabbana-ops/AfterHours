import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const world = readFileSync(new URL("../src/CinematicWorld.tsx", import.meta.url), "utf8");

describe("Director's Room draft navigation safety", () => {
  it("asks before leaving the private world with unsaved scene changes", () => {
    const start = world.indexOf("async function handleBack()");
    const end = world.indexOf("async function saveDirectorScene()", start);
    const handler = world.slice(start, end);
    const guard = handler.indexOf("if (!confirmDiscardSceneDraft()) return;");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(guard).toBeGreaterThanOrEqual(0);
    expect(guard).toBeLessThan(handler.indexOf("startAttemptRef.current += 1;"));
    expect(guard).toBeLessThan(handler.indexOf("onBack();"));
  });

  it("bases the discard prompt on the normalized unsaved-draft state", () => {
    const start = world.indexOf("function confirmDiscardSceneDraft()");
    const end = world.indexOf("function startNewScene()", start);
    const guard = world.slice(start, end);
    expect(guard).toContain("if (!sceneDraftDirty) return true;");
    expect(guard).toContain("window.confirm(");
  });
});
