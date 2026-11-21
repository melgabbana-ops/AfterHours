import { describe, expect, it } from "vitest";
import { createDuoInvitationToken, hashDuoInvitationToken, normalizeDuoInvitationToken } from "./duoRoomInvitations";

describe("secure Duo invitation tokens", () => {
  it("normalizes only complete 256-bit hexadecimal tokens", () => {
    const token = "a".repeat(64);
    expect(normalizeDuoInvitationToken("  " + token.toUpperCase() + "  ")).toBe(token);
    expect(normalizeDuoInvitationToken("a".repeat(63))).toBe("");
    expect(normalizeDuoInvitationToken("g".repeat(64))).toBe("");
    expect(normalizeDuoInvitationToken(null)).toBe("");
  });

  it("rejects malformed invitation tokens before hashing", async () => {
    await expect(hashDuoInvitationToken("room-code-123")).rejects.toThrow("invalid");
  });

  it("hashes a valid invitation token to a SHA-256 digest", async () => {
    const hash = await hashDuoInvitationToken("0".repeat(64));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe("0".repeat(64));
  });

  it("creates a unique 256-bit invitation token and stores only its hash server-side", async () => {
    const first = await createDuoInvitationToken();
    const second = await createDuoInvitationToken();
    expect(first.token).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toBe(await hashDuoInvitationToken(first.token));
    expect(first.token).not.toBe(first.tokenHash);
    expect(second.token).not.toBe(first.token);
  });
});
