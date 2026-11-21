import { describe, expect, it } from "vitest";
import { hashDuoInvitationToken, normalizeDuoInvitationToken } from "./duoRoomInvitations";

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
});
