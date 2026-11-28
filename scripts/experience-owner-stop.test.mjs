import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const world = readFileSync(new URL("../src/CinematicWorld.tsx", import.meta.url), "utf8");

describe("Experience Engine owner-scoped STOP recovery", () => {
  it("notifies the mounted Experience Engine before the sign-out screen transition", () => {
    const signedOutStart = main.indexOf('if(event==="SIGNED_OUT"){');
    const signedOutEnd = main.indexOf("if(session?.user){", signedOutStart);
    const signedOut = main.slice(signedOutStart, signedOutEnd);
    const dispatch = signedOut.indexOf('window.dispatchEvent(new Event("afterhours:auth-session-ended"))');
    expect(signedOutStart).toBeGreaterThanOrEqual(0);
    expect(dispatch).toBeGreaterThanOrEqual(0);
    expect(dispatch).toBeLessThan(signedOut.indexOf('setScreen("home")'));
  });

  it("captures the original run owner before clearing active scene state", () => {
    expect(world).toContain("const activeRunOwnerRef = useRef<string | null>(null);");
    expect(world).toContain("const userId = pendingRun?.ownerId ?? activeRunOwnerRef.current ?? remoteProfileId;");
    expect(world).toContain("queuePendingExperienceStopForOwner(runId, ownerId)");
  });

  it("retries pending STOP only after the matching owner is signed in", () => {
    expect(world).toContain("getPendingExperienceStopsForOwner(remoteProfileId)");
    expect(world).toContain("withdrawExperienceConsent(pending.runId, remoteProfileId)");
    expect(world).toContain("updateExperienceRun({");
  });
});
