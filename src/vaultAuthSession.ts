export interface VaultAuthSession {
  user?: unknown;
}

export interface VaultAuthSubscription {
  unsubscribe(): void;
}

export interface VaultAuthClient {
  onAuthStateChange(
    callback: (event: string, session: VaultAuthSession | null) => void,
  ): {
    data: {
      subscription: VaultAuthSubscription;
    };
  };
}

export interface VaultAuthState {
  event: string;
  authenticated: boolean;
  userId: string | null;
}

/** Return only a real Supabase user id; malformed sessions fail closed. */
function getVaultAuthUserId(user: unknown): string | null {
  if (typeof user !== "object" || user === null) return null;
  const id = (user as { id?: unknown }).id;
  return typeof id === "string" && id.trim().length > 0 ? id : null;
}

/** Detect an account switch without treating the first session as a switch. */
export function hasVaultAuthIdentityChanged(
  currentUserId: string | null,
  nextUserId: string | null,
): boolean {
  return currentUserId !== null
    && nextUserId !== null
    && currentUserId !== nextUserId;
}

/**
 * Keeps the private vault in sync with Supabase authentication changes.
 * The returned cleanup prevents queued callbacks from touching an unmounted view.
 */
export function bindVaultAuthSession(
  auth: VaultAuthClient,
  onChange: (state: VaultAuthState) => void,
): () => void {
  let active = true;
  const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
    if (!active) return;
    const userId = event === "SIGNED_OUT" ? null : getVaultAuthUserId(session?.user);
    onChange({
      event,
      authenticated: userId !== null,
      userId,
    });
  });

  return () => {
    if (!active) return;
    active = false;
    subscription.unsubscribe();
  };
}
