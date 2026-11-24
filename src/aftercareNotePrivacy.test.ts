import mainSource from "./main.tsx?raw";
import aftercareNoteSource from "./AftercareNote.tsx?raw";
import { bindAftercareEditorPrivacyLock } from "./aftercareNotePrivacy";
import { describe, expect, it, vi } from "vitest";

function createEventHarness() {
  const listeners = new Map<string, Set<EventListener>>();
  return {
    addEventListener(type: string, listener: EventListener) {
      const current = listeners.get(type) ?? new Set<EventListener>();
      current.add(listener);
      listeners.set(type, current);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type: string) {
      for (const listener of listeners.get(type) ?? []) listener({ type } as Event);
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

function createTargets(initialVisibility: DocumentVisibilityState = "visible") {
  const windowEvents = createEventHarness();
  const documentEvents = createEventHarness();
  let visibilityState = initialVisibility;
  const windowTarget = windowEvents as unknown as Pick<Window, "addEventListener" | "removeEventListener">;
  const documentTarget = {
    ...documentEvents,
    get visibilityState() {
      return visibilityState;
    },
  } as unknown as Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;

  return {
    windowTarget,
    documentTarget,
    setVisibility(value: DocumentVisibilityState) {
      visibilityState = value;
    },
    dispatchWindow: windowEvents.dispatch,
    dispatchDocument: documentEvents.dispatch,
    windowListenerCount: windowEvents.listenerCount,
    documentListenerCount: documentEvents.listenerCount,
  };
}

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
    expect(aftercareNoteSource).toContain("onClick={requestRemove}");
    expect(aftercareNoteSource).toContain('t("Definitief verwijderen", "Delete permanently")');
  });

  it("provides an accessible cancellation path that keeps the saved note", () => {
    expect(aftercareNoteSource).toContain('t("Annuleren", "Cancel")');
    expect(aftercareNoteSource).toContain('t("Verwijderen geannuleerd. Je notitie is behouden.", "Deletion cancelled. Your note was kept.")');
    expect(aftercareNoteSource).toContain('role="status" aria-live="polite" aria-atomic="true"');
  });
});

describe("aftercare editor background privacy", () => {
  it("removes the unencrypted note fields and open journal from the rendered tree while backgrounded", () => {
    expect(aftercareNoteSource).toContain("const [privacyLocked, setPrivacyLocked] = useState(false);");
    expect(aftercareNoteSource).toContain('{privacyLocked ? (');
    expect(aftercareNoteSource).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(aftercareNoteSource).toContain("Private note hidden while the app is in the background.");
    expect(aftercareNoteSource).toContain('{journalOpen && <AftercareJournal');
    expect(aftercareNoteSource).toContain('<textarea id="aftercare-note-how-felt"');
    expect(aftercareNoteSource).toContain('setPrivacyLocked(true);');
    expect(aftercareNoteSource).toContain('setJournalOpen(false);');
    expect(aftercareNoteSource).toContain("bindAftercareEditorPrivacyLock(");
  });

  it("locks synchronously on background transitions and restores the draft on return", () => {
    const targets = createTargets();
    const lock = vi.fn();
    const unlock = vi.fn();
    bindAftercareEditorPrivacyLock(targets.windowTarget, targets.documentTarget, lock, unlock);

    targets.setVisibility("hidden");
    targets.dispatchDocument("visibilitychange");
    expect(lock).toHaveBeenCalledTimes(1);
    expect(unlock).not.toHaveBeenCalled();

    targets.setVisibility("visible");
    targets.dispatchDocument("visibilitychange");
    expect(unlock).toHaveBeenCalledTimes(1);
  });

  it("locks on pagehide and restores after a visible pageshow", () => {
    const targets = createTargets();
    const lock = vi.fn();
    const unlock = vi.fn();
    bindAftercareEditorPrivacyLock(targets.windowTarget, targets.documentTarget, lock, unlock);

    targets.dispatchWindow("pagehide");
    expect(lock).toHaveBeenCalledTimes(1);
    targets.dispatchWindow("pageshow");
    expect(unlock).toHaveBeenCalledTimes(1);
  });

  it("starts locked when mounted in a background document", () => {
    const targets = createTargets("hidden");
    const lock = vi.fn();
    const unlock = vi.fn();
    bindAftercareEditorPrivacyLock(targets.windowTarget, targets.documentTarget, lock, unlock);
    expect(lock).toHaveBeenCalledTimes(1);
    expect(unlock).not.toHaveBeenCalled();
  });

  it("removes visibility and page lifecycle listeners on cleanup", () => {
    const targets = createTargets();
    const cleanup = bindAftercareEditorPrivacyLock(
      targets.windowTarget,
      targets.documentTarget,
      vi.fn(),
      vi.fn(),
    );
    expect(targets.documentListenerCount("visibilitychange")).toBe(1);
    expect(targets.windowListenerCount("pagehide")).toBe(1);
    expect(targets.windowListenerCount("pageshow")).toBe(1);

    cleanup();

    expect(targets.documentListenerCount("visibilitychange")).toBe(0);
    expect(targets.windowListenerCount("pagehide")).toBe(0);
    expect(targets.windowListenerCount("pageshow")).toBe(0);
  });
});
