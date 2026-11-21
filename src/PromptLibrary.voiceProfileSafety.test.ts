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
});
