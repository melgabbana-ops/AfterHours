import aftercareNoteSource from "./AftercareNote.tsx?raw";
import { describe, expect, it } from "vitest";

describe("aftercare journal focus return", () => {
  it("keeps a ref to the disclosure that opens the private journal", () => {
    expect(aftercareNoteSource).toContain("const journalToggleRef = useRef<HTMLButtonElement>(null);");
    expect(aftercareNoteSource).toContain('ref={journalToggleRef} type="button" className="ah-open-journal"');
  });

  it("returns focus to the disclosure when the journal closes itself", () => {
    expect(aftercareNoteSource).toContain("onClose={() => {");
    expect(aftercareNoteSource).toContain("setJournalOpen(false);");
    expect(aftercareNoteSource).toContain("journalToggleRef.current?.focus();");
  });
});
