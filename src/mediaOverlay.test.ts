import { describe, expect, it } from "vitest";
import { appendPhotoEditHistory, applyPhotoEditPreset, drawAfterHoursOverlay, getPhotoEditHistoryEntry, getPhotoEditHistoryShortcut, mediaOverlayFrames, normalizePhotoEditTransform, defaultPhotoEditTransform, photoEditPresets, type OverlayFrameStyle } from "./mediaOverlay";

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

describe("photo edit history", () => {
  it("adds snapshots, truncates the redo branch and caps history at 30 entries", () => {
    const first = { style: "clean" as const, edits: defaultPhotoEditTransform };
    const second = { style: "cinematic" as const, edits: { ...defaultPhotoEditTransform, brightness: 1.1 } };
    const history = appendPhotoEditHistory([first, second], 0, { style: "after-hours", edits: defaultPhotoEditTransform });
    expect(history.history.map((entry) => entry.style)).toEqual(["clean", "after-hours"]);
    expect(history.index).toBe(1);
    let capped = appendPhotoEditHistory([], -1, first);
    for (let index = 0; index < 35; index += 1) {
      capped = appendPhotoEditHistory(capped.history, capped.index, { style: "clean", edits: { ...defaultPhotoEditTransform, brightness: .65 + (index % 60) / 100 } });
    }
    expect(capped.history).toHaveLength(30);
  });
  it("moves backward and forward only when a snapshot exists", () => {
    const history = [
      { style: "clean" as const, edits: defaultPhotoEditTransform },
      { style: "cinematic" as const, edits: { ...defaultPhotoEditTransform, contrast: 1.2 } },
    ];
    expect(getPhotoEditHistoryEntry(history, 1, -1)?.index).toBe(0);
    expect(getPhotoEditHistoryEntry(history, 0, -1)).toBeNull();
    expect(getPhotoEditHistoryEntry(history, 0, 1)?.entry.style).toBe("cinematic");
    expect(getPhotoEditHistoryEntry(history, 1, 1)).toBeNull();
  });
});

describe("photo editor keyboard history shortcuts", () => {
  const shortcut = (key: string, options: Partial<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }> = {}) =>
    getPhotoEditHistoryShortcut({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...options });
  it("supports undo and redo on Windows, Mac and hardware keyboards", () => {
    expect(shortcut("z", { ctrlKey: true })).toBe(-1);
    expect(shortcut("z", { metaKey: true })).toBe(-1);
    expect(shortcut("Z", { ctrlKey: true, shiftKey: true })).toBe(1);
    expect(shortcut("y", { ctrlKey: true })).toBe(1);
    expect(shortcut("z", { metaKey: true, shiftKey: true })).toBe(1);
  });
  it("does not claim unrelated or modified shortcuts", () => {
    expect(shortcut("z")).toBeNull();
    expect(shortcut("z", { ctrlKey: true, altKey: true })).toBeNull();
    expect(shortcut("y", { ctrlKey: true, shiftKey: true })).toBeNull();
    expect(shortcut("s", { metaKey: true })).toBeNull();
  });
});
