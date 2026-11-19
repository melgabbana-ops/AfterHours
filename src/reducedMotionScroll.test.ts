import { describe, expect, it, vi } from "vitest";
import { scrollIntoViewRespectingMotion } from "./reducedMotionScroll";

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
});
