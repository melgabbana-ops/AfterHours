import aftercareNoteSource from "./AftercareNote.tsx?raw";
import { describe, expect, it } from "vitest";

describe("aftercare journal disclosure accessibility", () => {
  it("connects the toggle to a persistent controlled panel", () => {
    expect(aftercareNoteSource).toContain('aria-expanded={journalOpen} aria-controls="aftercare-private-journal-panel"');
    expect(aftercareNoteSource).toContain('<div id="aftercare-private-journal-panel" hidden={!journalOpen}>');
  });

  it("returns keyboard focus to the disclosure when the journal closes", () => {
    expect(aftercareNoteSource).toContain("const journalToggleRef = useRef<HTMLButtonElement>(null);");
    expect(aftercareNoteSource).toContain("journalToggleRef.current?.focus();");
  });
});
