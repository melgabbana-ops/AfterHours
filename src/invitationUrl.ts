export interface ConsumedInvitationUrl {
  token: string | null;
  sanitizedUrl: string;
  hadInviteParameter: boolean;
}

/**
 * Read the one-time invitation token and remove it from the visible URL.
 * The caller keeps the token only in component memory for the preview/accept flow.
 */
export function consumeInvitationTokenFromUrl(href: string): ConsumedInvitationUrl {
  const url = new URL(href);
  const hadInviteParameter = url.searchParams.has("invite");
  const token = url.searchParams.get("invite");
  url.searchParams.delete("invite");
  return {
    token: token && token.length > 0 ? token : null,
    sanitizedUrl: url.toString(),
    hadInviteParameter
  };
}
