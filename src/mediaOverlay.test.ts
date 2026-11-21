import { describe, expect, it } from "vitest";
import { applyPhotoEditPreset, drawAfterHoursOverlay, mediaOverlayFrames, normalizePhotoEditTransform, defaultPhotoEditTransform, photoEditPresets, type OverlayFrameStyle } from "./mediaOverlay";

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
    expect(defaultPhotoEditTransform).toEqual({ rotation: 0, zoom: 1, offsetX: 0, offsetY: 0, brightness: 1, contrast: 1, saturation: 1, warmth: 0 });
  });
  it("clamps zoom and image position to supported bounds", () => {
    expect(normalizePhotoEditTransform({ rotation: 90, zoom: 9, offsetX: -4, offsetY: 3, brightness: 9, contrast: 9, saturation: 9, warmth: 9 })).toEqual({
      rotation: 90, zoom: 2.5, offsetX: -1, offsetY: 1, brightness: 1.35, contrast: 1.4, saturation: 1.8, warmth: 1,
    });
  });
  it("rejects unsupported rotation values and non-finite controls", () => {
    expect(normalizePhotoEditTransform({ rotation: 45 as 0, zoom: Number.NaN, offsetX: Number.POSITIVE_INFINITY, offsetY: Number.NaN, brightness: Number.NaN, contrast: Number.NaN, saturation: Number.NaN, warmth: Number.NaN })).toEqual(defaultPhotoEditTransform);
  });
});

describe("photo color grading bounds", () => {
  it("keeps color controls within safe, predictable ranges", () => {
    expect(normalizePhotoEditTransform({ ...defaultPhotoEditTransform, brightness: 0, contrast: 9, saturation: -2, warmth: -8 })).toMatchObject({
      brightness: 0.65, contrast: 1.4, saturation: 0, warmth: -1,
    });
  });
});

describe("local photo editor presets", () => {
  it("provides five named, bilingual color looks", () => {
    expect(photoEditPresets.map((preset) => preset.id)).toEqual(["natural", "warm", "cinematic", "monochrome", "soft"]);
    expect(photoEditPresets.every((preset) => preset.titleNL && preset.titleEN)).toBe(true);
  });
  it("changes only color grading and preserves crop and rotation", () => {
    const edited = applyPhotoEditPreset({ ...defaultPhotoEditTransform, rotation: 90, zoom: 1.8, offsetX: .3 }, "cinematic");
    expect(edited).toMatchObject({ rotation: 90, zoom: 1.8, offsetX: .3, brightness: .94, contrast: 1.22, saturation: .82, warmth: .12 });
  });
  it("uses a true zero-saturation monochrome preset", () => {
    expect(applyPhotoEditPreset(defaultPhotoEditTransform, "monochrome").saturation).toBe(0);
  });
});
