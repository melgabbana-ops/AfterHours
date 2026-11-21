import { describe, expect, it } from "vitest";
import { buildSessionSummaryRows, type SessionCompletionSummary } from "./sessionSummary";

const baseSummary: SessionCompletionSummary = {
  completedAt: "2026-11-20T02:00:00.000Z",
  startedAt: "2026-11-20T01:10:00.000Z",
  rounds: 3,
  earned: 120,
  level: 2,
  moodBefore: "CURIOUS",
  moodDuring: "GOOD",
  moodAfter: "RELAXED",
  aftercareChoice: "hydrate",
  noteStatus: "saved",
};

describe("session completion summary", () => {
  it("shows only recorded session details in Dutch", () => {
    const rows = buildSessionSummaryRows(baseSummary, "nl");
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "rounds", label: "Afgeronde rondes", value: "3" }),
      expect.objectContaining({ id: "elapsedTime", label: "Verstreken tijd", value: "50 min" }),
      expect.objectContaining({ id: "mood-before", label: "Vooraf", value: "Nieuwsgierig" }),
      expect.objectContaining({ id: "mood-during", label: "Tijdens", value: "Goed" }),
      expect.objectContaining({ id: "mood-after", label: "Achteraf", value: "Ontspannen" }),
      expect.objectContaining({ id: "aftercare", label: "Aftercare-keuze", value: "Hydratatie" }),
      expect.objectContaining({ id: "noteStatus", label: "Privénotitie", value: "Opgeslagen" }),
    ]));
  });

  it("localizes labels and values in English", () => {
    const rows = buildSessionSummaryRows(baseSummary, "en");
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "rounds", label: "Rounds completed", value: "3" }),
      expect.objectContaining({ id: "elapsedTime", label: "Elapsed time", value: "50 min" }),
      expect.objectContaining({ id: "mood-before", label: "Before", value: "Curious" }),
      expect.objectContaining({ id: "mood-after", label: "Aftercare", value: "Relaxed" }),
      expect.objectContaining({ id: "aftercare", label: "Aftercare choice", value: "Hydration" }),
      expect.objectContaining({ id: "noteStatus", label: "Private note", value: "Saved" }),
    ]));
  });

  it("omits mood entries that were not recorded", () => {
    const rows = buildSessionSummaryRows({
      ...baseSummary,
      moodBefore: null,
      moodDuring: null,
      moodAfter: null,
      noteStatus: "skipped",
    }, "nl");
    expect(rows.some((row) => row.id.startsWith("mood-"))).toBe(false);
    expect(rows.find((row) => row.id === "noteStatus")?.value).toBe("Overgeslagen");
  });

  it("uses a safe fallback for an invalid completion timestamp", () => {
    const rows = buildSessionSummaryRows({ ...baseSummary, completedAt: "not-a-date" }, "nl");
    expect(rows.find((row) => row.id === "completedAt")?.value).toBe("Onbekend");
  });


  it("formats elapsed time across hours and keeps pause-inclusive wording", () => {
    const rows = buildSessionSummaryRows({ ...baseSummary, completedAt: "2026-11-20T02:15:00.000Z" }, "nl");
    expect(rows.find((row) => row.id === "elapsedTime")?.value).toBe("1 uur 5 min");
    const englishRows = buildSessionSummaryRows({ ...baseSummary, completedAt: "2026-11-20T02:15:00.000Z" }, "en");
    expect(englishRows.find((row) => row.id === "elapsedTime")?.value).toBe("1 hr 5 min");
  });

  it("uses a short label for sessions shorter than one minute", () => {
    const rows = buildSessionSummaryRows({ ...baseSummary, completedAt: "2026-11-20T01:10:45.000Z" }, "nl");
    expect(rows.find((row) => row.id === "elapsedTime")?.value).toBe("Minder dan 1 minuut");
  });

  it("omits elapsed time when timestamps are missing, invalid, or reversed", () => {
    const missing = buildSessionSummaryRows({ ...baseSummary, startedAt: null }, "nl");
    const invalid = buildSessionSummaryRows({ ...baseSummary, startedAt: "not-a-date" }, "nl");
    const reversed = buildSessionSummaryRows({ ...baseSummary, startedAt: "2026-11-20T03:00:00.000Z" }, "nl");
    for (const rows of [missing, invalid, reversed]) expect(rows.some((row) => row.id === "elapsedTime")).toBe(false);
  });

  it("never includes private note contents or internal identifiers", () => {
    const summaryWithPrivateData = {
      ...baseSummary,
      privateNote: "do not display this private text",
      sessionId: "internal-session-id",
      userId: "internal-user-id",
    } as SessionCompletionSummary & { privateNote: string; sessionId: string; userId: string };
    const values = buildSessionSummaryRows(summaryWithPrivateData, "nl").map((row) => row.value);
    expect(values.join(" ")).not.toContain("do not display this private text");
    expect(values.join(" ")).not.toContain("internal-session-id");
    expect(values.join(" ")).not.toContain("internal-user-id");
  });
});
