import mainSource from "./main.tsx?raw";
import { describe, expect, it } from "vitest";

describe("Media Vault privacy isolation", () => {
  it("remounts both private-vault entry points when the account or session changes", () => {
    const sessionBoundKey = '<MediaVault key={`${syncUserId ?? "local"}:${state.session.id}`}';
    expect(mainSource.split(sessionBoundKey).length - 1).toBe(2);
    expect(mainSource).not.toContain('<MediaVault key={syncUserId ?? "local"}');
    expect(mainSource).not.toContain('<MediaVault sessionId={state.session.id}');
  });
});
