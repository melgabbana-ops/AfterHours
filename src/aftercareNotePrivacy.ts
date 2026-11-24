type VisibilityDocument = Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
type PageLifecycleWindow = Pick<Window, "addEventListener" | "removeEventListener">;

/**
 * Hide private aftercare editor content while the document is backgrounded or
 * navigated away from. A pageshow/visibilitychange event restores it on return.
 */
export function bindAftercareEditorPrivacyLock(
  windowTarget: PageLifecycleWindow,
  documentTarget: VisibilityDocument,
  lock: () => void,
  unlock: () => void,
): () => void {
  let isLocked = false;

  const applyLock = (nextLocked: boolean) => {
    if (isLocked === nextLocked) return;
    isLocked = nextLocked;
    if (isLocked) lock();
    else unlock();
  };

  const syncVisibility = () => applyLock(documentTarget.visibilityState !== "visible");
  const lockOnPageHide = () => applyLock(true);
  const syncOnPageShow = () => syncVisibility();

  documentTarget.addEventListener("visibilitychange", syncVisibility);
  windowTarget.addEventListener("pagehide", lockOnPageHide);
  windowTarget.addEventListener("pageshow", syncOnPageShow);
  return () => {
    documentTarget.removeEventListener("visibilitychange", syncVisibility);
    windowTarget.removeEventListener("pagehide", lockOnPageHide);
    windowTarget.removeEventListener("pageshow", syncOnPageShow);
  };
}
