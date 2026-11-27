import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/self-healing.yml"),
  "utf8",
);

describe("self-healing workflow scope", () => {
  it("only starts for completed build runs on main", () => {
    const trigger = workflow.match(/workflow_run:\s*\n([\s\S]*?)(?=\n# Report-only)/)?.[1] ?? "";
    expect(trigger).toContain('workflows: ["AFTER HOURS build"]');
    expect(trigger).toContain("types: [completed]");
    expect(trigger).toMatch(/branches:\s*\[main\]/);
  });

  it("is report-only and cannot write to the repository", () => {
    expect(workflow).toContain("permissions:\n  contents: read");
    expect(workflow).not.toContain("contents: write");
    expect(workflow).not.toContain("git push");
    expect(workflow).not.toContain("git commit");
    expect(workflow).toContain("Automatic source edits and pushes are disabled.");
  });
});

const pagesWorkflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/deploy-pages.yml"),
  "utf8",
);

describe("GitHub Pages workflow deployment boundary", () => {
  it("only validates and packages the static artifact", () => {
    expect(pagesWorkflow).toContain("name: Validate AFTER HOURS GitHub Pages artifact");
    expect(pagesWorkflow).toContain("permissions:\n  contents: read");
    expect(pagesWorkflow).toContain("actions/upload-pages-artifact@v5");
    expect(pagesWorkflow).not.toContain("pages: write");
    expect(pagesWorkflow).not.toContain("id-token: write");
    expect(pagesWorkflow).not.toContain("actions/configure-pages");
    expect(pagesWorkflow).not.toContain("actions/deploy-pages");
    expect(pagesWorkflow).not.toContain("environment:");
  });
});
