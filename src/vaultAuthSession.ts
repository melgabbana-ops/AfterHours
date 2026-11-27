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
    onChange({
      event,
      authenticated: event !== "SIGNED_OUT" && Boolean(session?.user),
    });
  });

  return () => {
    if (!active) return;
    active = false;
    subscription.unsubscribe();
  };
}
