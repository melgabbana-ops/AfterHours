export type AchievementEvent = "login" | "horoscope" | "session_complete" | "consent_confirmed" | "prompt_complete";

export interface EarnedBadge {
  id: string;
  earnedAt: string;
  eventKey: string;
}

export const badgeCatalog = [
  { id: "first_login", title: "First Light", description: "Je eerste keer veilig aangemeld.", icon: "✦", event: "login", xp: 0 },
  { id: "sky_watcher", title: "Star Gazer", description: "Je hebt je astrologische reflectie bekeken.", icon: "☾", event: "horoscope", xp: 0 },
  { id: "daily_orbit", title: "Daily Orbit", description: "Je hebt vandaag je sterrenreflectie geopend.", icon: "☼", event: "daily_horoscope", xp: 0 },
  { id: "consent_first", title: "Consent First", description: "Je hebt de consent-check bevestigd.", icon: "◇", event: "consent_confirmed", xp: 0 },
  { id: "first_session", title: "First Experience", description: "Je hebt je eerste sessie afgerond.", icon: "♜", event: "session_complete", xp: 0 },
  { id: "three_sessions", title: "Ritual Keeper", description: "Je hebt drie sessies afgerond.", icon: "♛", event: "three_sessions", xp: 0 },
  { id: "first_prompt", title: "Curious Mind", description: "Je hebt je eerste prompt als gedaan gemarkeerd.", icon: "✧", event: "prompt_complete", xp: 0 },
] as const;

const STORAGE_KEY = "afterhours.achievements.v1";
const EVENT_NAME = "afterhours:achievement";

function readEarned(): EarnedBadge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is EarnedBadge =>
      !!item && typeof item.id === "string" && typeof item.earnedAt === "string" && typeof item.eventKey === "string"
    );
  } catch { return []; }
}

function writeEarned(items: EarnedBadge[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch { /* Storage may be disabled; achievements are non-critical UI. */ }
}

export function listEarnedBadges(): EarnedBadge[] {
  return readEarned();
}

export function recordAchievement(event: AchievementEvent, options: { date?: string; completedSessions?: number } = {}) {
  const today = options.date ?? new Date().toLocaleDateString("sv-SE");
  const current = readEarned();
  const next: EarnedBadge[] = [...current];
  const add = (id: string, eventKey: string) => {
    if (!next.some((item) => item.id === id)) next.push({ id, earnedAt: new Date().toISOString(), eventKey });
  };

  if (event === "login") add("first_login", "login:first");
  if (event === "horoscope") {
    add("sky_watcher", "horoscope:first");
    if (!current.some((item) => item.id === "daily_orbit" && item.eventKey === `horoscope:${today}`)) {
      next.push({ id: "daily_orbit", earnedAt: new Date().toISOString(), eventKey: `horoscope:${today}` });
    }
  }
  if (event === "consent_confirmed") add("consent_first", "consent:first");
  if (event === "session_complete") {
    add("first_session", "session:first");
    if ((options.completedSessions ?? 0) >= 3) add("three_sessions", "session:three");
  }
  if (event === "prompt_complete") add("first_prompt", "prompt:first");
  writeEarned(next);
}

export function achievementEventName() { return EVENT_NAME; }
