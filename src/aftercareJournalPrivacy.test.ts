import journalSource from "./AftercareJournal.tsx?raw";
import { describe, expect, it } from "vitest";

describe("Aftercare Journal privacy auto-lock", () => {
  it("locks when the browser tab or app becomes hidden", () => {
    expect(journalSource).toContain('document.addEventListener("visibilitychange",lockWhenHidden)');
    expect(journalSource).toContain('if(document.visibilityState!=="visible")lock();');
    expect(journalSource).toContain('window.addEventListener("pagehide",lockOnPageHide)');
  });

  it("removes visibility listeners when the journal unmounts", () => {
    expect(journalSource).toContain('document.removeEventListener("visibilitychange",lockWhenHidden)');
    expect(journalSource).toContain('window.removeEventListener("pagehide",lockOnPageHide)');
  });

  it("clears the passphrase, decrypted entries and unsaved form fields when locking", () => {
    expect(journalSource).toContain('setUnlocked(false);setPass("");setEntries([]);setTitle("");setFeeling("");setNeeds("");setReflection("");');
    expect(journalSource).toContain("lockGeneration.current+=1;");
  });

  it("invalidates in-flight unlock and save work after the journal is locked", () => {
    expect(journalSource.match(/generation!==lockGeneration\.current/g)).toHaveLength(4);
    expect(journalSource).toContain('if(generation===lockGeneration.current)setMessage(');
    expect(journalSource).toContain('if(generation===lockGeneration.current)setSaving(false);');
  });

  it("explains automatic locking and loss of unsaved draft text in Dutch and English", () => {
    expect(journalSource).toContain("Journal automatisch vergrendeld toen de app naar de achtergrond ging. Niet-opgeslagen tekst is gewist.");
    expect(journalSource).toContain("Journal automatically locked when the app went into the background. Unsaved text was cleared.");
  });
});
