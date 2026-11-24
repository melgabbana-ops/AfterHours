import aftercareNoteSource from "./AftercareNote.tsx?raw";
import { describe, expect, it } from "vitest";

describe("aftercare journal disclosure accessibility", () => {
  it("exposes the journal toggle as a disclosure controlling a persistent panel", () => {
    expect(aftercareNoteSource).toContain('aria-expanded={journalOpen} aria-controls="aftercare-private-journal-panel"');
    expect(aftercareNoteSource).toContain('<div id="aftercare-private-journal-panel" hidden={!journalOpen}>');
    expect(aftercareNoteSource).toContain('{journalOpen && <AftercareJournal');
  });

  it("keeps the panel hidden while the journal is closed without mounting its private contents", () => {
    expect(aftercareNoteSource).toContain('hidden={!journalOpen}');
    expect(aftercareNoteSource).toContain('{journalOpen && <AftercareJournal');
  });
});
