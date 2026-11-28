import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../src/CinematicWorld.tsx", import.meta.url),
  "utf8",
);

function extract(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  return source.slice(startIndex, endIndex);
}

const ownerEffect = extract("useLayoutEffect(() => {\n    worldOwnerGenerationRef.current += 1;", "\n  const runMutationRef");
const lockVault = extract("const lockVault = useCallback", "\n\n  useLayoutEffect");
const saveVault = extract("async function saveVaultNote()", "\n  async function unlockVault");
const unlockVault = extract("async function unlockVault(", "\n  async function deleteVaultNote");
const deleteVault = extract("async function deleteVaultNote(", "\n  async function saveDominion");
const saveDominion = extract("async function saveDominion()", "\n  async function saveSensory");
const saveSensory = extract("async function saveSensory()", "\n  async function");

describe("Black Vault owner and lock-session guards", () => {
  it("invalidates pending vault work when the account changes or the vault locks", () => {
    expect(ownerEffect).toContain("vaultSessionGenerationRef.current += 1;");
    expect(lockVault).toContain("vaultSessionGenerationRef.current += 1;");
  });

  it("does not reveal decrypted content after a lock or account change", () => {
    expect(unlockVault).toContain("const passphrase = vaultPassphrase;");
    expect(unlockVault).toContain("const vaultAttempt = ++vaultSessionGenerationRef.current;");
    expect(unlockVault.match(/if \(!isCurrentVaultAttempt\(\)\) return;/g)?.length).toBeGreaterThanOrEqual(3);
    expect(unlockVault).toContain("if (isCurrentVaultAttempt()) {");
    expect(unlockVault).toContain("if (isCurrentVaultAttempt()) setVaultPassphrase(\"\");");
  });

  it("does not save or publish stale encrypted-note UI state after the vault locks", () => {
    expect(saveVault).toContain("const passphrase = vaultPassphrase;");
    expect(saveVault).toContain("const vaultGeneration = vaultSessionGenerationRef.current;");
    expect(saveVault.match(/if \(!isVaultAttemptCurrent\(\)\) return;/g)?.length).toBe(2);
    expect(saveVault).toContain("if (isVaultAttemptCurrent()) {");
    expect(saveVault).toContain("if (isOwnerCurrent()) {");
  });

  it("keeps vault deletion results scoped to the account that confirmed deletion", () => {
    expect(deleteVault).toContain("const ownerId = remoteProfileId;");
    expect(deleteVault).toContain("await deleteWorldRecord(\"vault\", key, ownerId);");
    expect(deleteVault).toContain("if (!isOwnerCurrent()) return;");
    expect(deleteVault).toContain("if (isOwnerCurrent()) {");
  });

  it.each([
    ["Dominion", saveDominion],
    ["Sensory Lab", saveSensory],
  ])("does not let stale %s saves overwrite another account's mutation status", (_name, handler) => {
    expect(handler).toContain("const attempt: WorldOwnerAttempt");
    expect(handler).toContain("if (isOwnerCurrent()) setMessage(");
    expect(handler).toContain("if (isOwnerCurrent()) setBusy(false);");
    expect(handler).toContain("if (isOwnerCurrent()) setError(");
  });
});
