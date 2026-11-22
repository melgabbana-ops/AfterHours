import { describe, expect, it } from "vitest";
import { consumeInvitationTokenFromUrl } from "./invitationUrl";

describe("invitation URL token handling", () => {
  it("extracts the one-time token and removes it from the URL", () => {
    const result = consumeInvitationTokenFromUrl("https://example.test/AfterHours/?screen=cinematic&invite=abc123#section");
    expect(result.token).toBe("abc123");
    expect(result.hadInviteParameter).toBe(true);
    expect(result.sanitizedUrl).toBe("https://example.test/AfterHours/?screen=cinematic#section");
    expect(result.sanitizedUrl).not.toContain("abc123");
  });

  it("removes an empty invitation parameter without returning a token", () => {
    const result = consumeInvitationTokenFromUrl("https://example.test/?invite=&screen=cinematic");
    expect(result.token).toBeNull();
    expect(result.hadInviteParameter).toBe(true);
    expect(result.sanitizedUrl).toBe("https://example.test/?screen=cinematic");
  });

  it("preserves unrelated query parameters and URLs without invitations", () => {
    const href = "https://example.test/?screen=cinematic&lang=nl";
    const result = consumeInvitationTokenFromUrl(href);
    expect(result.token).toBeNull();
    expect(result.hadInviteParameter).toBe(false);
    expect(result.sanitizedUrl).toBe(href);
  });

  it("removes duplicate invitation parameters rather than leaving another token in the URL", () => {
    const result = consumeInvitationTokenFromUrl("https://example.test/?invite=first&invite=second&screen=cinematic");
    expect(result.token).toBe("first");
    expect(result.sanitizedUrl).toBe("https://example.test/?screen=cinematic");
  });
});
