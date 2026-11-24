// @ts-expect-error Node built-ins are available in Vitest, but @types/node is not a direct app dependency.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");

describe("persistent language toggle accessibility", () => {
  it("provides 44px controls in the default and compact layouts", () => {
    expect(styles).toMatch(/\.language-toggle button\{[^}]*min-height:44px!important/);
    expect(styles).toContain(".language-toggle button{min-height:44px!important");
  });

  it("keeps the header compact on very narrow phones", () => {
    const narrowPhoneRules = styles.slice(styles.indexOf("@media(max-width:360px)"));
    expect(narrowPhoneRules).toContain("header .brand-nav img{max-width:82px!important}");
    expect(narrowPhoneRules).toContain(".header-tools{gap:3px!important}");
  });

  it("exposes the language group and selected language to assistive technology", () => {
    expect(appSource).toContain('className="language-toggle" role="group"');
    expect(appSource).toContain('aria-pressed={language==="nl"}');
    expect(appSource).toContain('aria-pressed={language==="en"}');
  });

  it("provides a visible keyboard focus indicator", () => {
    expect(styles).toContain(".language-toggle button:focus-visible{outline:2px solid");
  });
});
