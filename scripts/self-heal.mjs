import fs from "node:fs";

const repairs = [
  {
    path: "src/main.tsx",
    replacements: [
      [/generation([!=]=+)(?!\\.)hydrateGeneration/g, "generation$1hydrateGeneration.current"],
    ],
  },
];

let changed = false;

for (const repair of repairs) {
  let source = fs.readFileSync(repair.path, "utf8");
  for (const [pattern, replacement] of repair.replacements) {
    const next = source.replace(pattern, replacement);
    if (next !== source) {
      source = next;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(repair.path, source);
}

console.log(`SELF_HEAL_CHANGED=${changed ? "1" : "0"}`);
