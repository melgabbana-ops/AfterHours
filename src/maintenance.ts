export interface MaintenanceConfig {
  enabled?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  warningMinutes?: number;
  messageNL?: string;
  messageEN?: string;
}

export interface MaintenanceStatus {
  active: boolean;
  warning: boolean;
  startsAtMs: number | null;
  endsAtMs: number | null;
  warningMinutes: number;
  messageNL: string;
  messageEN: string;
}

const parseDate = (value: unknown): number | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function getMaintenanceStatus(config: MaintenanceConfig | null | undefined, now = Date.now()): MaintenanceStatus {
  const safe = config ?? {};
  const startsAtMs = parseDate(safe.startsAt);
  const endsAtMs = parseDate(safe.endsAt);
  const endsAtWasConfigured = typeof safe.endsAt === "string" && safe.endsAt.trim().length > 0;
  const warningMinutes = Number.isFinite(safe.warningMinutes)
    ? Math.max(0, Math.min(7 * 24 * 60, Number(safe.warningMinutes)))
    : 30;
  const scheduleIsValid = startsAtMs !== null
    && (!endsAtWasConfigured || (endsAtMs !== null && endsAtMs > startsAtMs));
  const scheduledActive = scheduleIsValid
    && startsAtMs !== null
    && now >= startsAtMs
    && (endsAtMs === null || now < endsAtMs);
  const active = safe.enabled === true || scheduledActive;
  const warning = !active
    && safe.enabled !== true
    && scheduleIsValid
    && startsAtMs !== null
    && startsAtMs > now
    && now >= startsAtMs - warningMinutes * 60_000;

  return {
    active,
    warning,
    startsAtMs,
    endsAtMs,
    warningMinutes,
    messageNL: typeof safe.messageNL === "string" && safe.messageNL.trim()
      ? safe.messageNL.trim()
      : "We voeren gepland onderhoud uit. Probeer het straks opnieuw.",
    messageEN: typeof safe.messageEN === "string" && safe.messageEN.trim()
      ? safe.messageEN.trim()
      : "Scheduled maintenance is in progress. Please try again shortly."
  };
}

export function formatMaintenanceDate(timestamp: number, language: "nl" | "en" = "nl"): string {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}
