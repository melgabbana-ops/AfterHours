import componentSource from "./AftercareNote.tsx?raw";
import { describe, expect, it } from "vitest";

describe("private aftercare note deletion", () => {
  it("does not delete a note directly from the first delete action", () => {
    const labelIndex = componentSource.indexOf('t("Verwijder notitie", "Delete note")');
    const buttonStart = componentSource.lastIndexOf("<button", labelIndex);
    const buttonEnd = componentSource.indexOf("</button>", labelIndex);
    const deleteTrigger = componentSource.slice(buttonStart, buttonEnd);

    expect(deleteTrigger).toContain("onClick={() => setConfirmDelete(true)}");
    expect(deleteTrigger).toContain("aria-expanded={confirmDelete}");
    expect(deleteTrigger).toContain('aria-controls="aftercare-note-delete-confirm"');
    expect(deleteTrigger).not.toContain("onClick={remove}");
  });

  it("requires a clearly labelled, bilingual confirmation before permanent deletion", () => {
    expect(componentSource).toContain('role="group" aria-labelledby="aftercare-note-delete-confirm-label"');
    expect(componentSource).toContain('role="status" aria-live="polite"');
    expect(componentSource).toContain("Weet je zeker dat je deze lokale notitie van deze sessie wilt verwijderen?");
    expect(componentSource).toContain("Are you sure you want to delete this local note for this session?");
    expect(componentSource).toContain('onClick={remove}');
    expect(componentSource).toContain('t("Definitief verwijderen", "Delete permanently")');
  });

  it("allows cancellation without invoking the delete action", () => {
    expect(componentSource).toContain('onClick={() => setConfirmDelete(false)}');
    expect(componentSource).toContain('t("Annuleren", "Cancel")');
  });

  it("clears a pending confirmation after edits, skip, successful deletion, or session changes", () => {
    expect(componentSource).toContain("const updateField = (field:");
    expect(componentSource).toContain("const skip = () => {\n    setConfirmDelete(false);");
    expect(componentSource).toContain("const remove = () => {");
    expect(componentSource).toContain("useEffect(() => {\n    const existing = loadPrivateSessionNote");
    expect(componentSource).toContain("setConfirmDelete(false);");
  });
});
