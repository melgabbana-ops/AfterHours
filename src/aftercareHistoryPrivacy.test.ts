import { describe, expect, it, vi } from "vitest";
import historyNoteSource from "./AftercareHistoryNote.tsx?raw";
import { bindAftercareNoteAutoCollapse } from "./aftercareHistoryPrivacy";

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

describe("aftercare history privacy lock", () => {
  it("collapses the note when the document becomes hidden", () => {
    const targets = createTargets();
    const collapse = vi.fn();
    bindAftercareNoteAutoCollapse(targets.windowTarget, targets.documentTarget, collapse);

    expect(collapse).not.toHaveBeenCalled();
    targets.setVisibility("hidden");
    targets.dispatchDocument("visibilitychange");
    expect(collapse).toHaveBeenCalledTimes(1);

    targets.setVisibility("visible");
    targets.dispatchDocument("visibilitychange");
    expect(collapse).toHaveBeenCalledTimes(1);
  });

  it("collapses immediately when mounted while the document is already hidden", () => {
    const targets = createTargets("hidden");
    const collapse = vi.fn();

    bindAftercareNoteAutoCollapse(targets.windowTarget, targets.documentTarget, collapse);

    expect(collapse).toHaveBeenCalledTimes(1);
  });

  it("collapses on pagehide even when visibility has not changed", () => {
    const targets = createTargets();
    const collapse = vi.fn();
    bindAftercareNoteAutoCollapse(targets.windowTarget, targets.documentTarget, collapse);

    targets.dispatchWindow("pagehide");

    expect(collapse).toHaveBeenCalledTimes(1);
  });

  it("removes both browser listeners when the disclosure unmounts", () => {
    const targets = createTargets();
    const collapse = vi.fn();
    const cleanup = bindAftercareNoteAutoCollapse(targets.windowTarget, targets.documentTarget, collapse);

    expect(targets.documentListenerCount("visibilitychange")).toBe(1);
    expect(targets.windowListenerCount("pagehide")).toBe(1);

    cleanup();

    expect(targets.documentListenerCount("visibilitychange")).toBe(0);
    expect(targets.windowListenerCount("pagehide")).toBe(0);
    targets.setVisibility("hidden");
    targets.dispatchDocument("visibilitychange");
    targets.dispatchWindow("pagehide");
    expect(collapse).not.toHaveBeenCalled();
  });

  it("flushes the disclosure closed and resets it when the owner or session changes", () => {
    expect(historyNoteSource).toContain("bindAftercareNoteAutoCollapse(window, document");
    expect(historyNoteSource).toContain("flushSync(() => setExpandedFor(null))");
    expect(historyNoteSource).toContain("useEffect(() => {\n    setExpandedFor(null);\n  }, [ownerId, sessionId]);");
  });
});
