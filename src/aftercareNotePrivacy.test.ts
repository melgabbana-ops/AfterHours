import mainSource from "./main.tsx?raw";
import aftercareNoteSource from "./AftercareNote.tsx?raw";
import { describe, expect, it } from "vitest";

describe("aftercare note privacy scope", () => {
  it("remounts the note editor when the active profile or session changes", () => {
    expect(mainSource).toContain(
      '<AftercareNote key={JSON.stringify([state.profile.id, state.session.id])}',
    );
  });
});

describe("aftercare note deletion confirmation", () => {
  it("requires a separate confirmation before permanently deleting a saved note", () => {
    expect(aftercareNoteSource).toContain("const [confirmDelete, setConfirmDelete] = useState(false);");
    expect(aftercareNoteSource).toContain("if (!confirmDelete || !saved) return;");
    expect(aftercareNoteSource).toContain('onClick={requestRemove}');
    expect(aftercareNoteSource).toContain('t("Definitief verwijderen", "Delete permanently")');
  });

  it("provides an accessible cancellation path that keeps the saved note", () => {
    expect(aftercareNoteSource).toContain('t("Annuleren", "Cancel")');
    expect(aftercareNoteSource).toContain('t("Verwijderen geannuleerd. Je notitie is behouden.", "Deletion cancelled. Your note was kept.")');
    expect(aftercareNoteSource).toContain('role="status" aria-live="polite" aria-atomic="true"');
  });
});
