import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const boundaryStart = source.indexOf("class AppErrorBoundary");
const boundaryEnd = source.indexOf("\n\nconst roundTasks", boundaryStart);
const boundary = source.slice(boundaryStart, boundaryEnd);
const handlerStart = boundary.indexOf("handleEmergencyStop=");
const handlerEnd = boundary.indexOf("\n render()", handlerStart);
const handler = boundary.slice(handlerStart, handlerEnd);

const authGateStart = source.indexOf("if(!authReady)return");
const authGateEnd = source.indexOf("if(showColdIntro)", authGateStart);
const authGate = source.slice(authGateStart, authGateEnd);

describe("crash-recovery emergency STOP", () => {
  it("keeps a direct STOP control in the error-boundary fallback", () => {
    expect(boundaryStart).toBeGreaterThanOrEqual(0);
    expect(boundaryEnd).toBeGreaterThan(boundaryStart);
    expect(boundary).toContain('className="safety-stop-action"');
    expect(boundary).toContain('aria-label="STOP: sessie onmiddellijk stoppen"');
    expect(boundary).toContain("onClick={this.handleEmergencyStop}");
    expect(boundary).toContain("STOP NU");
  });

  it("persists and verifies the local STOP before clearing the timer", () => {
    expect(handlerStart).toBeGreaterThanOrEqual(0);
    expect(handler.indexOf("saveState(stoppedState)")).toBeGreaterThanOrEqual(0);
    expect(handler.indexOf("const persisted=loadState()")).toBeGreaterThan(handler.indexOf("saveState(stoppedState)"));
    expect(handler.indexOf("clearTimer(current.profile.id)")).toBeGreaterThan(handler.indexOf("const persisted=loadState()"));
    expect(handler).toContain('persisted.consent.status==="revoked"');
  });

  it("does not wait for network access or server confirmation before local STOP", () => {
    expect(handler).not.toContain("await ");
    expect(handler).not.toContain("revokeRemoteConsent");
    expect(boundary).toContain("serverintrekking wordt opnieuw gecontroleerd zodra de app herstelt");
  });

  it("keeps the crash-screen STOP prominent and keyboard-visible", () => {
    expect(styles).toContain(".gate-card .safety-stop-action");
    expect(styles).toContain(".gate-card .safety-stop-action:focus-visible");
  });
  it("keeps local STOP and safety-plan access available while authentication is restoring", () => {
    expect(authGateStart).toBeGreaterThanOrEqual(0);
    expect(authGateEnd).toBeGreaterThan(authGateStart);
    expect(authGate).toContain('className="safety-stop-action"');
    expect(authGate).toContain('onClick={()=>handleCheckIn("stop")}');
    expect(authGate).toContain('state.session.status==="active"||state.session.status==="paused"');
    expect(authGate).toContain('onClick={()=>setScreen("safety")}');
    expect(authGate).toContain('aria-live="assertive"');
    expect(styles).toContain(".gate-card .gate-safety-link:focus-visible");
  });

});
