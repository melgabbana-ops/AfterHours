import { describe, expect, it } from "vitest";
import promptSource from "./PromptLibrary.tsx?raw";
import mainSource from "./main.tsx?raw";

describe("Prompt Library guided-experience access integration", () => {
  it("blocks direct game and Story chapter starts while consent or account access is unavailable", () => {
    const startGame = promptSource.slice(promptSource.indexOf("const startGame ="), promptSource.indexOf("const chooseSessionMode"));
    const startStoryChapter = promptSource.slice(promptSource.indexOf("const startStoryChapter ="), promptSource.indexOf("const chooseGameVariant"));
    expect(startGame).toContain("if (experienceStartBlockedReason) return;");
    expect(startStoryChapter).toContain("if (experienceStartBlockedReason) return;");
  });

  it("disables Story chapter and experience launch controls while access is blocked", () => {
    expect(promptSource).toContain('disabled={Boolean(experienceStartBlockedReason)} onClick={() => startStoryChapter(index)}');
    expect(promptSource).toContain('disabled={Boolean(experienceStartBlockedReason)} onClick={() => startGame(game.id)}');
    expect(promptSource).toContain('disabled={Boolean(experienceStartBlockedReason)} onClick={() => startStoryChapter(nextStoryChapterIndex)}');
  });

  it("shows an accessible bilingual access notice with an explicit recovery action", () => {
    expect(promptSource).toContain('className="consent-panel experience-access-notice" role="alert" aria-live="assertive"');
    expect(promptSource).toContain("onClick={onRequestConsent}");
    expect(promptSource).toContain("Consent vereist voor begeleide ervaringen");
    expect(promptSource).toContain("Accountstatus niet bevestigd");
  });

  it("exits an active guided game and stops speech recognition when access is lost", () => {
    expect(promptSource).toContain("if (!experienceStartBlockedReason || !activeGame) return;");
    expect(promptSource).toContain("recognitionRef.current?.stop();");
    expect(promptSource).toContain("setActiveGame(null);");
  });

  it("receives the consent and verified-account gate from the app shell", () => {
    expect(mainSource).toContain("getGuidedExperienceBlockReason({");
    expect(mainSource).toContain("experienceStartBlockedReason={experienceStartBlockedReason}");
    expect(mainSource).toContain("onRequestConsent={()=>{if(!consent)setScreen(\"consent\")");
  });
});
