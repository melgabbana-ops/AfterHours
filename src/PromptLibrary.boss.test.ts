import { describe, expect, it } from "vitest";
import promptSource from "./PromptLibrary.tsx?raw";

describe("Boss Mode completion controls", () => {
  it("offers separate actions for completing a step and passing it", () => {
    expect(promptSource).toContain("onClick={passBossStep}");
    expect(promptSource).toContain("onClick={completeBossStep}");
    expect(promptSource).toContain('t("PASS · Volgende stap","PASS · Next step")');
    expect(promptSource).toContain('t("Ronde afronden","Complete step")');
  });

  it("does not count a PASS action as a completed step", () => {
    const passHandler = promptSource.slice(
      promptSource.indexOf("const passBossStep"),
      promptSource.indexOf("const toggleSaved"),
    );
    expect(passHandler).not.toContain("markBossStepCompleted");
  });

  it("requires all five explicit step completions before showing full completion", () => {
    const finishHandler = promptSource.slice(
      promptSource.indexOf("const finishBossMode"),
      promptSource.indexOf("const toggleSaved"),
    );
    expect(finishHandler).toContain("isBossModeFullyCompleted(nextCompletedSteps)");
    expect(finishHandler).toContain("PASS blijft zonder straf");
  });

  it("clears in-memory Boss Mode progress when consent or account access is lost", () => {
    const accessGuard = promptSource.slice(
      promptSource.indexOf("if (!experienceStartBlockedReason || !activeGame) return;"),
      promptSource.indexOf("const pool = useMemo"),
    );
    expect(accessGuard).toContain('if (sessionMode === "boss")');
    expect(accessGuard).toContain("setCompletedBossSteps([])");
  });

  it("does not award XP or emit a completion callback from the Boss Mode step controls yet", () => {
    const bossControls = promptSource.slice(
      promptSource.indexOf('{sessionMode === "boss" ? <>'),
      promptSource.indexOf("</> : gameRound < game.rounds.length - 1 ?"),
    );
    expect(bossControls).toContain("onClick={passBossStep}");
    expect(bossControls).toContain("onClick={completeBossStep}");
    expect(bossControls).not.toContain("onComplete(");
  });
});
