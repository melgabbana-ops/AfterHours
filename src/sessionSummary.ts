import type { MoodCode, MoodPhase } from "./services/moods";

export type SessionSummaryLanguage = "nl" | "en";
export type SessionAftercareChoice = "land" | "talk" | "space" | "hydrate" | "relax" | "ground" | "music" | "notes" | "meditation";
export type SessionNoteStatus = "saved" | "skipped";

export interface SessionCompletionSummary {
  completedAt: string;
  startedAt: string | null;
  rounds: number;
  earned: number;
  level: number;
  moodBefore: MoodCode | null;
  moodDuring: MoodCode | null;
  moodAfter: MoodCode | null;
  aftercareChoice: SessionAftercareChoice;
  noteStatus: SessionNoteStatus;
}

export interface SessionSummaryRow {
  id: string;
  label: string;
  value: string;
}

const moodLabels: Record<MoodCode, readonly [string, string]> = {
  KINKY: ["Kinky", "Kinky"],
  EXCITED: ["Opgewonden", "Excited"],
  CURIOUS: ["Nieuwsgierig", "Curious"],
  CALM: ["Rustig", "Calm"],
  PLAYFUL: ["Speels", "Playful"],
  CONFIDENT: ["Zelfverzekerd", "Confident"],
  UNSURE: ["Onzeker / twijfel", "Unsure"],
  "INTO IT": ["Ik zit er lekker in", "Into it"],
  MORE: ["Ik wil meer", "More"],
  GOOD: ["Goed", "Good"],
  NEUTRAL: ["Neutraal", "Neutral"],
  "NEED A PAUSE": ["Pauze nodig", "Need a pause"],
  OVERWHELMED: ["Overweldigd", "Overwhelmed"],
  STOP: ["STOP", "STOP"],
  RELAXED: ["Ontspannen", "Relaxed"],
  SATISFIED: ["Tevreden", "Satisfied"],
  ENERGIZED: ["Energiek", "Energized"],
  TIRED: ["Moe", "Tired"],
  EMOTIONAL: ["Emotioneel", "Emotional"],
  OVERSTIMULATED: ["Overprikkeld", "Overstimulated"],
};

const phaseLabels: Record<MoodPhase, readonly [string, string]> = {
  before: ["Vooraf", "Before"],
  during: ["Tijdens", "During"],
  after: ["Achteraf", "Aftercare"],
};

const aftercareLabels: Record<SessionAftercareChoice, readonly [string, string]> = {
  land: ["Rustig landen", "Land softly"],
  talk: ["Napraten", "Talk"],
  space: ["Ruimte", "Space"],
  hydrate: ["Hydratatie", "Hydration"],
  relax: ["Ontspanning", "Relaxation"],
  ground: ["Grounding", "Grounding"],
  music: ["Muziek", "Music"],
  notes: ["Notities", "Notes"],
  meditation: ["Meditatie", "Meditation"],
};

function getElapsedSessionSeconds(startedAt: string | null, completedAt: string): number | null {
  if (!startedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.floor((end - start) / 1000);
}

function formatElapsedDuration(seconds: number, language: SessionSummaryLanguage): string {
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 1) {
    return language === "nl" ? "Minder dan 1 minuut" : "Less than 1 minute";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${totalMinutes} min`;
  const hourUnit = language === "nl" ? "uur" : "hr";
  return minutes === 0
    ? `${hours} ${hourUnit}`
    : `${hours} ${hourUnit} ${minutes} min`;
}

/** Build a summary only from fields the current session flow actually records. */
export function buildSessionSummaryRows(
  summary: SessionCompletionSummary,
  language: SessionSummaryLanguage,
): SessionSummaryRow[] {
  const languageIndex = language === "nl" ? 0 : 1;
  const date = new Date(summary.completedAt);
  const completedAt = Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : language === "nl" ? "Onbekend" : "Unknown";

  const rows: SessionSummaryRow[] = [
    {
      id: "completedAt",
      label: language === "nl" ? "Afgerond op" : "Completed",
      value: completedAt,
    },
    {
      id: "rounds",
      label: language === "nl" ? "Afgeronde rondes" : "Rounds completed",
      value: String(summary.rounds),
    },
  ];

  const elapsedSeconds = getElapsedSessionSeconds(summary.startedAt, summary.completedAt);
  if (elapsedSeconds !== null) {
    rows.push({
      id: "elapsedTime",
      label: language === "nl" ? "Verstreken tijd" : "Elapsed time",
      value: formatElapsedDuration(elapsedSeconds, language),
    });
  }

  const moodRows: Array<[MoodPhase, MoodCode | null]> = [
    ["before", summary.moodBefore],
    ["during", summary.moodDuring],
    ["after", summary.moodAfter],
  ];
  for (const [phase, mood] of moodRows) {
    if (!mood) continue;
    rows.push({
      id: `mood-${phase}`,
      label: phaseLabels[phase][languageIndex],
      value: moodLabels[mood][languageIndex],
    });
  }

  rows.push(
    {
      id: "aftercare",
      label: language === "nl" ? "Aftercare-keuze" : "Aftercare choice",
      value: aftercareLabels[summary.aftercareChoice][languageIndex],
    },
    {
      id: "noteStatus",
      label: language === "nl" ? "Privénotitie" : "Private note",
      value: summary.noteStatus === "saved"
        ? language === "nl" ? "Opgeslagen" : "Saved"
        : language === "nl" ? "Overgeslagen" : "Skipped",
    },
  );

  return rows;
}
