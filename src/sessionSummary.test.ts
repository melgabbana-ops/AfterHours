import { describe, expect, it } from "vitest";
import { buildSessionSummaryRows, type SessionCompletionSummary } from "./sessionSummary";

const baseSummary: SessionCompletionSummary = {
  completedAt: "2026-11-20T02:00:00.000Z",
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
