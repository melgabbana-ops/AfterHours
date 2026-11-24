import styles from "./styles.css?raw";
import { describe, expect, it } from "vitest";

describe("persistent language toggle touch targets", () => {
  it("provides 44px controls in the default layout", () => {
    expect(styles).toMatch(/\.language-toggle button\{[^}]*min-height:44px!important/);
  });

  it("preserves 44px language controls on compact screens", () => {
    const compactRules = styles.match(/@media\(max-width:520px\)\{[^}]*\.language-toggle button\{[^}]*\}/)?.[0] ?? "";
    expect(compactRules).toContain("min-height:44px!important");
  });
});
