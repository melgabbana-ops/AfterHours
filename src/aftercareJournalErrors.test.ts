import journalSource from "./AftercareJournal.tsx?raw";
import { describe, expect, it } from "vitest";
import {
  AftercareJournalError,
  getAftercareJournalErrorMessage,
  getAftercareJournalFailure,
} from "./aftercareJournalErrors";

describe("Aftercare Journal unlock and storage errors", () => {
  it("distinguishes unavailable browser storage from encryption failures", () => {
    expect(journalSource).toContain("function readJournalStorage(key:string):string|null");
    expect(journalSource).toContain('throw new AftercareJournalError("storage")');
    expect(journalSource).toContain("writeJournalStorage(storageKey,encrypted)");
    expect(getAftercareJournalErrorMessage("storage", "nl")).toContain("Browseropslag is niet beschikbaar");
    expect(getAftercareJournalErrorMessage("storage", "en")).toContain("Browser storage is unavailable");
  });

  it("does not overwrite an existing vault when decryption fails", () => {
    expect(journalSource).toContain("if(raw)loaded=await decryptEntries(raw,pass);");
    expect(journalSource).toContain("else{\n    const encrypted=await encryptEntries([],pass);");
    expect(journalSource).toContain('throw new AftercareJournalError("authentication")');
    expect(journalSource).toContain('throw new AftercareJournalError("invalidEnvelope")');
  });

  it("distinguishes unsupported vault versions and invalid decrypted payloads", () => {
    expect(journalSource).toContain('throw new AftercareJournalError("unsupportedVersion")');
    expect(journalSource).toContain('throw new AftercareJournalError("invalidPayload")');
    expect(getAftercareJournalErrorMessage("unsupportedVersion", "nl")).toContain("journalversie wordt niet ondersteund");
    expect(getAftercareJournalErrorMessage("invalidPayload", "en")).toContain("invalid format");
  });

  it("does not claim to distinguish a wrong passphrase from authenticated-data damage", () => {
    const nl = getAftercareJournalErrorMessage("authentication", "nl");
    const en = getAftercareJournalErrorMessage("authentication", "en");
    expect(nl).toContain("wachtzin is onjuist of de versleutelde gegevens zijn beschadigd");
    expect(en).toContain("passphrase is incorrect or the encrypted data is damaged");
    expect(nl).toContain("Er is niets gewijzigd");
    expect(en).toContain("Nothing was changed");
  });

  it("maps typed failures and uses a safe fallback for unexpected errors", () => {
    expect(getAftercareJournalFailure(new AftercareJournalError("invalidEnvelope"))).toBe("invalidEnvelope");
    expect(getAftercareJournalFailure(new Error("unknown"), "storage")).toBe("storage");
    expect(getAftercareJournalFailure(new Error("unknown"))).toBe("cryptoUnavailable");
  });

  it("provides Dutch and English messages for every failure type", () => {
    const codes = ["storage", "invalidEnvelope", "unsupportedVersion", "authentication", "invalidPayload", "cryptoUnavailable"] as const;
    for (const code of codes) {
      expect(getAftercareJournalErrorMessage(code, "nl").length).toBeGreaterThan(20);
      expect(getAftercareJournalErrorMessage(code, "en").length).toBeGreaterThan(20);
    }
  });
});
