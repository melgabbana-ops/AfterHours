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
  return state.connected && state.active && !state.partnerPresent;
}

export function canResumeRemotePlay(state: {
  partnerPresent: boolean;
  partnerConsent: boolean;
}): boolean {
  return state.partnerPresent && state.partnerConsent;
}
