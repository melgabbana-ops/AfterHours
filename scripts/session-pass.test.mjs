import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/reference-pages.css"), "utf8");

describe("session PASS control styling", () => {
  it("keeps the PASS target finger-friendly and visibly within the gold design system", () => {
    expect(css).toContain(".app .task-card>.pass-task");
    expect(css).toContain("min-height:44px!important");
    expect(css).toContain("var(--ah-champagne-light");
    expect(css).toContain(".app .task-card>.pass-task:focus-visible");
  });
});
