import { describe, expect, it } from "vitest";
import moodHistorySource from "./MoodHistory.tsx?raw";

describe("mood history account-switch safety", () => {
  it("clears previously displayed private entries before loading a replacement history", () => {
    expect(moodHistorySource).toContain('setLoading(true); setEvents([]); setSource("local")');
  });

  it("checks the request generation before applying asynchronous results", () => {
    expect(moodHistorySource).toContain("const requestId = requestGuard.begin()");
    expect(moodHistorySource).toContain("const isCurrent = () => requestGuard.isCurrent(requestId)");
    expect(moodHistorySource).toContain("if (!isCurrent()) return;");
  });

  it("invalidates pending work when the history view is cleaned up", () => {
    expect(moodHistorySource).toContain("return () => { requestGuardRef.current?.invalidate(); }");
    expect(moodHistorySource).toContain("if (isCurrent()) setLoading(false)");
  });
});
