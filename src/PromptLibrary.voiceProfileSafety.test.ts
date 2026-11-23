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
  it("keeps voice input to one reply per tap and warns that it is not continuous safeword monitoring", () => {
    expect(promptLibrarySource).toContain("recognition.continuous = false;");
    expect(promptLibrarySource).toContain('aria-describedby="voice-mode-safety-note"');
    expect(promptLibrarySource).toContain("id=\"voice-mode-safety-note\" role=\"note\"");
    expect(promptLibrarySource).toContain("Spraakherkenning verwerkt één antwoord per druk op de knop.");
    expect(promptLibrarySource).toContain("Speech recognition processes one response per button press.");
    expect(promptLibrarySource).toContain("Always agree on a non-verbal stop signal too");
    expect(promptLibrarySource).toContain("recognition.onend = () => { if (isCurrentRecognition()) setVoiceListening(false); };");
  });

});
