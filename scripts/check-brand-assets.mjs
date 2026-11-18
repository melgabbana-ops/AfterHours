import { existsSync, readFileSync } from "node:fs";

function assertPngDimensions(path, expectedWidth, expectedHeight) {
  const png = readFileSync(path);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (png.length < 24 || !png.subarray(0, 8).equals(signature)) {
    console.error(`PWA icon is missing or is not a valid PNG: ${path}`);
    process.exit(1);
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    console.error(`PWA icon ${path} must be ${expectedWidth}x${expectedHeight}; found ${width}x${height}.`);
    process.exit(1);
  }
}

for (const [path, width, height] of [
  ["public/after-hours-icon-180.png", 180, 180],
  ["public/after-hours-icon-192.png", 192, 192],
  ["public/after-hours-icon-512.png", 512, 512],
]) {
  assertPngDimensions(path, width, height);
}

const approvedPath = "public/after-hours-logo.svg";
const masterPath = "public/icons/after-hours-master.svg";
const approved = readFileSync(approvedPath, "utf8");
const master = readFileSync(masterPath, "utf8");
const fullBrand = readFileSync("public/after-hours-brand-logo.svg", "utf8");

if (approved !== master) {
  console.error("Canonical master icon must be an exact copy of the approved AFTER HOURS logo.");
  process.exit(1);
}

const html = readFileSync("index.html", "utf8");
if (!fullBrand.includes("AFTER HOURS") || !fullBrand.includes("L512 150") || !fullBrand.includes("C430 748")) {
  console.error("Primary brand emblem must contain the full AFTER HOURS name, crown and crescent moon.");
  process.exit(1);
}
if (!html.includes("og:image") || !html.includes("twitter:image") || !html.includes("after-hours-brand-logo.svg")) {
  console.error("Social previews must reference the full primary AFTER HOURS emblem.");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
const serviceWorker = readFileSync("public/sw.js", "utf8");
const appSource = readFileSync("src/main.tsx", "utf8");
const appStyles = readFileSync("src/styles.css", "utf8");
const maintenanceSource = readFileSync("src/UnderConstruction.tsx", "utf8");
const teaserSource = readFileSync("src/Teaser.tsx", "utf8");
const onboardingSource = readFileSync("src/Onboarding.tsx", "utf8");
const referencedIcons = new Set([
  ...[...html.matchAll(/(?:href|src)="\/(icons\/after-hours-[a-z0-9-]+\.(?:svg|png)|after-hours-[a-z0-9-]+\.(?:svg|png))"/g)].map((match) => `public/${match[1]}`),
  ...(manifest.icons ?? []).map((icon) => `public/${icon.src.replace(/^\.\//, "")}`),
  ...[...serviceWorker.matchAll(/"\/(after-hours-[a-z0-9-]+\.(?:svg|png))"/g)].map((match) => `public/${match[1]}`),
]);

if ((manifest.icons ?? []).some((icon) => !icon.src.endsWith(".png"))) {
  console.error("PWA install manifest must use the validated PNG icon set for broad platform compatibility.");
  process.exit(1);
}

if (!manifest.icons?.some((icon) => icon.sizes === "192x192" && icon.src.endsWith("after-hours-icon-192.png"))
  || !manifest.icons?.some((icon) => icon.sizes === "512x512" && icon.src.endsWith("after-hours-icon-512.png") && icon.purpose.includes("maskable"))) {
  console.error("PWA manifest must include the 192px icon and maskable 512px icon.");
  process.exit(1);
}

if (!serviceWorker.includes('const CACHE_NAME = "after-hours-v14"')) {
  console.error("Service worker cache must be bumped when the app shell or install manifest changes.");
  process.exit(1);
}

const missing = [...referencedIcons].filter((path) => !existsSync(path));
if (missing.length) {
  console.error("Missing referenced brand assets:", missing.join(", "));
  process.exit(1);
}

if (!(teaserSource.includes("after-hours-brand-logo.svg") || teaserSource.includes("after-hours-brand-logo-transparent.svg")) || teaserSource.includes('src="/after-hours-logo.svg"')) {
  console.error("Teaser screens must use the approved full brand lockup, not the monogram app icon.");
  process.exit(1);
}

if (!(onboardingSource.includes("after-hours-brand-logo.svg") || onboardingSource.includes("after-hours-brand-logo-transparent.svg")) || onboardingSource.includes('src="/after-hours-logo.svg"')) {
  console.error("Onboarding must use the approved full brand lockup, not the monogram app icon.");
  process.exit(1);
}

if (!(maintenanceSource.includes("after-hours-brand-logo.svg") || maintenanceSource.includes("after-hours-brand-logo-transparent.svg"))) {
  console.error("The maintenance screen must use the approved full brand lockup, not the monogram app icon.");
  process.exit(1);
}

if (!html.includes('rel="apple-touch-icon"') || !html.includes("after-hours-icon-180.png")) {
  console.error("The iOS home-screen touch icon must reference the native 180px PNG asset.");
  process.exit(1);
}

const fullLogoPlacements = (appSource.split("after-hours-brand-logo.svg").length - 1) + (appSource.split("after-hours-brand-logo-transparent.svg").length - 1);
const wordmarkPlacements = (appSource.split("after-hours-wordmark.svg").length - 1) + (appSource.split("after-hours-wordmark-transparent.svg").length - 1);
if (fullLogoPlacements < 3 || wordmarkPlacements !== 2) {
  console.error("The full emblem must remain on access/recovery gates, while the horizontal wordmark is used in the header and home hero.");
  process.exit(1);
}

for (const selector of [".home-wordmark", ".brand-nav", ".gate-logo"]) {
  if (!appStyles.includes(selector)) {
    console.error("Missing responsive logo styling for:", selector);
    process.exit(1);
  }
}

for (const iconPath of ["after-hours-icon-192.png", "after-hours-brand-logo.svg", "after-hours-wordmark.svg"]) {
  if (!serviceWorker.includes(iconPath)) {
    console.error("Service worker does not reference the current app icon:", iconPath);
    process.exit(1);
  }
}

if (serviceWorker.includes("/after-hours-icon-192.svg")) {
  console.error("Service worker still references the retired 192px SVG icon.");
  process.exit(1);
}

for (const required of ["public/after-hours-icon-192.png", "public/after-hours-icon-180.png", "public/after-hours-icon-512.png", "public/after-hours-brand-logo.svg", "public/after-hours-wordmark.svg"]) {
  if (!existsSync(required)) {
    console.error("Missing PWA fallback icon:", required);
    process.exit(1);
  }
}


const visualReferences = [...appStyles.matchAll(/url\(["']?(\/visuals\/[^"')]+)["']?\)/g)].map((match) => match[1]);
const missingVisuals = [...new Set(visualReferences)]
  .filter((asset) => !existsSync(`public${asset}`));
if (missingVisuals.length) {
  console.error("Missing referenced cinematic visual assets:", missingVisuals.join(", "));
  process.exit(1);
}

console.log(`Brand asset guard passed: canonical logo matches master icon; app placements, responsive styles, PWA icons and ${referencedIcons.size} referenced assets verified.`);
