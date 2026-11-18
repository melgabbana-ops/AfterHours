import { readFile } from "node:fs/promises";

const files = [
  "src/styles.css",
  "src/approved-cinematic.css",
  "public/visuals/ah-cinematic-hero.svg",
  "public/visuals/ah-experience-photo.svg",
  "public/visuals/ah-aftercare-photo.svg",
  "public/visuals/ah-completion-photo.svg",
];
const forbiddenNames = /purple|violet|magenta|aubergine|plum/i;
const failures = [];

function rgbToHsl(hex) {
  const value = hex.slice(1);
  const expanded = value.length === 3
    ? value.split("").map((part) => part + part).join("")
    : value.slice(0, 6);
  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return { hue, saturation, lightness };
}

for (const file of files) {
  const source = await readFile(file, "utf8");
  if (forbiddenNames.test(source)) failures.push(file + ": legacy purple-family naming found");
  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\\b/g)) {
    const { hue, saturation, lightness } = rgbToHsl(match[0]);
    if (saturation > 0.28 && lightness > 0.08 && hue >= 250 && hue <= 330) {
      failures.push(file + ": purple-family color " + match[0]);
    }
  }
}
const styles = await readFile("src/approved-cinematic.css", "utf8");
if (!styles.includes("--ah-obsidian:#070605") || !styles.includes("--ah-gold:#dfbd83")) {
  failures.push("Approved cinematic tokens must retain the black and warm-gold master palette.");
}
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log("Black-and-gold palette passed: stylesheets and approved 4K visual assets contain no purple-family colors.");
