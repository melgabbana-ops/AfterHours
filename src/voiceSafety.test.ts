import { describe, expect, it } from "vitest";
import { getVoiceSafetyIntent } from "./voiceSafety";

describe("voice safety intents", () => {
  it("recognizes Dutch STOP words and phrases", () => {
    expect(getVoiceSafetyIntent("Rood", "nl")).toBe("stop");
    expect(getVoiceSafetyIntent("Ik wil niet verder", "nl")).toBe("stop");
    expect(getVoiceSafetyIntent("We stoppen nu", "nl")).toBe("stop");
  });

  it("recognizes English STOP words and phrases", () => {
    expect(getVoiceSafetyIntent("Red", "en")).toBe("stop");
    expect(getVoiceSafetyIntent("I don't want to continue", "en")).toBe("stop");
    expect(getVoiceSafetyIntent("Stop now", "en")).toBe("stop");
  });

  it("recognizes Dutch PAUSE words", () => {
    expect(getVoiceSafetyIntent("Geel", "nl")).toBe("pause");
    expect(getVoiceSafetyIntent("Ik wil even pauze", "nl")).toBe("pause");
  });

  it("recognizes English PAUSE words", () => {
    expect(getVoiceSafetyIntent("Yellow", "en")).toBe("pause");
    expect(getVoiceSafetyIntent("Please slow down", "en")).toBe("pause");
    expect(getVoiceSafetyIntent("I need help", "en")).toBe("pause");
    expect(getVoiceSafetyIntent("Ik voel me onveilig", "nl")).toBe("pause");
  });

  it("gives STOP priority when a transcript contains both STOP and PAUSE", () => {
    expect(getVoiceSafetyIntent("Geel, maar toch rood", "nl")).toBe("stop");
    expect(getVoiceSafetyIntent("Pause, but stop now", "en")).toBe("stop");
  });

  it("does not turn PASS, a negative answer, or ordinary speech into STOP or PAUSE", () => {
    expect(getVoiceSafetyIntent("PASS", "en")).toBeNull();
    expect(getVoiceSafetyIntent("Nee", "nl")).toBeNull();
    expect(getVoiceSafetyIntent("I like this song", "en")).toBeNull();
    expect(getVoiceSafetyIntent("", "nl")).toBeNull();
  });
  it("recognizes a locally configured safeword case-insensitively", () => {
    expect(getVoiceSafetyIntent("Night Owl", "en", { stopWord: "night owl" })).toBe("stop");
    expect(getVoiceSafetyIntent("Please, NIGHT OWL!", "en", { stopWord: "night owl" })).toBe("stop");
  });

  it("recognizes a locally configured multi-word pause signal", () => {
    expect(getVoiceSafetyIntent("Could we use amber light please?", "en", { pauseWord: "amber light" })).toBe("pause");
    expect(getVoiceSafetyIntent("Even een rust teken", "nl", { pauseWord: "rust teken" })).toBe("pause");
  });

  it("requires whole-word or whole-phrase boundaries for custom signals", () => {
    expect(getVoiceSafetyIntent("The night owls are outside", "en", { stopWord: "night owl" })).toBeNull();
    expect(getVoiceSafetyIntent("Amberlighting is pretty", "en", { pauseWord: "amber" })).toBeNull();
  });

  it("gives a configured safeword priority over a configured pause signal", () => {
    expect(getVoiceSafetyIntent("amber light, then night owl", "en", {
      stopWord: "night owl",
      pauseWord: "amber light",
    })).toBe("stop");
  });

  it("ignores empty or punctuation-only configured signals safely", () => {
    expect(getVoiceSafetyIntent("ordinary words", "en", { stopWord: "   ", pauseWord: "" })).toBeNull();
    expect(getVoiceSafetyIntent("Please say a.b.c now", "en", { stopWord: "a.b.c" })).toBe("stop");
  });

});