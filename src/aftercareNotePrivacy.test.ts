import mainSource from "./main.tsx?raw";
import { describe, expect, it } from "vitest";

describe("aftercare note privacy scope", () => {
  it("remounts the note editor when the active profile or session changes", () => {
    expect(mainSource).toContain(
      '<AftercareNote key={JSON.stringify([state.profile.id, state.session.id])}',
    );
  });
});
