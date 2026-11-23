export interface ConsumedInvitationUrl {
  token: string | null;
  sanitizedUrl: string;
  hadInviteParameter: boolean;
}

/**
 * Read a one-time invitation token from the URL fragment (preferred) or the
 * legacy query parameter, then remove every invite parameter from the URL.
 * Fragments are not sent in HTTP requests or Referer headers, unlike queries.
 * The caller keeps the token only in component memory for preview/accept.
 */
export function consumeInvitationTokenFromUrl(href: string): ConsumedInvitationUrl {
  const url = new URL(href);
  const fragment = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const fragmentParams = new URLSearchParams(fragment);
  const hasFragmentInvite = fragmentParams.has("invite");
  const hadInviteParameter = url.searchParams.has("invite") || hasFragmentInvite;
  const token = hasFragmentInvite ? fragmentParams.get("invite") : url.searchParams.get("invite");

  // Keep compatibility with existing query-based links, but never leave a
  // duplicate token in either URL location after the app consumes the link.
  url.searchParams.delete("invite");
  if (hasFragmentInvite) {
    fragmentParams.delete("invite");
    const remainingFragment = fragmentParams.toString();
    url.hash = remainingFragment ? `#${remainingFragment}` : "";
  }

  return {
    token: token && token.length > 0 ? token : null,
    sanitizedUrl: url.toString(),
    hadInviteParameter
  };
}
