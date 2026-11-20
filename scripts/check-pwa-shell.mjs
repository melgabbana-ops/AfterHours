import { existsSync, readFileSync } from "node:fs";
import { inspectAppShell } from "./pwa-shell.mjs";

const source = readFileSync("public/sw.js", "utf8");
let result;
try {
  result = inspectAppShell(source, existsSync);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (result.duplicates.length) {
  console.error("Duplicate offline app-shell entries:", result.duplicates.join(", "));
  process.exit(1);
}
if (result.missing.length) {
  console.error("Offline app-shell assets are missing:", result.missing.join(", "));
  process.exit(1);
}

console.log(`PWA offline app-shell guard passed: ${result.files.length} unique app-shell paths exist in the repository.`);
