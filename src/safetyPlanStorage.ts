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
  return `${SAFETY_PLAN_STORAGE_PREFIX}${encodeURIComponent(normalizedProfileId)}`;
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

export function writeSafetyPlan(
  plan: SafetyPlanData,
  profileId = "local-profile",
  storage?: Pick<Storage, "setItem">,
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
    target.setItem(getSafetyPlanStorageKey(profileId), JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function clearSafetyPlan(
  profileId = "local-profile",
  storage?: Pick<Storage, "removeItem">,
): boolean {
  try {
    const target = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!target) return false;
    target.removeItem(getSafetyPlanStorageKey(profileId));
    return true;
  } catch {
    return false;
  }
}
