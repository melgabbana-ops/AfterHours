import { describe, expect, it } from "vitest";
import aftercareHistorySource from "./AftercareHistoryNote.tsx?raw";

describe("aftercare history disclosure accessibility", () => {
  it("connects the toggle to a uniquely identified, labelled disclosure group", () => {
    expect(aftercareHistorySource).toContain("const disclosureId = useId();");
    expect(aftercareHistorySource).toContain("const toggleId = `${disclosureId}-toggle`;");
    expect(aftercareHistorySource).toContain("const contentId = `${disclosureId}-content`;");
    expect(aftercareHistorySource).toContain("id={toggleId}");
    expect(aftercareHistorySource).toContain("aria-expanded={expanded}");
    expect(aftercareHistorySource).toContain("aria-controls={contentId}");
    expect(aftercareHistorySource).toContain('role="group"');
    expect(aftercareHistorySource).toContain("aria-labelledby={toggleId}");
  });

  it("keeps the disclosure target present but hides private note text while collapsed", () => {
    expect(aftercareHistorySource).toContain("hidden={!expanded}");
    expect(aftercareHistorySource).toContain("{expanded && note && <div className=\"aftercare-history-note-content\">");
  });
});
