import { describe, expect, it } from "vitest";
import { safeMediaSessionFolder, validatePrivateMediaFile, validatePrivateMediaPath } from "./media";

describe("private media session folder safety", () => {
  it("uses a general folder for dot path segments", () => {
    expect(safeMediaSessionFolder(".")).toBe("general");
    expect(safeMediaSessionFolder("..")).toBe("general");
  });

  it("keeps normal session identifiers in a safe folder", () => {
    expect(safeMediaSessionFolder("session-456")).toBe("session-456");
    expect(safeMediaSessionFolder("session/456")).toBe("session-456");
  });
});

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

  it.each(["image/svg+xml", "image/x-custom", "audio/x-custom", "application/octet-stream"])(
    "rejects non-allowlisted MIME type %s",
    (type) => {
      expect(() => validatePrivateMediaFile({ type, size: 1024 }))
        .toThrow("Kies een afbeelding of audiobestand.");
    },
  );

  it("accepts MIME type casing without broadening the allowlist", () => {
    expect(() => validatePrivateMediaFile({ type: "IMAGE/PNG", size: 1024 })).not.toThrow();
    expect(() => validatePrivateMediaFile({ type: "IMAGE/SVG+XML", size: 1024 }))
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


describe("private media path validation", () => {
  const owner = "user-123";

  it("accepts a path scoped to the owner, session and filename", () => {
    expect(validatePrivateMediaPath(`${owner}/session-456/file.jpg`, owner)).toBe(true);
  });

  it.each([
    ["another user's folder", "other-user/session/file.jpg"],
    ["a parent traversal segment", "user-123/../secret.jpg"],
    ["a nested traversal segment", "user-123/session/../../secret.jpg"],
    ["URL-encoded traversal", "user-123/session/%2e%2e%2fsecret.jpg"],
    ["double-URL-encoded traversal", "user-123/session/%252e%252e%252fsecret.jpg"],
    ["URL-encoded backslash", "user-123/session/file%5csecret.jpg"],
    ["URL-encoded control character", "user-123/session/file%00.jpg"],
    ["a control character", "user-123/session/file\u0000.jpg"],
    ["an empty session segment", "user-123//file.jpg"],
    ["an extra path segment", "user-123/session/subfolder/file.jpg"],
    ["an absolute path", "/user-123/session/file.jpg"],
    ["a Windows-style path", "user-123\\session\\file.jpg"],
  ])("rejects %s", (_label, path) => {
    expect(validatePrivateMediaPath(path, owner)).toBe(false);
  });
});
