import { describe, expect, it } from "vitest";
import direction from "../docs/PRODUCT_DIRECTION.md?raw";
import checklist from "../docs/APPROVED_FEATURE_CHECKLIST.md?raw";
import matrix from "../docs/FEATURE_IMPLEMENTATION_MATRIX.md?raw";
import visualBrief from "../docs/APPROVED_VISUAL_UPDATE_FOR_BOLT.md?raw";

describe("AFTER HOURS locked product direction", () => {
  it("defines the approved black, charcoal and champagne palette and explicitly rejects purple", () => {
    expect(direction).toContain("black, charcoal, champagne-gold, white and warm grey");
    expect(direction).toContain("No purple, aubergine, plum, violet or lilac");
    expect(direction).toContain("#C89445");
    expect(direction).toContain("#D7A84F");
  });

  it("marks the former feature checklist palette as superseded", () => {
    expect(checklist.slice(0, 1800)).toContain("supersedes every earlier palette or visual-direction instruction");
    expect(checklist).not.toMatch(/#180A20|#291033|#6D168F|#8E24B7|#7B2CBF|#B13CC7/i);
    expect(checklist.split("\n").filter((line) => line.startsWith("- [ ]")).join("\n")).not.toMatch(/purple|aubergine|plum|violet|lilac/i);
  });

  it("does not present the former plum palette as current", () => {
    expect(matrix).toContain("docs/PRODUCT_DIRECTION.md");
    expect(matrix).toContain("rejected");
    expect(matrix).not.toContain("approved deep-plum palette");
  });

  it("clearly archives the older visual brief", () => {
    expect(visualBrief.slice(0, 600)).toContain("ARCHIVED VISUAL BRIEF");
    expect(visualBrief.slice(0, 600)).toContain("must not be followed");
  });
});
