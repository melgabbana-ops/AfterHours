import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/after-hours-build-watch.yml"),
  "utf8",
);
const recoveryJob = workflow.split("  resolve-failure-alert:\n")[1]?.split("\n  report-failure:")[0] ?? "";
const failureJob = workflow.split("  report-failure:\n")[1] ?? "";

describe("AFTER HOURS build-watch alert recovery", () => {
  it("runs recovery only after a successful non-pull-request verification", () => {
    expect(recoveryJob).toContain("needs: verify");
    expect(recoveryJob).toContain("if: success() && github.event_name != 'pull_request'");
    expect(recoveryJob).toContain("uses: actions/github-script@v9");
  });

  it("matches the exact branch before closing an alert", () => {
    expect(recoveryJob).toContain("const branchLine = '- Branch: ' + context.ref;");
    expect(recoveryJob).toContain("line.trim() === branchLine");
    expect(recoveryJob).toContain("issue.title === title");
    expect(recoveryJob).toContain("!issue.pull_request");
    expect(recoveryJob).toContain("state: 'closed'");
  });

  it("records the successful commit and workflow run in the resolution comment", () => {
    expect(recoveryJob).toContain("Verified commit: ' + context.sha");
    expect(recoveryJob).toContain("Successful workflow: ' + runUrl");
    expect(recoveryJob).toContain("Other branch alerts are left unchanged.");
  });

  it("keeps failure reporting limited to failed non-pull-request runs", () => {
    expect(failureJob).toContain("if: failure() && github.event_name != 'pull_request'");
    expect(failureJob).toContain("AFTER HOURS build watch: verification failed");
  });

  it("creates or updates a failure alert only for the exact failing branch", () => {
    expect(failureJob).toContain("const branchLine = '- Branch: ' + context.ref;");
    expect(failureJob).toContain("(issue.body || '').split(/\\r?\\n/).some(line => line.trim() === branchLine)");
    expect(failureJob).toContain("const existing = issues.find(issue =>");
    expect(failureJob).toContain("await github.rest.issues.create({");
    expect(failureJob).not.toContain("issues.find(issue => issue.title === title && !issue.pull_request)");
  });
});
