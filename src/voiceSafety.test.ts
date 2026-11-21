import { describe, expect, it } from "vitest";
import { getVoiceSafetyIntent, isExplicitVoicePass, isVoiceRecognitionCurrent, stopVoiceRecognition } from "./voiceSafety";

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

describe("explicit voice PASS navigation", () => {
  it("recognizes clear Dutch pass requests", () => {
    for (const phrase of ["PASS!", "nee", "nee bedankt", "ik pas", "ik wil deze overslaan", "sla deze over"]) {
      expect(isExplicitVoicePass(phrase, "nl")).toBe(true);
    }
  });

  it("recognizes clear English pass requests", () => {
    for (const phrase of ["PASS!", "no", "no thanks", "I'll pass", "skip this", "not this one"]) {
      expect(isExplicitVoicePass(phrase, "en")).toBe(true);
    }
  });

  it("does not treat incidental substrings or ordinary sentences as PASS", () => {
    for (const phrase of ["I know", "compass", "passenger", "I passed my exam", "Ik pas mijn jas"]) {
      expect(isExplicitVoicePass(phrase, "en")).toBe(false);
    }
    expect(isExplicitVoicePass("Ik pas mijn jas", "nl")).toBe(false);
  });

  it("does not treat a request not to skip as PASS", () => {
    expect(isExplicitVoicePass("I don't want to skip", "en")).toBe(false);
    expect(isExplicitVoicePass("Do not skip", "en")).toBe(false);
    expect(isExplicitVoicePass("Ik wil niet overslaan", "nl")).toBe(false);
  });
});


describe("voice recognition profile isolation", () => {
  it("accepts callbacks only from the recognizer started for the active profile", () => {
    const originalRecognition = {};
    const replacementRecognition = {};

    expect(isVoiceRecognitionCurrent("profile-a", "profile-a", originalRecognition, originalRecognition)).toBe(true);
    expect(isVoiceRecognitionCurrent("profile-b", "profile-a", originalRecognition, originalRecognition)).toBe(false);
    expect(isVoiceRecognitionCurrent("profile-a", "profile-a", replacementRecognition, originalRecognition)).toBe(false);
  });

  it("rejects callbacks when either profile identity is missing or blank", () => {
    const recognition = {};
    expect(isVoiceRecognitionCurrent("", "", recognition, recognition)).toBe(false);
    expect(isVoiceRecognitionCurrent("   ", "profile-a", recognition, recognition)).toBe(false);
    expect(isVoiceRecognitionCurrent("profile-a", "  ", recognition, recognition)).toBe(false);
  });

  it("detaches every browser callback before stopping recognition", () => {
    const recognition: {
      stop: () => void;
      onstart: unknown;
      onend: unknown;
      onerror: unknown;
      onresult: unknown;
    } = {
      onstart: () => undefined,
      onend: () => undefined,
      onerror: () => undefined,
      onresult: () => undefined,
      stop: () => {
        expect(recognition.onstart).toBeNull();
        expect(recognition.onend).toBeNull();
        expect(recognition.onerror).toBeNull();
        expect(recognition.onresult).toBeNull();
      },
    };

    stopVoiceRecognition(recognition);
  });

  it("does not throw if the browser has already stopped recognition", () => {
    const recognition = {
      onstart: () => undefined,
      onend: () => undefined,
      onerror: () => undefined,
      onresult: () => undefined,
      stop: () => { throw new Error("already stopped"); },
    };

    expect(() => stopVoiceRecognition(recognition)).not.toThrow();
    expect(recognition.onstart).toBeNull();
    expect(recognition.onend).toBeNull();
    expect(recognition.onerror).toBeNull();
    expect(recognition.onresult).toBeNull();
  });
});
