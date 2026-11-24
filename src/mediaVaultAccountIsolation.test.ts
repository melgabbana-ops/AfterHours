import mainSource from "./main.tsx?raw";
import { describe, expect, it } from "vitest";

describe("Media Vault account isolation", () => {
  it("remounts both private-vault entry points when the authenticated account changes", () => {
    expect(mainSource.match(/<MediaVault key={syncUserId \?\? "local"}/g)).toHaveLength(2);
  });
});
