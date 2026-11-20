import { describe, expect, it } from "vitest";
import {
  clearSafetyPlan,
  createEmptySafetyPlan,
  getSafetyPlanStorageKey,
  hasUnscopedSafetyPlan,
  LEGACY_SAFETY_PLAN_STORAGE_KEY,
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

const samplePlan = {
  safeword: "RED",
  amberSignal: "AMBER",
  boundaries: "Ask first",
  readiness: { consentDiscussed: true, signalsDiscussed: true, aftercareDiscussed: false },
};

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

  it("uses a distinct, encoded key for each app profile", () => {
    expect(SAFETY_PLAN_STORAGE_KEY).toBe(getSafetyPlanStorageKey("local-profile"));
    expect(getSafetyPlanStorageKey("account/one")).not.toBe(getSafetyPlanStorageKey("account/two"));
    expect(getSafetyPlanStorageKey("account/one")).toContain("account%2Fone");
    expect(getSafetyPlanStorageKey("   ")).toBe(SAFETY_PLAN_STORAGE_KEY);
  });

  it("keeps plans isolated between profiles", () => {
    const storage = makeStorage();
    expect(writeSafetyPlan(samplePlan, "account-one", storage)).toBe(true);

    expect(readSafetyPlan("account-one", storage)).toEqual(samplePlan);
    expect(readSafetyPlan("account-two", storage)).toEqual(createEmptySafetyPlan());
  });

  it("does not auto-import an unscoped legacy plan into any profile", () => {
    const storage = makeStorage({
      [LEGACY_SAFETY_PLAN_STORAGE_KEY]: JSON.stringify(samplePlan),
    });

    expect(hasUnscopedSafetyPlan(storage)).toBe(true);
    expect(readSafetyPlan("account-one", storage)).toEqual(createEmptySafetyPlan());
    expect(readSafetyPlan("local-profile", storage)).toEqual(createEmptySafetyPlan());
    expect(storage.values.get(LEGACY_SAFETY_PLAN_STORAGE_KEY)).toBe(JSON.stringify(samplePlan));
  });

  it("reads and normalizes saved JSON for the local profile", () => {
    const storage = makeStorage({
      [SAFETY_PLAN_STORAGE_KEY]: JSON.stringify({
        safeword: " RED ",
        readiness: { aftercareDiscussed: true },
      }),
    });
    expect(readSafetyPlan("local-profile", storage)).toMatchObject({
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
    expect(readSafetyPlan("local-profile", makeStorage({ [SAFETY_PLAN_STORAGE_KEY]: "{" }))).toEqual(createEmptySafetyPlan());
    expect(readSafetyPlan("local-profile", { getItem: () => { throw new Error("blocked"); } })).toEqual(createEmptySafetyPlan());
    expect(readSafetyPlan()).toEqual(createEmptySafetyPlan());
    expect(hasUnscopedSafetyPlan({ getItem: () => { throw new Error("blocked"); } })).toBe(false);
  });

  it("trims fields on save and round-trips them through local storage", () => {
    const storage = makeStorage();
    expect(writeSafetyPlan({
      safeword: " RED ",
      amberSignal: " AMBER ",
      boundaries: "  Ask first  ",
      readiness: { consentDiscussed: true, signalsDiscussed: true, aftercareDiscussed: false },
    }, "local-profile", storage)).toBe(true);
    expect(JSON.parse(storage.values.get(SAFETY_PLAN_STORAGE_KEY)!)).toEqual(samplePlan);
    expect(readSafetyPlan("local-profile", storage).safeword).toBe("RED");
  });

  it("returns false rather than throwing when saving or clearing fails", () => {
    expect(writeSafetyPlan(createEmptySafetyPlan(), "local-profile", { setItem: () => { throw new Error("blocked"); } })).toBe(false);
    expect(clearSafetyPlan("local-profile", { removeItem: () => { throw new Error("blocked"); } })).toBe(false);
  });

  it("clears only the current profile key and leaves legacy data untouched", () => {
    const storage = makeStorage({
      [getSafetyPlanStorageKey("account-one")]: "account-one-plan",
      [getSafetyPlanStorageKey("account-two")]: "account-two-plan",
      [LEGACY_SAFETY_PLAN_STORAGE_KEY]: "legacy-plan",
      unrelated: "leave-me",
    });
    expect(clearSafetyPlan("account-one", storage)).toBe(true);
    expect(storage.values.has(getSafetyPlanStorageKey("account-one"))).toBe(false);
    expect(storage.values.get(getSafetyPlanStorageKey("account-two"))).toBe("account-two-plan");
    expect(storage.values.get(LEGACY_SAFETY_PLAN_STORAGE_KEY)).toBe("legacy-plan");
    expect(storage.values.get("unrelated")).toBe("leave-me");
  });
});
