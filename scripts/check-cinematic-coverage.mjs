import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const sourceFiles = [];
const stylesheetFiles = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (/\\.tsx?$/.test(entry.name)) sourceFiles.push(fullPath);
    if (/\\.css$/i.test(entry.name)) stylesheetFiles.push(fullPath);
  }
}

await collect(sourceRoot);
if (stylesheetFiles.length === 0) {
  throw new Error("Cinematic style coverage could not find any CSS files under src/.");
}
const styles = (await Promise.all(stylesheetFiles.map((file) => readFile(file, "utf8")))).join("\\n");
// Parse selector class tokens once. This also lets dynamic class families be
// checked against real selector names rather than a substring of raw CSS.
const cssClasses = new Set(
  [...styles.matchAll(/\\.([_a-zA-Z][\\w-]*)/g)].map((match) => match[1]),
);
const missing = new Map();
const classPattern = /className=(?:"([^"]+)"|'([^']+)'|{\x60([^\x60]+)\x60})/g;

function reportMissing(file, className) {
  const relative = path.relative(root, file);
  if (!missing.has(relative)) missing.set(relative, new Set());
  missing.get(relative).add(className);
}

for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(classPattern)) {
    const rawClassValue = match[1] ?? match[2] ?? match[3] ?? "";
    const dynamicPrefixes = [...rawClassValue.matchAll(/([A-Za-z_][a-zA-Z0-9_-]*-)\\$\\{/g)]
      .map((item) => item[1]);
    const classValue = rawClassValue.replace(/\\$\\{[^}]*\\}/g, " ");
    for (const className of classValue.split(/\\s+/).filter(Boolean)) {
      if (!cssClasses.has(className)) reportMissing(file, className);
    }
    for (const prefix of dynamicPrefixes) {
      if (![...cssClasses].some((selectorClass) => selectorClass.startsWith(prefix))) {
        reportMissing(file, prefix + "<dynamic>");
      }
    }
  }
}

if (missing.size) {
  for (const [file, classes] of missing) console.error(file + ": " + [...classes].join(", "));
  console.error("Cinematic style coverage failed. Add styles or remove obsolete class names.");
  process.exit(1);
}
console.log(`Cinematic style coverage passed: ${sourceFiles.length} source files and ${stylesheetFiles.length} stylesheets scanned; dynamic class families matched against CSS selectors.`);
