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

export function canStartLocalPlay(state: { ownConsent: boolean; partnerConsent: boolean; ownName: string; partnerName: string }): boolean {
  return state.ownConsent && state.partnerConsent && state.ownName.trim().length > 0 && state.partnerName.trim().length > 0;
}
