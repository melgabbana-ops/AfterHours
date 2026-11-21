export const ROOM_CODE_LENGTH = 16;

export function normalizeRoomCode(value: string | null | undefined): string {
  const code = (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
  return code.length === ROOM_CODE_LENGTH ? code : "";
}

export interface RemotePlayReadiness {
  connected: boolean;
  participantCount: number;
  partnerPresent: boolean;
  ownConsent: boolean;
  partnerConsent: boolean;
}

export function canStartRemotePlay(state: RemotePlayReadiness): boolean {
  return state.connected && state.participantCount === 2 && state.partnerPresent && state.ownConsent && state.partnerConsent;
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
  participantCount: number;
  partnerPresent: boolean;
  ownConsent: boolean;
  partnerConsent: boolean;
}): boolean {
  return state.connected && state.participantCount === 2 && state.partnerPresent && state.ownConsent && state.partnerConsent;
}
