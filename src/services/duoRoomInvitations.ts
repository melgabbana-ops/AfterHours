const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function normalizeDuoInvitationToken(value: string | null | undefined): string {
  const token = (value ?? "").trim().toLowerCase();
  return TOKEN_PATTERN.test(token) ? token : "";
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Generate a one-time 256-bit invitation token and the SHA-256 hash stored by the server. */
export async function createDuoInvitationToken(): Promise<{ token: string; tokenHash: string }> {
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
    throw new Error("Secure invitation links are not supported in this browser.");
  }
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  const token = toHex(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return { token, tokenHash: toHex(new Uint8Array(digest)) };
}

/** Hash a token from an invitation URL before sending it to an authenticated RPC. */
export async function hashDuoInvitationToken(value: string): Promise<string> {
  const token = normalizeDuoInvitationToken(value);
  if (!token) throw new Error("This Duo invitation link is invalid.");
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure invitation links are not supported in this browser.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}
