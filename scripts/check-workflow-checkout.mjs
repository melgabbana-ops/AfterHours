import { readFileSync } from "node:fs";

const workflowPath = ".github/workflows/build.yml";
const workflow = readFileSync(workflowPath, "utf8");
const lines = workflow.split(/\r?\n/);
const checkoutIndexes = lines
  .map((line, index) => /^\s*- name:\s*Checkout\s*$/.test(line) ? index : -1)
  .filter((index) => index >= 0);

if (checkoutIndexes.length !== 1) {
  throw new Error(`Expected exactly one Checkout step in ${workflowPath}; found ${checkoutIndexes.length}.`);
}

const start = checkoutIndexes[0];
let end = start + 1;
while (end < lines.length && !/^\s*- name:/.test(lines[end])) end += 1;
const checkoutBlock = lines.slice(start, end).join("\n");

if (!/^\s*uses:\s*actions\/checkout@v\d+\s*$/m.test(checkoutBlock)) {
  throw new Error("The build workflow must use the official versioned actions/checkout action.");
}
if (/^\s*ref\s*:/m.test(checkoutBlock)) {
  throw new Error("The build workflow must not override checkout ref; actions/checkout must use the triggering event SHA.");
}
if (!/^\s*fetch-depth:\s*0\s*$/m.test(checkoutBlock)) {
  throw new Error("The build workflow must preserve full Git history with fetch-depth: 0.");
}

console.log("CI checkout guard passed: the build checks out the triggering event SHA and retains full Git history.");
