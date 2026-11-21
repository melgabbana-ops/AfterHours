export type AchievementEvent = "login" | "horoscope" | "tarot" | "oracle" | "session_complete" | "consent_confirmed" | "prompt_complete" | "story_chapter_complete" | "kink_test_complete" | "kink_test_boundaries";

export interface EarnedBadge {
  id: string;
  earnedAt: string;
  eventKey: string;
}

export const badgeCatalog = [
  { id: "first_login", title: "First Light", description: "Je eerste keer veilig aangemeld.", icon: "✦", event: "login", xp: 0 },
  { id: "sky_watcher", title: "Star Gazer", description: "Je hebt je astrologische reflectie bekeken.", icon: "☾", event: "horoscope", xp: 0 },
  { id: "tarot_reader", title: "The Seeker", description: "Je hebt je eerste Kinky Tarot-kaart getrokken.", icon: "✧", event: "tarot", xp: 0 },
  { id: "oracle_seeker", title: "Oracle Keeper", description: "Je hebt je eerste Oracle-boodschap geopend.", icon: "⛓", event: "oracle", xp: 0 },
  { id: "daily_orbit", title: "Daily Orbit", description: "Je hebt vandaag je sterrenreflectie geopend.", icon: "☼", event: "daily_horoscope", xp: 0 },
  { id: "consent_first", title: "Consent First", description: "Je hebt de consent-check bevestigd.", icon: "◇", event: "consent_confirmed", xp: 0 },
  { id: "first_session", title: "First Experience", description: "Je hebt je eerste sessie afgerond.", icon: "♜", event: "session_complete", xp: 0 },
  { id: "three_sessions", title: "Ritual Keeper", description: "Je hebt drie sessies afgerond.", icon: "♛", event: "three_sessions", xp: 0 },
  { id: "first_prompt", title: "Curious Mind", description: "Je hebt je eerste prompt als gedaan gemarkeerd.", icon: "✧", event: "prompt_complete", xp: 0 },
  { id: "story_arrival", title: "First Arrival", description: "Je hebt THE ARRIVAL afgerond.", icon: "✦", event: "story_chapter_complete", xp: 0 },
  { id: "story_test", title: "Clear Intent", description: "Je hebt THE TEST afgerond.", icon: "◇", event: "story_chapter_complete", xp: 0 },
  { id: "story_control", title: "Chosen Direction", description: "Je hebt THE CONTROL afgerond.", icon: "♜", event: "story_chapter_complete", xp: 0 },
  { id: "story_challenge", title: "Creative Edge", description: "Je hebt THE CHALLENGE afgerond.", icon: "✧", event: "story_chapter_complete", xp: 0 },
  { id: "story_boundary", title: "Boundary Keeper", description: "Je hebt THE BOUNDARY afgerond.", icon: "⬡", event: "story_chapter_complete", xp: 0 },
  { id: "story_night", title: "Night Director", description: "Je hebt THE NIGHT afgerond.", icon: "☾", event: "story_chapter_complete", xp: 0 },
  { id: "story_after-hours", title: "After Hours", description: "Je hebt AFTER HOURS afgerond.", icon: "♛", event: "story_chapter_complete", xp: 0 },\n  { id: "kink_self_knowing", title: "The Self-Knowing", description: "Je hebt je eerste AFTER HOURS Kink Profile afgerond.", icon: "✦", event: "kink_test_complete", xp: 0 },\n  { id: "kink_boundary_architect", title: "Boundary Architect", description: "Je hebt bewust je grenzen benoemd in Kink Profile.", icon: "◇", event: "kink_test_boundaries", xp: 0 },
] as const;

const STORAGE_KEY = "afterhours.achievements.v1";
const EVENT_NAME = "afterhours:achievement";
const knownBadgeIds = new Set<string>(badgeCatalog.map((badge) => badge.id));
const storageKeyFor = (profileId?: string | null) => profileId
  ? `${STORAGE_KEY}.${profileId}`
  : STORAGE_KEY;

function isEarnedBadge(value: unknown): value is EarnedBadge {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<EarnedBadge>;
  return typeof item.id === "string" && knownBadgeIds.has(item.id)
    && typeof item.earnedAt === "string" && Number.isFinite(Date.parse(item.earnedAt))
    && typeof item.eventKey === "string" && item.eventKey.trim().length > 0;
}

function readEarned(profileId?: string | null): EarnedBadge[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(profileId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEarnedBadge);
  } catch { return []; }
}

function writeEarned(items: EarnedBadge[], profileId?: string | null) {
  try {
    localStorage.setItem(storageKeyFor(profileId), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch { /* Storage may be disabled; achievements are non-critical UI. */ }
}

export function listEarnedBadges(profileId?: string | null): EarnedBadge[] {
  return readEarned(profileId);
}

export function recordAchievement(event: AchievementEvent, options: { date?: string; completedSessions?: number; profileId?: string | null; chapterId?: string } = {}) {
  const today = options.date ?? new Date().toLocaleDateString("sv-SE");
  const current = readEarned(options.profileId);
  const next: EarnedBadge[] = [...current];
  const add = (id: string, eventKey: string) => {
    if (!next.some((item) => item.id === id)) next.push({ id, earnedAt: new Date().toISOString(), eventKey });
  };

  if (event === "login") add("first_login", "login:first");
  if (event === "tarot") add("tarot_reader", "tarot:first");
  if (event === "oracle") add("oracle_seeker", "oracle:first");
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
  if (event === "prompt_complete") add("first_prompt", "prompt:first");\n  if (event === "kink_test_complete") add("kink_self_knowing", "kink-test:first");\n  if (event === "kink_test_boundaries") add("kink_boundary_architect", "kink-test:boundaries");
  if (event === "story_chapter_complete" && typeof options.chapterId === "string") {
    const chapterId = options.chapterId;
    if (["arrival", "test", "control", "challenge", "boundary", "night", "after-hours"].includes(chapterId)) {
      add(`story_${chapterId}`, `story:${chapterId}`);
    }
  }
  writeEarned(next, options.profileId);
}

export function achievementEventName() { return EVENT_NAME; }
