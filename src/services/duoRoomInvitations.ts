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

/**
 * Keep the bearer token in the URL fragment. Fragments are not sent in HTTP
 * requests or Referer headers, unlike query-string invitation secrets.
 */
export function createDuoInvitationUrl(baseUrl: string, token: string): string {
  const normalized = normalizeDuoInvitationToken(token);
  if (!normalized) throw new Error("This Duo invitation link is invalid.");
  const url = new URL(baseUrl);
  url.hash = new URLSearchParams({ "duo-invite": normalized }).toString();
  return url.toString();
}

/** Read the invitation token from the fragment without accepting or consuming it. */
export function readDuoInvitationToken(urlValue: string): string {
  try {
    const url = new URL(urlValue);
    return normalizeDuoInvitationToken(new URLSearchParams(url.hash.slice(1)).get("duo-invite"));
  } catch {
    return "";
  }
}
