import { describe, expect, it } from "vitest";
import {
  AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY,
  getAftercareJournalStorageKey,
} from "./aftercareJournalStorage";

describe("getAftercareJournalStorageKey", () => {
  it("returns a stable key for the same profile", () => {
    expect(getAftercareJournalStorageKey("profile-123")).toBe(
      getAftercareJournalStorageKey("profile-123"),
    );
  });

  it("isolates journals belonging to different profiles", () => {
    expect(getAftercareJournalStorageKey("profile-a")).not.toBe(
      getAftercareJournalStorageKey("profile-b"),
    );
  });

  it("does not accept a missing, oversized, or control-character profile id", () => {
    expect(getAftercareJournalStorageKey("")).toBeNull();
    expect(getAftercareJournalStorageKey("   ")).toBeNull();
    expect(getAftercareJournalStorageKey("bad\u0000profile")).toBeNull();
    expect(getAftercareJournalStorageKey("x".repeat(129))).toBeNull();
  });

  it("keeps the legacy unscoped key distinct and unchanged", () => {
    expect(AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY).toBe("afterhours.aftercare-journal.v1");
    expect(getAftercareJournalStorageKey("profile-a")).not.toBe(
      AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY,
    );
  });
});
