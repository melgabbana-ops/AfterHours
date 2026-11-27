import { describe, expect, it } from "vitest";
import aftercareJournalSource from "./AftercareJournal.tsx?raw";

function sourceSection(start: string, end: string): string {
  const startIndex = aftercareJournalSource.indexOf(start);
  const endIndex = aftercareJournalSource.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return aftercareJournalSource.slice(startIndex, endIndex);
}

describe("private journal async safety", () => {
  it("checks for a lifecycle lock before decrypting entries after a save", () => {
    const save = sourceSection("const save = async", "const remove = async");
    const writeIndex = save.indexOf("await savePrivateJournalEntry");
    const firstGuardIndex = save.indexOf("if (!canCommit()) return;");
    const readIndex = save.indexOf("await loadPrivateJournalEntries");
    const secondGuardIndex = save.indexOf("if (!canCommit()) return;", firstGuardIndex + 1);

    expect(writeIndex).toBeGreaterThanOrEqual(0);
    expect(firstGuardIndex).toBeGreaterThan(writeIndex);
    expect(readIndex).toBeGreaterThan(firstGuardIndex);
    expect(secondGuardIndex).toBeGreaterThan(readIndex);
  });

  it("checks for a lifecycle lock before decrypting entries after a backup import", () => {
    const backupImport = sourceSection("const importBackup = async", "return <section");
    const writeIndex = backupImport.indexOf("await importPrivateJournalBackup");
    const firstGuardIndex = backupImport.indexOf("if (!canCommit()) return;");
    const readIndex = backupImport.indexOf("await loadPrivateJournalEntries");
    const secondGuardIndex = backupImport.indexOf("if (!canCommit()) return;", firstGuardIndex + 1);

    expect(writeIndex).toBeGreaterThanOrEqual(0);
    expect(firstGuardIndex).toBeGreaterThan(writeIndex);
    expect(readIndex).toBeGreaterThan(firstGuardIndex);
    expect(secondGuardIndex).toBeGreaterThan(readIndex);
  });

  it("reports unexpected delete failures instead of leaving an unhandled rejection", () => {
    const remove = sourceSection("const remove = async", "const exportBackup = async");
    expect(remove).toContain("} catch (reason) {");
    expect(remove).toContain("setError(reason instanceof Error ? reason.message");
  });

  it("prevents draft and selection changes while an async journal operation is running", () => {
    expect(aftercareJournalSource).toContain('onClick={startNew} aria-label={t("Nieuwe notitie","New entry")} disabled={busy}');
    expect(aftercareJournalSource).toContain('onClick={()=>openEntry(entry)} disabled={busy}');
    expect(aftercareJournalSource).toContain('id="ah-journal-title" value={title}');
    expect(aftercareJournalSource).toContain('placeholder={t("Een moment om te bewaren…","A moment to remember…")} disabled={busy}');
    expect(aftercareJournalSource).toContain('id="ah-journal-body" value={body}');
    expect(aftercareJournalSource).toContain('placeholder={t("Schrijf vrijuit. Je woorden worden versleuteld voordat ze worden opgeslagen.", "Write freely. Your words are encrypted before they are stored.")} disabled={busy}');
  });

  it("keeps the manual lock control available while background work is busy", () => {
    expect(aftercareJournalSource).toContain('<button type="button" onClick={() => lock()}>{t("Vergrendelen","Lock vault")}</button>');
  });
});
