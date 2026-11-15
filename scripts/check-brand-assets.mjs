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
const serviceWorker = readFileSync("public/sw.js", "utf8");
const appSource = readFileSync("src/main.tsx", "utf8");
const appStyles = readFileSync("src/styles.css", "utf8");
const referencedIcons = new Set([
  ...[...html.matchAll(/(?:href|src)="\/(icons\/after-hours-[a-z0-9-]+\.(?:svg|png)|after-hours-[a-z0-9-]+\.(?:svg|png))"/g)].map((match) => `public/${match[1]}`),
  ...(manifest.icons ?? []).map((icon) => `public${icon.src}`),
  ...[...serviceWorker.matchAll(/"\/(after-hours-[a-z0-9-]+\.(?:svg|png))"/g)].map((match) => `public/${match[1]}`),
]);

const missing = [...referencedIcons].filter((path) => !existsSync(path));
if (missing.length) {
  console.error("Missing referenced brand assets:", missing.join(", "));
  process.exit(1);
}

if (!html.includes('rel="apple-touch-icon"') || !html.includes("/after-hours-icon-180.png")) {
  console.error("The iOS home-screen touch icon must reference the current 512px PNG asset.");
  process.exit(1);
}

if ((appSource.split('"/after-hours-brand-logo.svg"').length - 1) < 4 || appSource.includes("/after-hours-wordmark.svg")) {
  console.error("The approved logo must be used in the app header, home screen and access/recovery gates.");
  process.exit(1);
}

for (const selector of [".home-wordmark", ".brand-nav", ".gate-logo"]) {
  if (!appStyles.includes(selector)) {
    console.error("Missing responsive logo styling for:", selector);
    process.exit(1);
  }
}

for (const iconPath of ["/after-hours-icon-192.png", "/after-hours-brand-logo.svg"]) {
  if (!serviceWorker.includes(iconPath)) {
    console.error("Service worker does not reference the current app icon:", iconPath);
    process.exit(1);
  }
}

if (serviceWorker.includes("/after-hours-icon-192.svg")) {
  console.error("Service worker still references the retired 192px SVG icon.");
  process.exit(1);
}

for (const required of ["public/after-hours-icon-192.png", "public/after-hours-icon-180.png", "public/after-hours-icon-512.png", "public/after-hours-brand-logo.svg"]) {
  if (!existsSync(required)) {
    console.error("Missing PWA fallback icon:", required);
    process.exit(1);
  }
}

console.log(`Brand asset guard passed: canonical logo matches master icon; app placements, responsive styles, PWA icons and ${referencedIcons.size} referenced assets verified.`);
