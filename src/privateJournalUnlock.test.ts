import aftercareJournalSource from "./AftercareJournal.tsx?raw";
import { describe, expect, it } from "vitest";
import { canContinuePrivateJournalUnlock } from "./privateJournalUnlock";

describe("private journal unlock lifecycle", () => {
  it("continues only for the current operation while the document is visible", () => {
    expect(canContinuePrivateJournalUnlock(4, 4, "visible")).toBe(true);
    expect(canContinuePrivateJournalUnlock(4, 5, "visible")).toBe(false);
    expect(canContinuePrivateJournalUnlock(4, 4, "hidden")).toBe(false);
    expect(canContinuePrivateJournalUnlock(4, 4, "prerender")).toBe(false);
  });

  it("keeps the auto-lock guard active while an unlock is pending", () => {
    expect(aftercareJournalSource).toContain("() => key !== null || busy");
    expect(aftercareJournalSource).toContain("[key, busy, lock]");
  });

  it("checks the unlock generation and visibility before loading private entries", () => {
    const firstGuard = aftercareJournalSource.indexOf("if (!canContinueUnlock()) return;");
    const loadEntries = aftercareJournalSource.indexOf(
      "const loaded = await loadPrivateJournalEntries(unlocked, journalStorage);",
    );
    const secondGuard = aftercareJournalSource.indexOf(
      "if (!canContinueUnlock()) return;",
      firstGuard + 1,
    );

    expect(firstGuard).toBeGreaterThan(-1);
    expect(firstGuard).toBeLessThan(loadEntries);
    expect(secondGuard).toBeGreaterThan(loadEntries);
  });
});
