import appSource from "./main.tsx?raw";
import referencePagesStyles from "./reference-pages.css?raw";
import { describe, expect, it } from "vitest";
import { PASS_TASK_SELECTION } from "./services/sessionSafety";

describe("AFTER HOURS session PASS control", () => {
  it("offers a dedicated accessible control for skipping the current check-in", () => {
    expect(appSource).toContain('className="pass-task"');
    expect(appSource).toContain("aria-pressed={isTaskPassed(selectedTask)}");
    expect(appSource).toContain("setSelectedTask(PASS_TASK_SELECTION)");
    expect(appSource).toContain('getSessionSafetyAnnouncement("task-passed",language)');
    expect(appSource).toContain("getTaskChoiceFeedback(selectedTask,language)");
    expect(appSource).toContain('"PASS · Deze vraag overslaan","PASS · Skip this question"');
  });

  it("does not turn PASS into STOP, PAUSE, consent revocation or a server write", () => {
    const passButton = appSource.match(/<button type="button" className="pass-task"[\\s\\S]*?<\\/button>/)?.[0] ?? "";
    expect(passButton).toContain("setSelectedTask(PASS_TASK_SELECTION)");
    expect(passButton).not.toMatch(/stop\\(|pauseRound|revokeConsent|revokeRemoteConsent|completeRemoteSession/);
    expect(passButton).toContain("getSessionSafetyAnnouncement");
    expect(PASS_TASK_SELECTION).toBe("__AFTER_HOURS_PASS__");
  });

  it("keeps the PASS target finger-friendly and visibly within the gold design system", () => {
    expect(referencePagesStyles).toContain(".app .task-card>.pass-task");
    expect(referencePagesStyles).toContain("min-height:44px!important");
    expect(referencePagesStyles).toContain("var(--ah-champagne-light");
    expect(referencePagesStyles).toContain(".app .task-card>.pass-task:focus-visible");
  });
});
