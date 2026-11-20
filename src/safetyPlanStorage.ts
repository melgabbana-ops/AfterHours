export interface ReadinessChecks {
  consentDiscussed: boolean;
  signalsDiscussed: boolean;
  aftercareDiscussed: boolean;
}

export interface SafetyPlanData {
  safeword: string;
  amberSignal: string;
  boundaries: string;
  readiness: ReadinessChecks;
}

/**
 * v1 was shared by every app account in the same browser. Its owner cannot be
 * determined safely, so it is intentionally left untouched and never imported.
 */
export const LEGACY_SAFETY_PLAN_STORAGE_KEY = "afterhours.safety-plan.v1";
export const SAFETY_PLAN_STORAGE_PREFIX = "afterhours.safety-plan.v2:";
export const SAFETY_PLAN_STORAGE_KEY = getSafetyPlanStorageKey("local-profile");

export function getSafetyPlanStorageKey(profileId = "local-profile"): string {
  const normalizedProfileId = profileId.trim() || "local-profile";
  return SAFETY_PLAN_STORAGE_PREFIX + encodeURIComponent(normalizedProfileId);
}

export function hasUnscopedSafetyPlan(storage?: Pick<Storage, "getItem">): boolean {
  try {
    const source = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    return source ? source.getItem(LEGACY_SAFETY_PLAN_STORAGE_KEY) !== null : false;
  } catch {
    return false;
  }
}

export const emptySafetyPlan: SafetyPlanData = {
  safeword: "",
  amberSignal: "",
  boundaries: "",
  readiness: {
    consentDiscussed: false,
    signalsDiscussed: false,
    aftercareDiscussed: false,
  },
};

export function normalizeSafetyPlan(value: unknown): SafetyPlanData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createEmptySafetyPlan();
  }

  const plan = value as Partial<SafetyPlanData>;
  const readiness =
    plan.readiness && typeof plan.readiness === "object" && !Array.isArray(plan.readiness)
      ? (plan.readiness as Partial<ReadinessChecks>)
      : {};

  return {
    safeword: typeof plan.safeword === "string" ? plan.safeword.slice(0, 80) : "",
    amberSignal: typeof plan.amberSignal === "string" ? plan.amberSignal.slice(0, 80) : "",
    boundaries: typeof plan.boundaries === "string" ? plan.boundaries.slice(0, 1000) : "",
    readiness: {
      consentDiscussed: readiness.consentDiscussed === true,
      signalsDiscussed: readiness.signalsDiscussed === true,
      aftercareDiscussed: readiness.aftercareDiscussed === true,
    },
  };
}

export function createEmptySafetyPlan(): SafetyPlanData {
  return {
    ...emptySafetyPlan,
    readiness: { ...emptySafetyPlan.readiness },
  };
}

/** Compare user-defined STOP and PAUSE phrases using the same basic normalization as voice matching. */
export function hasConflictingSafetySignals(
  plan: Pick<SafetyPlanData, "safeword" | "amberSignal">,
): boolean {
  const normalizeSignal = (value: string) =>
    value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
  const safeword = normalizeSignal(plan.safeword);
  const amberSignal = normalizeSignal(plan.amberSignal);
  return safeword.length > 0 && amberSignal.length > 0 && safeword === amberSignal;
}

export function readSafetyPlan(
  profileId = "local-profile",
  storage?: Pick<Storage, "getItem">,
): SafetyPlanData {
  try {
    const source = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!source) return createEmptySafetyPlan();
    const raw = source.getItem(getSafetyPlanStorageKey(profileId));
    if (!raw) return createEmptySafetyPlan();
    return normalizeSafetyPlan(JSON.parse(raw) as unknown);
  } catch {
    return createEmptySafetyPlan();
  }
}

/**
 * Save only when the browser can read back the exact normalized plan. This
 * prevents the UI from claiming that a safeword was saved when storage silently
 * dropped or altered the write.
 */
export function writeSafetyPlan(
  plan: SafetyPlanData,
  profileId = "local-profile",
  storage?: Pick<Storage, "getItem" | "setItem">,
): boolean {
  try {
    const target = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!target) return false;
    const normalized = normalizeSafetyPlan({
      ...plan,
      safeword: plan.safeword.trim(),
      amberSignal: plan.amberSignal.trim(),
      boundaries: plan.boundaries.trim(),
    });
    if (hasConflictingSafetySignals(normalized)) return false;
    const key = getSafetyPlanStorageKey(profileId);
    const serialized = JSON.stringify(normalized);
    target.setItem(key, serialized);
    return target.getItem(key) === serialized;
  } catch {
    return false;
  }
}

/**
 * Confirm deletion before telling the user that a local safety plan is gone.
 */
export function clearSafetyPlan(
  profileId = "local-profile",
  storage?: Pick<Storage, "getItem" | "removeItem">,
): boolean {
  try {
    const target = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!target) return false;
    const key = getSafetyPlanStorageKey(profileId);
    target.removeItem(key);
    return target.getItem(key) === null;
  } catch {
    return false;
  }
}
