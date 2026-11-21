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
    const dynamicPrefixes = [...rawClassValue.matchAll(/([A-Za-z_][\\w-]*-)\\$\\{/g)].map((item) => item[1]);
    const classValue = rawClassValue.replace(/\\$\\{[^}]*\\}/g, " ");
    const declaredClasses = classValue.split(/\\s+/).filter(Boolean);
    const hasSelector = (className) => {
      const escaped = className.replace(/[.*+?^\\${}()|[\\]\\\\]/g, "\\\\$&");
      return new RegExp("\\\\." + escaped + "(?![\\\\w-])").test(styles);
    };
    const hasDynamicSelector = (prefix) => {
      const escaped = prefix.replace(/[.*+?^\\${}()|[\\]\\\\]/g, "\\\\$&");
      return new RegExp("\\\\." + escaped + "[\\\\w-]+(?![\\\\w-])").test(styles);
    };
    const missingClasses = declaredClasses.filter((className) => !hasSelector(className));
    const missingPrefixes = dynamicPrefixes.filter((prefix) => !hasDynamicSelector(prefix));
    if (missingClasses.length || missingPrefixes.length) {
      const relative = path.relative(root, file);
      if (!missing.has(relative)) missing.set(relative, new Set());
      for (const className of missingClasses) missing.get(relative).add(className);
      for (const prefix of missingPrefixes) missing.get(relative).add(prefix + "<dynamic>");
    }
  }
}

if (missing.size) {
  for (const [file, classes] of missing) console.error(file + ": " + [...classes].join(", "));
  console.error("Cinematic style coverage failed. Add styles or remove obsolete class names.");
  process.exit(1);
}
console.log("Cinematic style coverage passed: every static JSX class and every dynamic template-literal class prefix has a matching stylesheet rule.");
