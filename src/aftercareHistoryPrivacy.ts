type VisibilityDocument = Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
type PageLifecycleWindow = Pick<Window, "addEventListener" | "removeEventListener">;

/**
 * Collapse private aftercare disclosures whenever the page is no longer visible.
 * The initial check uses a normal state update; browser lifecycle events may use
 * a synchronous callback so the disclosure closes before a background snapshot.
 */
export function bindAftercareNoteAutoCollapse(
  windowTarget: PageLifecycleWindow,
  documentTarget: VisibilityDocument,
  collapse: () => void,
  collapseSynchronously: () => void = collapse,
): () => void {
  const collapseWhenHidden = () => {
    if (documentTarget.visibilityState !== "visible") collapseSynchronously();
  };
  const collapseOnPageHide = () => collapseSynchronously();

  documentTarget.addEventListener("visibilitychange", collapseWhenHidden);
  windowTarget.addEventListener("pagehide", collapseOnPageHide);
  if (documentTarget.visibilityState !== "visible") collapse();

  return () => {
    documentTarget.removeEventListener("visibilitychange", collapseWhenHidden);
    windowTarget.removeEventListener("pagehide", collapseOnPageHide);
  };
}
