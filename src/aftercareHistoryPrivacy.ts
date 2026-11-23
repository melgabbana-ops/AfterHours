type VisibilityDocument = Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
type PageLifecycleWindow = Pick<Window, "addEventListener" | "removeEventListener">;

/**
 * Collapse private aftercare disclosures whenever the page is no longer visible.
 * The initial check also covers mounting while the document is already hidden.
 */
export function bindAftercareNoteAutoCollapse(
  windowTarget: PageLifecycleWindow,
  documentTarget: VisibilityDocument,
  collapse: () => void,
): () => void {
  const collapseWhenHidden = () => {
    if (documentTarget.visibilityState !== "visible") collapse();
  };
  const collapseOnPageHide = () => collapse();

  documentTarget.addEventListener("visibilitychange", collapseWhenHidden);
  windowTarget.addEventListener("pagehide", collapseOnPageHide);
  collapseWhenHidden();

  return () => {
    documentTarget.removeEventListener("visibilitychange", collapseWhenHidden);
    windowTarget.removeEventListener("pagehide", collapseOnPageHide);
  };
}
