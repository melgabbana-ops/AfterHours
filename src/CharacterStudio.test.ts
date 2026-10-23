import { describe, expect, it } from "vitest";
import { normalizeCharacterLook } from "./CharacterStudio";

const DEFAULT_LOOK = {
  gender: "female",
  skin: "#B97855",
  hair: "#21151B",
  hairStyle: "waves",
  outfit: "#171019",
  mask: false,
  neckDetail: "collar",
  accessory: "crescent",
};

describe("Character Studio saved appearance validation", () => {
  it("keeps supported appearance choices and ignores unknown properties", () => {
    expect(normalizeCharacterLook({
      gender: "male",
      skin: "#F1D4C2",
      hair: "#5D3470",
      hairStyle: "curls",
      outfit: "#451B2A",
      mask: true,
      neckDetail: "chain",
      accessory: "earring",
      unexpected: "must not be persisted",
    })).toEqual({
      gender: "male",
      skin: "#F1D4C2",
      hair: "#5D3470",
      hairStyle: "curls",
      outfit: "#451B2A",
      mask: true,
      neckDetail: "chain",
      accessory: "earring",
    });
  });

  it("replaces unsupported values with safe defaults", () => {
    expect(normalizeCharacterLook({
      gender: "unknown",
      skin: "url(javascript:alert(1))",
      hair: "#ffffff",
      hairStyle: "not-a-style",
      outfit: "expression(alert(1))",
      mask: "true",
      neckDetail: "unexpected",
      accessory: "<svg onload=alert(1)>",
    })).toEqual(DEFAULT_LOOK);
  });

  it("returns defaults for non-object saved data", () => {
    for (const value of [null, undefined, false, 42, "not an object", [], ["male"]]) {
      expect(normalizeCharacterLook(value)).toEqual(DEFAULT_LOOK);
    }
  });
});
