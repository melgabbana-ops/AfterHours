import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/** Recursively include every shipped stylesheet and visual SVG in the palette gate. */
async function collectFiles(directory, matches) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(file, matches);
    return entry.isFile() && matches(entry.name) ? [file] : [];
  }));
  return nested.flat();
}

const sourceStyles = await collectFiles("src", (name) => /\.css$/i.test(name));
const visualAssets = await collectFiles("public/visuals", (name) => /\.svg$/i.test(name));
const files = [...sourceStyles, ...visualAssets].sort();

const forbiddenNames = /--[\w-]*(?:purple|violet|magenta|aubergine|plum)[\w-]*/i;
const forbiddenNamedColors = /\b(?:purple|violet|magenta|fuchsia|indigo|rebeccapurple|darkviolet|darkmagenta|mediumvioletred|blueviolet|orchid|mediumorchid|darkorchid)\b/i;
const forbiddenNamedColorValues = /(?:^|[;{])\s*(?:color|background(?:-color)?|border(?:-[\w-]+)?|outline(?:-color)?|fill|stroke)\s*:[^;{}]*\b(?:pink|hotpink|deeppink|rose|red|darkred|crimson|tomato|salmon|coral|green|lime|blue|cyan|aqua|teal|orange|yellow)\b[^;{}]*[;}]/i;
const failures = [];

function rgbToHsl(r, g, b) {
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

function hexToHsl(hex) {
  const value = hex.slice(1);
  const expanded = value.length === 3 || value.length === 4
    ? value.slice(0, 3).split("").map((part) => part + part).join("")
    : value.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;
  const channels = [0, 2, 4].map((index) => parseInt(expanded.slice(index, index + 2), 16) / 255);
  return rgbToHsl(...channels);
}

function rgbFunctionToHsl(body) {
  const parts = body.trim().replace(/\s*\/\s*/, " ").split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const channels = parts.slice(0, 3).map((part) => {
    const value = Number.parseFloat(part);
    if (!Number.isFinite(value)) return null;
    return Math.max(0, Math.min(1, part.endsWith("%") ? value / 100 : value / 255));
  });
  if (channels.some((value) => value === null)) return null;
  return rgbToHsl(channels[0], channels[1], channels[2]);
}

function hslFunctionToHsl(body) {
  const parts = body.trim().replace(/\s*\/\s*/, " ").split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const hueToken = parts[0].toLowerCase();
  const rawHue = Number.parseFloat(hueToken);
  const saturation = Number.parseFloat(parts[1]) / 100;
  const lightness = Number.parseFloat(parts[2]) / 100;
  if (![rawHue, saturation, lightness].every(Number.isFinite)) return null;
  const hue = hueToken.endsWith("turn") ? rawHue * 360
    : hueToken.endsWith("rad") ? rawHue * (180 / Math.PI)
    : rawHue;
  return { hue: ((hue % 360) + 360) % 360, saturation, lightness };
}

function isOutsideApprovedPalette({ hue, saturation }) {
  const neutral = saturation <= 0.22;
  const champagneGold = hue >= 18 && hue <= 58;
  return !neutral && !champagneGold;
}

for (const file of files) {
  const source = await readFile(file, "utf8");
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  if (forbiddenNames.test(withoutComments)) {
    failures.push(file + ": legacy purple-family custom-property name found");
  }
  if (forbiddenNamedColors.test(withoutComments)) {
    failures.push(file + ": forbidden purple-family color name found");
  }
  if (forbiddenNamedColorValues.test(withoutComments)) {
    failures.push(file + ": named color value outside the approved palette found");
  }

  for (const match of withoutComments.matchAll(/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi)) {
    const color = hexToHsl(match[0]);
    if (color && isOutsideApprovedPalette(color)) failures.push(file + ": off-palette hex color " + match[0]);
  }
  for (const match of withoutComments.matchAll(/rgba?\(\s*([^)]*)\)/gi)) {
    const color = rgbFunctionToHsl(match[1]);
    if (color && isOutsideApprovedPalette(color)) failures.push(file + ": off-palette RGB color " + match[0]);
  }
  for (const match of withoutComments.matchAll(/hsla?\(\s*([^)]*)\)/gi)) {
    const color = hslFunctionToHsl(match[1]);
    if (color && isOutsideApprovedPalette(color)) failures.push(file + ": off-palette HSL color " + match[0]);
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

console.log(
  "Approved palette passed: scanned " + sourceStyles.length +
  " stylesheets and " + visualAssets.length +
  " visual SVGs. Only black, charcoal, champagne-gold, white and warm-neutral colors are allowed.",
);
