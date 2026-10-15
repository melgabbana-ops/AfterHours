import { existsSync, readFileSync } from "node:fs";

const approvedPath = "public/after-hours-logo.svg";
const masterPath = "public/icons/after-hours-master.svg";
const approved = readFileSync(approvedPath, "utf8");
const master = readFileSync(masterPath, "utf8");

if (approved !== master) {
  console.error("Canonical master icon must be an exact copy of the approved AFTER HOURS logo.");
  process.exit(1);
}

const html = readFileSync("index.html", "utf8");
const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
const referencedIcons = new Set([
  ...[...html.matchAll(/\/icons\/(after-hours-[a-z0-9-]+\.svg)/g)].map((match) => `public/icons/${match[1]}`),
  ...(manifest.icons ?? []).map((icon) => `public${icon.src}`),
]);

const missing = [...referencedIcons].filter((path) => !existsSync(path));
if (missing.length) {
  console.error("Missing referenced brand assets:", missing.join(", "));
  process.exit(1);
}

for (const required of ["public/after-hours-icon-192.png", "public/after-hours-icon-512.png"]) {
  if (!existsSync(required)) {
    console.error("Missing PWA fallback icon:", required);
    process.exit(1);
  }
}

console.log(`Brand asset guard passed: canonical logo matches master icon; ${referencedIcons.size} referenced SVG/manifest assets exist.`);
