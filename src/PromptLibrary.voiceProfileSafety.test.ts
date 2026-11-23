import promptLibrarySource from "./PromptLibrary.tsx?raw";
import { describe, expect, it } from "vitest";

describe("Prompt Library voice profile lifecycle", () => {
  it("binds each speech recognizer to the profile that started it", () => {
    expect(promptLibrarySource).toContain("const voiceProfileIdRef = React.useRef(playerId);");
    expect(promptLibrarySource).toContain("voiceProfileIdRef.current = playerId;");
    expect(promptLibrarySource).toContain("const recognitionProfileId = playerId;");
    expect(promptLibrarySource).toContain("isVoiceRecognitionCurrent(");
    expect(promptLibrarySource).toContain("if (!isCurrentRecognition()) return;");
  });

  it("detaches and stops the old recognizer when the profile changes", () => {
    expect(promptLibrarySource).toContain("const profileIdAtSetup = playerId;");
    expect(promptLibrarySource).toContain("stopVoiceRecognition(recognitionRef.current);");
    expect(promptLibrarySource).toContain("}, [playerId]);");
    expect(promptLibrarySource).toContain("setVoiceTranscript(\"\");");
    expect(promptLibrarySource).toContain("setDomReply(\"\");");
  });
  it("detaches pending browser callbacks when the user manually stops voice input", () => {
    const start = promptLibrarySource.indexOf("const stopVoiceReply =");
    const end = promptLibrarySource.indexOf("const resumeVoiceExperience", start);
    const handler = promptLibrarySource.slice(start, end);
    expect(handler).toContain("cancelCurrentVoiceRecognition();");
    expect(handler).toContain("setVoiceListening(false);");
    expect(handler).not.toContain("recognitionRef.current?.stop()");
  });

  it("detaches the recognizer before applying a spoken STOP or PAUSE action", () => {
    const start = promptLibrarySource.indexOf("const createDomReply =");
    const end = promptLibrarySource.indexOf("const domTitle", start);
    const handler = promptLibrarySource.slice(start, end);
    expect(handler).toContain("cancelCurrentVoiceRecognition();");
    expect(handler.indexOf("cancelCurrentVoiceRecognition();")).toBeLessThan(handler.indexOf('onSafetyAction?.("stop")'));
    expect(handler.indexOf("cancelCurrentVoiceRecognition();")).toBeLessThan(handler.indexOf('onSafetyAction?.("pause")'));
  });

  it("keeps voice input to one reply per tap and warns that it is not continuous safeword monitoring", () => {
    expect(promptLibrarySource).toContain("recognition.continuous = false;");
    expect(promptLibrarySource).toContain('aria-describedby="voice-mode-safety-note"');
    expect(promptLibrarySource).toContain('className="voice-privacy" id="voice-mode-safety-note" role="note"');
    expect(promptLibrarySource).toContain("Spraakherkenning verwerkt één antwoord per druk op de knop.");
    expect(promptLibrarySource).toContain("Speech recognition processes one response per button press.");
    expect(promptLibrarySource).toContain("Always agree on a non-verbal stop signal too");
    expect(promptLibrarySource).toContain("recognition.onend = () => { if (isCurrentRecognition()) setVoiceListening(false); };");
  });

});
