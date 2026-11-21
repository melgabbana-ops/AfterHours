import { describe, expect, it } from "vitest";
import { drawAfterHoursOverlay, mediaOverlayFrames, normalizePhotoEditTransform, defaultPhotoEditTransform, type OverlayFrameStyle } from "./mediaOverlay";

describe("AFTER HOURS camera overlay presets", () => {
  it("exposes the three approved overlay styles in the approved order", () => {
    expect(mediaOverlayFrames.map((frame) => frame.id)).toEqual(["clean", "after-hours", "cinematic"]);
    expect(new Set(mediaOverlayFrames.map((frame) => frame.id)).size).toBe(3);
  });
  it("has bilingual labels and guidance for every frame", () => {
    expect(mediaOverlayFrames.every((frame) => frame.titleNL && frame.titleEN && frame.descriptionNL && frame.descriptionEN)).toBe(true);
  });
  it("uses a finite set of supported overlay variants", () => {
    const styles: OverlayFrameStyle[] = mediaOverlayFrames.map((frame) => frame.id);
    expect(styles.includes("after-hours")).toBe(true);
    expect(styles.every((style) => ["clean", "after-hours", "cinematic"].includes(style))).toBe(true);
  });
  it("uses neutral black rather than purple-tinted shadows in every overlay preset", () => {
    const source = drawAfterHoursOverlay.toString();
    expect(source).not.toMatch(/rgba\(7,\s*5,\s*9|rgba\(5,\s*4,\s*7/);
    expect(source).toContain("rgba(5,5,5");
  });
});

describe("local photo editor transforms", () => {
  it("starts with a neutral, non-destructive transform", () => {
    expect(defaultPhotoEditTransform).toEqual({ rotation: 0, zoom: 1, offsetX: 0, offsetY: 0 });
  });
  it("clamps zoom and image position to supported bounds", () => {
    expect(normalizePhotoEditTransform({ rotation: 90, zoom: 9, offsetX: -4, offsetY: 3 })).toEqual({
      rotation: 90, zoom: 2.5, offsetX: -1, offsetY: 1,
    });
  });
  it("rejects unsupported rotation values and non-finite controls", () => {
    expect(normalizePhotoEditTransform({ rotation: 45 as 0, zoom: Number.NaN, offsetX: Number.POSITIVE_INFINITY, offsetY: Number.NaN })).toEqual(defaultPhotoEditTransform);
  });
});
