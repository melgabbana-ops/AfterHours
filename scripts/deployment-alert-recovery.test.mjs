import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/after-hours-deployment-alerts.yml"),
  "utf8",
);
const script = workflow.split("          script: |\n")[1] ?? "";

describe("AFTER HOURS deployment alert recovery", () => {
  it("runs only for terminal deployment outcomes", () => {
    expect(workflow).toContain("github.event.deployment_status.state == 'success'");
    expect(workflow).toContain("github.event.deployment_status.state == 'failure'");
    expect(workflow).toContain("github.event.deployment_status.state == 'error'");
  });

  it("ignores out-of-order success events from superseded deployments", () => {
    expect(script).toContain("github.rest.repos.listDeployments");
    expect(script).toContain("environment,");
    expect(script).toContain("per_page: 1");
    expect(script).toContain("latestDeployment.id !== deployment.id");
    expect(script).toContain("Ignoring a success event from a superseded deployment.");
  });

  it("closes only failure and error alerts for the exact recovered environment", () => {
    const recovery = script.split("if (state === 'success') {")[1]?.split("\n            }\n\n            const title")[0] ?? "";
    expect(recovery).toContain("!issue.pull_request");
    expect(recovery).toContain("'AFTER HOURS deployment failure: ' + environment");
    expect(recovery).toContain("'AFTER HOURS deployment error: ' + environment");
    expect(recovery).toContain("state: 'closed'");
    expect(recovery).not.toContain("'AFTER HOURS deployment success: '");
  });

  it("records the successful commit, deployment and workflow before closing an alert", () => {
    const recovery = script.split("if (state === 'success') {")[1]?.split("\n            }\n\n            const title")[0] ?? "";
    expect(recovery).toContain("Verified commit: ' + sha");
    expect(recovery).toContain("Deployment ID: ' + deployment.id");
    expect(recovery).toContain("Successful workflow: ' + runUrl");
    expect(recovery).toContain("Alerts for other environments are left unchanged.");
    expect(recovery.indexOf("github.rest.issues.createComment")).toBeLessThan(
      recovery.indexOf("github.rest.issues.update"),
    );
  });

  it("keeps failure and error reporting scoped to the exact environment", () => {
    const reporting = script.split("const title = 'AFTER HOURS deployment ' + state")[1] ?? "";
    expect(reporting).toContain("const existing = issues.find(issue => issue.title === title && !issue.pull_request)");
    expect(reporting).toContain("github.rest.issues.createComment");
    expect(reporting).toContain("github.rest.issues.create");
  });

  it("does not create noisy success issues when there is no matching failure to recover", () => {
    const recovery = script.split("if (state === 'success') {")[1]?.split("\n            }\n\n            const title")[0] ?? "";
    expect(recovery).toContain("if (recoveredAlerts.length === 0)");
    expect(recovery).toContain("return;");
  });
});
