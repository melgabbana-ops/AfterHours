export type AftercareJournalFailure =
  | "storage"
  | "invalidEnvelope"
  | "unsupportedVersion"
  | "authentication"
  | "invalidPayload"
  | "cryptoUnavailable";

export class AftercareJournalError extends Error {
  readonly code: AftercareJournalFailure;

  constructor(code: AftercareJournalFailure) {
    super(code);
    this.name = "AftercareJournalError";
    this.code = code;
  }
}

const messages = {
  nl: {
    storage: "Browseropslag is niet beschikbaar. Je journal is niet gewijzigd en je wijzigingen zijn niet opgeslagen. Controleer je browserinstellingen en probeer opnieuw.",
    invalidEnvelope: "De opgeslagen journalgegevens zijn ongeldig of beschadigd. Er is niets gewijzigd. Verwijder deze gegevens niet als je de notities nog wilt herstellen.",
    unsupportedVersion: "Deze journalversie wordt niet ondersteund. Je opgeslagen gegevens zijn behouden. Werk de app bij voordat je wijzigingen probeert.",
    authentication: "De wachtzin is onjuist of de versleutelde gegevens zijn beschadigd. Er is niets gewijzigd. Probeer opnieuw met je oorspronkelijke wachtzin.",
    invalidPayload: "De ontsleutelde journalinhoud heeft een ongeldig formaat. De opgeslagen gegevens zijn niet gewijzigd.",
    cryptoUnavailable: "Beveiligde versleuteling is niet beschikbaar in deze browser. Je journal is niet geopend en gegevens zijn niet gewijzigd.",
  },
  en: {
    storage: "Browser storage is unavailable. Your journal was not changed and your edits were not saved. Check your browser settings and try again.",
    invalidEnvelope: "The stored journal data is invalid or damaged. Nothing was changed. Do not delete this data if you may need to recover the notes.",
    unsupportedVersion: "This journal version is not supported. Your stored data has been preserved. Update the app before trying to make changes.",
    authentication: "The passphrase is incorrect or the encrypted data is damaged. Nothing was changed. Try again with your original passphrase.",
    invalidPayload: "The decrypted journal content has an invalid format. The stored data was not changed.",
    cryptoUnavailable: "Secure encryption is unavailable in this browser. Your journal was not opened and no data was changed.",
  },
} satisfies Record<"nl" | "en", Record<AftercareJournalFailure, string>>;

export function getAftercareJournalErrorMessage(
  code: AftercareJournalFailure,
  language: "nl" | "en",
): string {
  return messages[language][code];
}

export function getAftercareJournalFailure(
  error: unknown,
  fallback: AftercareJournalFailure = "cryptoUnavailable",
): AftercareJournalFailure {
  return error instanceof AftercareJournalError ? error.code : fallback;
}
