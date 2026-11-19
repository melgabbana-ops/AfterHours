import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { scrollIntoViewRespectingMotion } from "./reducedMotionScroll";

const consentSource = readFileSync(new URL("./ConsentScreen.tsx", import.meta.url), "utf8");

describe("reduced-motion aware consent navigation", () => {
  it("uses immediate scrolling when the operating system requests reduced motion", () => {
    const scrollIntoView = vi.fn();

    scrollIntoViewRespectingMotion({ scrollIntoView }, true);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
  });

  it("keeps smooth scrolling for users who have not requested reduced motion", () => {
    const scrollIntoView = vi.fn();

    scrollIntoViewRespectingMotion({ scrollIntoView }, false);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
  });

  it("wires the consent boundary shortcut to the operating-system motion preference", () => {
    expect(consentSource).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)")');
    expect(consentSource).toContain("scrollIntoViewRespectingMotion(note, prefersReducedMotion)");
  });
});
