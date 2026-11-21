import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const sourceFiles = [];
const stylesheetFiles = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(fullPath);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) sourceFiles.push(fullPath);
    else if (entry.isFile() && /\.css$/.test(entry.name)) stylesheetFiles.push(fullPath);
  }
}

await collect(sourceRoot);
const styles = (await Promise.all(stylesheetFiles.map((file) => readFile(file, "utf8")))).join("\n");
const missing = new Map();
const classPattern = /className=(?:"([^"]+)"|\'([^\']+)\'|{`([^`]+)`})/g;

function reportMissing(file, className) {
  const relative = path.relative(root, file);
  if (!missing.has(relative)) missing.set(relative, new Set());
  missing.get(relative).add(className);
}

for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(classPattern)) {
    const rawClassValue = match[1] ?? match[2] ?? match[3] ?? "";
    const dynamicPrefixes = [...rawClassValue.matchAll(/([A-Za-z_][a-zA-Z0-9_-]*-)\$\{/g)].map((item) => item[1]);
    const classValue = rawClassValue.replace(/\$\{[^}]*\}/g, " ");
    for (const className of classValue.split(/\s+/).filter(Boolean)) {
      const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const selector = new RegExp("\\." + escaped + "(?![\\w-])");
      if (!selector.test(styles)) reportMissing(file, className);
    }
    for (const prefix of dynamicPrefixes) {
      if (!styles.includes("." + prefix)) reportMissing(file, prefix + "<dynamic>");
    }
  }
}

if (missing.size) {
  for (const [file, classes] of missing) console.error(file + ": " + [...classes].join(", "));
  console.error("Cinematic style coverage failed. Add styles or remove obsolete class names.");
  process.exit(1);
}
console.log("Cinematic style coverage passed: static classes and dynamic class families have stylesheet selectors.");
