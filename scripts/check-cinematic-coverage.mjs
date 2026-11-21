import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const stylesheetPaths = ["src/styles.css", "src/approved-cinematic.css", "src/reference-home.css", "src/reference-pages.css", "src/MoodHistory.css", "src/AftercareMeditation.css", "src/CharacterRankEvolution.css", "src/cinematic-world.css", "src/cinematic-experience.css"];
const styles = (await Promise.all(stylesheetPaths.map((file) => readFile(path.join(root, file), "utf8")))).join("\n");
const sourceFiles = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(fullPath);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) sourceFiles.push(fullPath);
  }
}

await collect(sourceRoot);
const missing = new Map();
const classPattern = /className=(?:"([^"]+)"|'([^']+)'|{`([^`]+)`})/g;
for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(classPattern)) {
    const rawClassValue = match[1] ?? match[2] ?? match[3] ?? "";
    const dynamicPrefixes = [...rawClassValue.matchAll(/([A-Za-z_][a-zA-Z0-9_-]*-)\$\{/g)].map((item) => item[1]);
    const classValue = rawClassValue.replace(/\$\{[^}]*\}/g, " ");
    for (const className of classValue.split(/\s+/).filter(Boolean)) {
      const escaped = className.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
      const selector = new RegExp("\\." + escaped + "(?![\\w-])");
      if (!selector.test(styles)) {
        const relative = path.relative(root, file);
        if (!missing.has(relative)) missing.set(relative, new Set());
        missing.get(relative).add(className);
      }
    }
    for (const prefix of dynamicPrefixes) {
      if (!styles.includes("." + prefix)) {
        const relative = path.relative(root, file);
        if (!missing.has(relative)) missing.set(relative, new Set());
        missing.get(relative).add(prefix + "<dynamic>");
      }
    }
  }
}

if (missing.size) {
  for (const [file, classes] of missing) console.error(file + ": " + [...classes].join(", "));
  console.error("Cinematic style coverage failed. Add styles or remove obsolete class names.");
  process.exit(1);
}
console.log("Cinematic style coverage passed: every static JSX class and every dynamic template-literal class prefix has a matching stylesheet rule.");
