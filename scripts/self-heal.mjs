import fs from "node:fs";

const repairs = [
  {
    id: "auth-hydration-generation-double-current",
    path: "src/main.tsx",
    pattern: /hydrateGeneration\.current\.current/g,
    replacement: "hydrateGeneration.current",
  },
];

let changed = false;
const applied = [];

for (const repair of repairs) {
  if (!fs.existsSync(repair.path)) continue;
  const source = fs.readFileSync(repair.path, "utf8");
  const next = source.replace(repair.pattern, repair.replacement);
  if (next !== source) {
    fs.writeFileSync(repair.path, next);
    changed = true;
    applied.push(repair.id);
  }
}

const value = changed ? "1" : "0";
console.log("SELF_HEAL_CHANGED=" + value);
console.log("SELF_HEAL_REPAIRS=" + (applied.join(",") || "none"));

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, "changed=" + value + "\n");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, "repairs=" + (applied.join(",") || "none") + "\n");
}
