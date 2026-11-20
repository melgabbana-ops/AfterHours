import { describe, expect, it } from "vitest";
import { extractAppShellPaths, inspectAppShell, resolveAppShellFile } from "./pwa-shell.mjs";

describe("PWA offline app-shell validation", () => {
  it("extracts static asset paths in service-worker order", () => {
    const source = 'const APP_SHELL = [asset(""), asset("manifest.webmanifest"), asset("visuals/home.svg")];';
    expect(extractAppShellPaths(source)).toEqual(["", "manifest.webmanifest", "visuals/home.svg"]);
  });

  it("maps the app root to index.html and public resources to public/", () => {
    expect(resolveAppShellFile("")).toBe("index.html");
    expect(resolveAppShellFile("manifest.webmanifest")).toBe("public/manifest.webmanifest");
  });

  it("rejects dynamic asset paths instead of silently skipping them", () => {
    expect(() => extractAppShellPaths('const APP_SHELL = [asset(dynamicPath)];')).toThrow(/static quoted path/);
  });

  it("rejects absolute and traversal paths", () => {
    expect(() => resolveAppShellFile("/private.json")).toThrow(/relative to the app base/);
    expect(() => resolveAppShellFile("../private.json")).toThrow(/unsafe segment/);
  });

  it("reports missing files and duplicate entries", () => {
    const source = 'const APP_SHELL = [asset(""), asset("manifest.webmanifest"), asset("manifest.webmanifest")];';
    const result = inspectAppShell(source, (file) => file === "index.html");
    expect(result.duplicates).toEqual(["manifest.webmanifest"]);
    expect(result.missing).toEqual(["public/manifest.webmanifest", "public/manifest.webmanifest"]);
  });
});
