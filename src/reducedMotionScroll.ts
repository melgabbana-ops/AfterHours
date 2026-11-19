export type ScrollIntoViewTarget = Pick<HTMLElement, "scrollIntoView">;

/** Reveal a section without forcing animation for people who reduce motion. */
export function scrollIntoViewRespectingMotion(
  target: ScrollIntoViewTarget,
  prefersReducedMotion: boolean,
): void {
  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "center",
  });
}
