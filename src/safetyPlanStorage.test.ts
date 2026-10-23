import { describe, expect, it } from "vitest";
import {
  clearSafetyPlan,
  createEmptySafetyPlan,
  normalizeSafetyPlan,
  readSafetyPlan,
  SAFETY_PLAN_STORAGE_KEY,
  writeSafetyPlan,
} from "./safetyPlanStorage";

function makeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    values,
  };
}

describe("safety plan storage", () => {
  it("returns independent empty readiness objects", () => {
    const first = createEmptySafetyPlan();
    first.readiness.consentDiscussed = true;
    expect(createEmptySafetyPlan().readiness.consentDiscussed).toBe(false);
  });

  it("normalizes malformed input without trusting unsafe field types", () => {
    expect(normalizeSafetyPlan({
      safeword: 42,
      amberSignal: "A".repeat(100),
      boundaries: "B".repeat(1200),
      readiness: { consentDiscussed: "yes", signalsDiscussed: true },
    })).toEqual({
      safeword: "",
      amberSignal: "A".repeat(80),
      boundaries: "B".repeat(1000),
      readiness: {
        consentDiscussed: false,
        signalsDiscussed: true,
        aftercareDiscussed: false,
      },
    });
  });

  it("reads and normalizes saved JSON", () => {
    const storage = makeStorage({
      [SAFETY_PLAN_STORAGE_KEY]: JSON.stringify({
        safeword: " RED ",
        readiness: { aftercareDiscussed: true },
      }),
    });
    expect(readSafetyPlan(storage)).toMatchObject({
      safeword: " RED ",
      amberSignal: "",
      boundaries: "",
      readiness: {
        consentDiscussed: false,
        signalsDiscussed: false,
        aftercareDiscussed: true,
      },
    });
  });

  it("falls back safely for invalid JSON or unavailable storage", () => {
    expect(readSafetyPlan(makeStorage({ [SAFETY_PLAN_STORAGE_KEY]: "{" }))).toEqual(createEmptySafetyPlan());
    expect(readSafetyPlan({ getItem: () => { throw new Error("blocked"); } })).toEqual(createEmptySafetyPlan());
    expect(readSafetyPlan()).toEqual(createEmptySafetyPlan());
  });

  it("trims fields on save and round-trips them through local storage", () => {
    const storage = makeStorage();
    expect(writeSafetyPlan({
      safeword: " RED ",
      amberSignal: " AMBER ",
      boundaries: "  Ask first  ",
      readiness: { consentDiscussed: true, signalsDiscussed: true, aftercareDiscussed: false },
    }, storage)).toBe(true);
    expect(JSON.parse(storage.values.get(SAFETY_PLAN_STORAGE_KEY)!)).toEqual({
      safeword: "RED",
      amberSignal: "AMBER",
      boundaries: "Ask first",
      readiness: { consentDiscussed: true, signalsDiscussed: true, aftercareDiscussed: false },
    });
    expect(readSafetyPlan(storage).safeword).toBe("RED");
  });

  it("returns false rather than throwing when saving or clearing fails", () => {
    expect(writeSafetyPlan(createEmptySafetyPlan(), { setItem: () => { throw new Error("blocked"); } })).toBe(false);
    expect(clearSafetyPlan({ removeItem: () => { throw new Error("blocked"); } })).toBe(false);
  });

  it("clears only this app's safety-plan key", () => {
    const storage = makeStorage({
      [SAFETY_PLAN_STORAGE_KEY]: "saved-plan",
      unrelated: "leave-me",
    });
    expect(clearSafetyPlan(storage)).toBe(true);
    expect(storage.values.has(SAFETY_PLAN_STORAGE_KEY)).toBe(false);
    expect(storage.values.get("unrelated")).toBe("leave-me");
  });
});
