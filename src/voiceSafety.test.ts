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
});
