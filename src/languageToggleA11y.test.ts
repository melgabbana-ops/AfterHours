// @ts-expect-error Node built-ins are available in Vitest, but @types/node is not a direct app dependency.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("persistent language toggle touch targets", () => {
  it("provides 44px controls in the default layout", () => {
    expect(styles).toMatch(/\.language-toggle button\{[^}]*min-height:44px!important/);
  });

  it("preserves 44px language controls on compact screens", () => {
    const compactRules = styles.slice(styles.indexOf("@media(max-width:520px)"));
    expect(compactRules).toContain(".language-toggle button{min-height:44px!important");
  });
});
