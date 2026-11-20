import { readFileSync } from "node:fs";

const workflowPath = ".github/workflows/deploy-pages.yml";
const workflow = readFileSync(workflowPath, "utf8");
const deployJob = workflow.match(/(?:^|\n)  deploy:\s*\n([\s\S]*?)(?=\n  [a-zA-Z0-9_-]+:\s*\n|$)/);

const checks = [
  ["production workflow is scoped to main pushes", /(?:^|\n)  push:\s*\n    branches:\s*\[main\]/m.test(workflow)],
  ["manual deployment remains available", /(?:^|\n)  workflow_dispatch:\s*(?:\n|$)/m.test(workflow)],
  ["deploy job exists", Boolean(deployJob)],
  [
    "deploy job requires the main ref and a non-PR event",
    Boolean(deployJob && /if:\s*github\.ref\s*==\s*'refs\/heads\/main'\s*&&\s*github\.event_name\s*!=\s*'pull_request'/.test(deployJob[1])),
  ],
  [
    "unrestricted non-PR deployment guard is absent",
    Boolean(deployJob && !/if:\s*github\.event_name\s*!=\s*'pull_request'/.test(deployJob[1])),
  ],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}

if (failed.length) {
  console.error(`GitHub Pages deployment guard failed ${failed.length} check(s).`);
  process.exit(1);
}

console.log("GitHub Pages production deployment is restricted to main.");
