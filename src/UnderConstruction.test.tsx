import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import UnderConstruction from "./UnderConstruction";

describe("maintenance screen safety controls", () => {
  it("keeps PAUSE, STOP, and the safety plan available during an active session", () => {
    const markup = renderToStaticMarkup(
      <UnderConstruction
        language="nl"
        sessionStatus="active"
        onPause={() => undefined}
        onStopNow={() => undefined}
        onOpenSafety={() => undefined}
      />,
    );

    expect(markup).toContain("PAUZE");
    expect(markup).toContain("STOP NU");
    expect(markup).toContain("Veiligheidsplan openen");
    expect(markup).toContain("STOP: sessie onmiddellijk stoppen");
  });

  it("keeps STOP available for a paused session without offering PAUSE again", () => {
    const markup = renderToStaticMarkup(
      <UnderConstruction
        language="en"
        sessionStatus="paused"
        onStopNow={() => undefined}
        onOpenSafety={() => undefined}
      />,
    );

    expect(markup).toContain("STOP NOW");
    expect(markup).toContain("Open safety plan");
    expect(markup).not.toContain(">PAUSE</button>");
  });

  it("does not show active-session controls when no session is running", () => {
    const markup = renderToStaticMarkup(<UnderConstruction language="nl" sessionStatus="ready" />);
    expect(markup).not.toContain("STOP NU");
    expect(markup).not.toContain("PAUZE");
  });
});
