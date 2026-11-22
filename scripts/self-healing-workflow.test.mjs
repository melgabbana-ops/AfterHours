import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/self-healing.yml"),
  "utf8",
);

describe("self-healing workflow scope", () => {
  it("only starts for completed build runs on main", () => {
    const trigger = workflow.match(/workflow_run:\s*\n([\s\S]*?)(?=\npermissions:)/)?.[1] ?? "";
    expect(trigger).toContain('workflows: ["AFTER HOURS build"]');
    expect(trigger).toContain("types: [completed]");
    expect(trigger).toMatch(/branches:\s*\[main\]/);
  });

  it("keeps the privileged repair job guarded to failed main builds", () => {
    expect(workflow).toContain("github.event.workflow_run.conclusion == 'failure'");
    expect(workflow).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(workflow).toContain("!contains(github.event.workflow_run.head_commit.message, '[self-heal]')");
  });
});
