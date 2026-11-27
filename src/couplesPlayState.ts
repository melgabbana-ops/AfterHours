export const ROOM_CODE_LENGTH = 16;

export function normalizeRoomCode(value: string | null | undefined): string {
  const code = (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
  return code.length === ROOM_CODE_LENGTH ? code : "";
}

export interface RemotePlayReadiness {
  connected: boolean;
  serverAuthorized: boolean;
  participantCount: number;
  partnerPresent: boolean;
  ownConsent: boolean;
  partnerConsent: boolean;
}

export function canStartRemotePlay(state: RemotePlayReadiness): boolean {
  return state.connected && state.serverAuthorized && state.participantCount === 2 && state.partnerPresent && state.ownConsent && state.partnerConsent;
}

export function shouldPauseRemotePlay(state: {
  connected: boolean;
  active: boolean;
  partnerPresent: boolean;
}): boolean {
  return state.active && (!state.connected || !state.partnerPresent);
}

export function canResumeRemotePlay(state: {
  connected: boolean;
  serverAuthorized: boolean;
  participantCount: number;
  partnerPresent: boolean;
  ownConsent: boolean;
  partnerConsent: boolean;
}): boolean {
  return state.connected && state.serverAuthorized && state.participantCount === 2 && state.partnerPresent && state.ownConsent && state.partnerConsent;
}

export interface CouplesPlayStopChannel {
  send(message: {
    type: "broadcast";
    event: "reset-consent" | "play-state";
    payload: { stopped?: boolean; round?: number; status?: "stopped" };
  }): Promise<unknown>;
}

/** Stop locally first; network notification is best-effort and never gates STOP. */
export function stopCouplesPlayImmediately({
  setOwnConsent,
  setPartnerConsent,
  setStatus,
  setMessage,
  channel,
  round,
  message,
}: {
  setOwnConsent: (value: boolean) => void;
  setPartnerConsent: (value: boolean) => void;
  setStatus: (value: "stopped") => void;
  setMessage: (value: string) => void;
  channel?: CouplesPlayStopChannel | null;
  round: number;
  message: string;
}): void {
  setOwnConsent(false);
  setPartnerConsent(false);
  setStatus("stopped");
  setMessage(message);

  if (!channel) return;
  const sendBestEffort = (event: "reset-consent" | "play-state", payload: { stopped?: boolean; round?: number; status?: "stopped" }) => {
    try {
      void channel.send({ type: "broadcast", event, payload }).catch(() => undefined);
    } catch {
      // A local STOP must remain immediate even if the realtime client throws.
    }
  };
  sendBestEffort("reset-consent", { stopped: true });
  sendBestEffort("play-state", { round, status: "stopped" });
}
