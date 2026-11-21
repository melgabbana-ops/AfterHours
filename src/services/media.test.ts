import { describe, expect, it } from "vitest";
import { collectStoragePages, normalizePrivateMediaMimeType, safeAssignmentPrefix, safeMediaSessionFolder, validatePrivateMediaFile, validatePrivateMediaPath } from "./media";

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

  it("accepts a non-empty video file under the 20 MB limit", () => {
    expect(() => validatePrivateMediaFile({ type: "video/webm", size: 1024 })).not.toThrow();
  });

  it("accepts MediaRecorder MIME values with codec parameters but normalizes storage type", () => {
    expect(normalizePrivateMediaMimeType("video/webm;codecs=vp8,opus")).toBe("video/webm");
    expect(() => validatePrivateMediaFile({ type: "video/webm;codecs=vp8,opus", size: 1024 })).not.toThrow();
    expect(normalizePrivateMediaMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
  });

  it("accepts a non-empty audio file under the 20 MB limit", () => {
    expect(() => validatePrivateMediaFile({ type: "audio/mpeg", size: 1024 })).not.toThrow();
  });

  it("rejects unsupported file types", () => {
    expect(() => validatePrivateMediaFile({ type: "application/pdf", size: 1024 }))
      .toThrow("Kies een afbeelding, audio- of videobestand.");
  });

  it.each(["image/svg+xml", "image/x-custom", "audio/x-custom", "application/octet-stream"])(
    "rejects non-allowlisted MIME type %s",
    (type) => {
      expect(() => validatePrivateMediaFile({ type, size: 1024 }))
        .toThrow("Kies een afbeelding, audio- of videobestand.");
    },
  );

  it("accepts MIME type casing without broadening the allowlist", () => {
    expect(() => validatePrivateMediaFile({ type: "IMAGE/PNG", size: 1024 })).not.toThrow();
    expect(() => validatePrivateMediaFile({ type: "IMAGE/SVG+XML", size: 1024 }))
      .toThrow("Kies een afbeelding, audio- of videobestand.");
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
    ["a space in a filename", "user-123/session/file name.jpg"],
    ["a URL delimiter in a filename", "user-123/session/file?name.jpg"],
    ["a non-ASCII filename", "user-123/session/файл.jpg"],
    ["an empty session segment", "user-123//file.jpg"],
    ["an extra path segment", "user-123/session/subfolder/file.jpg"],
    ["an absolute path", "/user-123/session/file.jpg"],
    ["a Windows-style path", "user-123\\session\\file.jpg"],
  ])("rejects %s", (_label, path) => {
    expect(validatePrivateMediaPath(path, owner)).toBe(false);
  });
});


describe("private assignment media prefix", () => {
  it("omits a prefix when no assignment title is supplied", () => {
    expect(safeAssignmentPrefix()).toBe("");
    expect(safeAssignmentPrefix("   ")).toBe("");
  });

  it("sanitizes separators and control characters before using assignment titles in object names", () => {
    const prefix = safeAssignmentPrefix("../Scene\\\u0000: one");
    expect(prefix).not.toMatch(/[\\/%\u0000-\u001F\u007F]/);
    expect(prefix.endsWith("-")).toBe(true);
    expect(prefix.length).toBeLessThanOrEqual(41);
  });

  it("bounds long assignment titles and normalizes Unicode", () => {
    const prefix = safeAssignmentPrefix("É".repeat(120));
    expect(prefix.length).toBeLessThanOrEqual(41);
    expect(prefix).toMatch(/^[a-zA-Z0-9._-]+$/);
  });
});


describe("private storage pagination", () => {
  const entry = (name: string) => ({
    name,
    id: name,
    metadata: null,
    created_at: null,
  });

  it("loads subsequent pages in 100-item offsets until a short page", async () => {
    const calls: Array<{ offset: number; limit: number }> = [];
    const result = await collectStoragePages(async (offset, limit) => {
      calls.push({ offset, limit });
      if (offset === 0) return Array.from({ length: 100 }, (_, index) => entry(`first-${index}`));
      if (offset === 100) return [entry("last")];
      return [];
    });

    expect(calls).toEqual([{ offset: 0, limit: 100 }, { offset: 100, limit: 100 }]);
    expect(result).toHaveLength(101);
    expect(result[100].name).toBe("last");
  });

  it("checks the next page when the total is an exact multiple of 100", async () => {
    const offsets: number[] = [];
    const result = await collectStoragePages(async (offset) => {
      offsets.push(offset);
      return offset === 0 ? Array.from({ length: 100 }, (_, index) => entry(`item-${index}`)) : [];
    });

    expect(offsets).toEqual([0, 100]);
    expect(result).toHaveLength(100);
  });

  it("propagates storage page errors instead of returning an incomplete archive", async () => {
    await expect(collectStoragePages(async (offset) => {
      if (offset === 0) return [entry("first")];
      throw new Error("storage unavailable");
    })).rejects.toThrow("storage unavailable");
  });
});
