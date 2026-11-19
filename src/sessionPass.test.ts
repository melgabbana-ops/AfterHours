import appSource from "./main.tsx?raw";
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
    const passStart = appSource.indexOf('<button type="button" className="pass-task"');
    const passEnd = appSource.indexOf("</button>", passStart);
    const passButton = passStart >= 0 && passEnd >= 0 ? appSource.slice(passStart, passEnd + "</button>".length) : "";
    expect(passButton).toContain("setSelectedTask(PASS_TASK_SELECTION)");
    for (const forbidden of ["stop(", "pauseRound", "revokeConsent", "revokeRemoteConsent", "completeRemoteSession"]) {
      expect(passButton).not.toContain(forbidden);
    }
    expect(passButton).toContain("getSessionSafetyAnnouncement");
    expect(PASS_TASK_SELECTION).toBe("__AFTER_HOURS_PASS__");
  });
});
