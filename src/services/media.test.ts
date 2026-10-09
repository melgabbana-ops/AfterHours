import { describe, expect, it } from "vitest";
import { validatePrivateMediaFile } from "./media";

describe("private media upload validation", () => {
  it("accepts a non-empty image under the 20 MB limit", () => {
    expect(() => validatePrivateMediaFile({ type: "image/jpeg", size: 1024 })).not.toThrow();
  });

  it("accepts a non-empty audio file under the 20 MB limit", () => {
    expect(() => validatePrivateMediaFile({ type: "audio/mpeg", size: 1024 })).not.toThrow();
  });

  it("rejects unsupported file types", () => {
    expect(() => validatePrivateMediaFile({ type: "application/pdf", size: 1024 }))
      .toThrow("Kies een afbeelding of audiobestand.");
  });

  it("rejects empty files", () => {
    expect(() => validatePrivateMediaFile({ type: "image/png", size: 0 }))
      .toThrow("Bestanden moeten kleiner zijn dan 20 MB.");
  });

  it("rejects files larger than 20 MB", () => {
    expect(() => validatePrivateMediaFile({ type: "image/png", size: 20 * 1024 * 1024 + 1 }))
      .toThrow("Bestanden moeten kleiner zijn dan 20 MB.");
  });
});
