import { describe, expect, it } from "vitest";
import { normalizeCharacterLook } from "./CharacterStudio";

describe("Character Studio appearance", () => {
  it("returns an independent default look for malformed stored values", () => {
    const first = normalizeCharacterLook(null);
    first.skin = "#000000";
    expect(normalizeCharacterLook([]).skin).not.toBe("#000000");
    expect(normalizeCharacterLook("{").gender).toBe("female");
  });

  it("keeps valid appearance choices", () => {
    expect(normalizeCharacterLook({
      gender: "male",
      skin: "#784833",
      hair: "#793B2B",
      hairStyle: "short",
      outfit: "#3b2a1b",
      mask: true,
      neckDetail: "chain",
      accessory: "sigil",
    })).toEqual({
      gender: "male",
      skin: "#784833",
      hair: "#793B2B",
      hairStyle: "short",
      outfit: "#3b2a1b",
      mask: true,
      neckDetail: "chain",
      accessory: "sigil",
    });
  });

  it("rejects unknown colours and option values instead of persisting invalid CSS values", () => {
    expect(normalizeCharacterLook({
      gender: "unknown",
      skin: "url(javascript:alert(1))",
      hair: "#badbad",
      hairStyle: "unknown",
      outfit: "red",
      mask: "yes",
      neckDetail: "unknown",
      accessory: "unknown",
    })).toEqual({
      gender: "female",
      skin: "#B97855",
      hair: "#21151B",
      hairStyle: "waves",
      outfit: "#100e0a",
      mask: false,
      neckDetail: "collar",
      accessory: "crescent",
    });
  });
});
