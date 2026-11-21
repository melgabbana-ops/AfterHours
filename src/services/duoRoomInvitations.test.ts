import { describe, expect, it } from "vitest";
import {
  createDuoInvitationUrl,
  hashDuoInvitationToken,
  normalizeDuoInvitationToken,
  readDuoInvitationToken,
} from "./duoRoomInvitations";

describe("secure Duo invitation tokens", () => {
  it("normalizes only complete 256-bit hexadecimal tokens", () => {
    const token = "a".repeat(64);
    expect(normalizeDuoInvitationToken("  "+token.toUpperCase()+"  ")).toBe(token);
    expect(normalizeDuoInvitationToken("a".repeat(63))).toBe("");
    expect(normalizeDuoInvitationToken("g".repeat(64))).toBe("");
    expect(normalizeDuoInvitationToken(null)).toBe("");
  });

  it("rejects malformed invitation tokens before hashing", async () => {
    await expect(hashDuoInvitationToken("room-code-123")).rejects.toThrow("invalid");
  });

  it("hashes a valid invitation token to a 64-character SHA-256 digest", async () => {
    const hash = await hashDuoInvitationToken("0".repeat(64));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe("0".repeat(64));
  });

  it("places invitation secrets in the URL fragment, not the query string", () => {
    const token = "b".repeat(64);
    const invite = createDuoInvitationUrl("https://example.test/duo?campaign=summer", token);
    const parsed = new URL(invite);
    expect(parsed.search).toBe("?campaign=summer");
    expect(parsed.hash).toBe("#duo-invite=" + token);
    expect(parsed.search).not.toContain(token);
    expect(readDuoInvitationToken(invite)).toBe(token);
  });

  it("rejects malformed tokens and safely ignores unrelated fragments", () => {
    expect(() => createDuoInvitationUrl("https://example.test/duo", "not-a-token")).toThrow("invalid");
    expect(readDuoInvitationToken("https://example.test/duo#section")).toBe("");
    expect(readDuoInvitationToken("not a URL")).toBe("");
  });
});
