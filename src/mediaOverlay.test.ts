import { describe, expect, it, vi } from "vitest";
import { drawAfterHoursOverlay, drawCameraFrame, mediaOverlayFrames, type OverlayFrameStyle } from "./mediaOverlay";

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


describe("live camera frame composition", () => {
  it("does not draw a frame before the camera reports valid dimensions", () => {
    const ctx = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    const video = { videoWidth: 0, videoHeight: 720 } as HTMLVideoElement;
    drawCameraFrame(ctx, video, 1280, 720, "after-hours");
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it("center-crops a portrait camera feed to a landscape preview before applying the overlay", () => {
    const drawImage = vi.fn();
    const ctx = {
      drawImage,
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 8 })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D;
    const video = { videoWidth: 720, videoHeight: 1280 } as HTMLVideoElement;

    drawCameraFrame(ctx, video, 1280, 720, "clean");

    expect(drawImage).toHaveBeenCalledWith(video, 0, 437.5, 720, 405, 0, 0, 1280, 720);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("center-crops a wide camera feed to a portrait preview", () => {
    const drawImage = vi.fn();
    const ctx = {
      drawImage,
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 8 })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D;
    const video = { videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement;

    drawCameraFrame(ctx, video, 720, 1280, "cinematic");

    expect(drawImage).toHaveBeenCalledWith(video, 656.25, 0, 607.5, 1080, 0, 0, 720, 1280);
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
