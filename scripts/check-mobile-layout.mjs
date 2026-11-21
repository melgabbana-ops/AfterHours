import { readFile } from "node:fs/promises";

const [html, baseStyles, cinematicStyles, meditationStyles, rankStyles, worldAtmosphereStyles, worldExperienceStyles, referenceHomeStyles, tabletStyles, mainSource, serviceWorker, onboarding, heroPoster] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("src/styles.css", "utf8"),
  readFile("src/approved-cinematic.css", "utf8"),
  readFile("src/AftercareMeditation.css", "utf8"),
  readFile("src/CharacterRankEvolution.css", "utf8"),
  readFile("src/cinematic-world.css", "utf8"),
  readFile("src/cinematic-experience.css", "utf8"),
  readFile("src/reference-home.css", "utf8"),
  readFile("src/tablet-layout.css", "utf8"),
  readFile("src/main.tsx", "utf8"),
  readFile("public/sw.js", "utf8"),
  readFile("src/Onboarding.tsx", "utf8"),
  readFile("public/visuals/reference-home.svg", "utf8"),
]);
const styles = baseStyles + "\n" + cinematicStyles + "\n" + meditationStyles + "\n" + rankStyles + "\n" + worldAtmosphereStyles + "\n" + worldExperienceStyles + "\n" + referenceHomeStyles + "\n" + tabletStyles;

const checks = [
  ["viewport-fit for modern mobile safe areas", /name=["']viewport["'][^>]*viewport-fit=cover/i.test(html)],
  ["responsive mobile breakpoint", /@media\s*\(\s*max-width\s*:\s*520px\s*\)/i.test(styles)],
  ["mobile form controls avoid automatic zoom", /@media\s*\(\s*max-width\s*:\s*767px\s*\)[\s\S]*?:where\(\s*input\s*,\s*select\s*,\s*textarea\s*\)\s*\{[^}]*font-size\s*:\s*max\(\s*16px\s*,\s*1em\s*\)\s*!important/i.test(styles)],
  ["safe-area top inset", /env\(\s*safe-area-inset-top/i.test(styles)],
  ["safe-area bottom inset", /env\(\s*safe-area-inset-bottom/i.test(styles)],
  ["44px minimum touch target", /button\s*\{[^}]*min-height\s*:\s*44px/i.test(styles)],
  ["private safeword reveal controls keep a 44px touch target", /\.safety-signal-visibility\s*\{[^}]*min-height\s*:\s*44px/i.test(baseStyles)],
  ["horizontal overflow protection", /(?:body|html,body,#root)\s*\{[^}]*overflow-x\s*:\s*(?:hidden|clip)/i.test(styles)],
  ["border-box sizing", /\*\s*\{\s*box-sizing\s*:\s*border-box/i.test(styles)],
  ["GitHub Pages-safe visual asset paths", !/url\(\s*["']?\/(?:visuals|assets)\//i.test(styles)],
  ["Home hero uses only the bundled 4K local artwork", /--ah-cinematic-background:\s*url\(["']?\/AfterHours\/visuals\/reference-home\.svg["']?\)/i.test(referenceHomeStyles)],
  ["Home hero has no external image dependency", !/url\(\s*["']?https?:\/\//i.test(referenceHomeStyles)],
  ["Home hero artwork is included in the offline app shell", serviceWorker.includes('asset("visuals/reference-home.svg")')],
  ["Home hero background layers have matching positions and sizes", referenceHomeStyles.includes("background-position:center 24%,center!important;") && referenceHomeStyles.includes("background-size:cover,cover!important;") && referenceHomeStyles.includes("background-repeat:no-repeat,no-repeat!important;")],
  ["onboarding trailer poster uses the configured Pages base path", onboarding.includes('poster={`${import.meta.env.BASE_URL}visuals/reference-home.svg`}')],
  ["onboarding trailer poster points to the committed 4K black-and-gold intro artwork", /<svg\b[^>]*\bwidth="3840"[^>]*\bheight="2160"/s.test(heroPoster)],
  ["aftercare meditation skip control keeps a 48px touch target", meditationStyles.includes(".aftercare-meditation-skip") && /aftercare-meditation-actions button\{[^}]*min-height:48px/.test(meditationStyles)],
  ["short-landscape layout breakpoint", /@media[^{}]*orientation\s*:\s*landscape[^{}]*max-height/i.test(styles)],
  ["tablet stylesheet is imported after the reference styles", mainSource.includes('import"./tablet-layout.css";')],
  ["tablet and iPad breakpoint starts at 700 CSS pixels", tabletStyles.includes("@media (min-width: 700px)")],
  ["large iPad landscape has a dedicated layout", tabletStyles.includes("@media (min-width: 1024px) and (orientation: landscape)")],
  ["tablet Home shortcuts expand to four columns", tabletStyles.includes("grid-template-columns: repeat(4, minmax(0, 1fr)) !important;")],
  ["tablet experience cards use a three-column layout", tabletStyles.includes("grid-template-columns: repeat(3, minmax(0, 1fr)) !important;")],
  ["tablet navigation controls keep 56px touch targets", tabletStyles.includes("min-height: 56px !important;")],
  ["tablet navigation respects iPad safe-area insets", tabletStyles.includes("env(safe-area-inset-bottom, 0px)") && tabletStyles.includes("env(safe-area-inset-left, 0px)")],
  ["tablet camera preview hides the uncomposited source video", /\.media-live-source\s*\{\s*display:\s*none\s*!important/.test(tabletStyles)],
  ["tablet camera preview keeps the branded composite centered and bounded", tabletStyles.includes(".media-live-composite") && tabletStyles.includes("max-height: min(62dvh, 620px) !important;")],
  ["tablet camera overlay watermark stays anchored above the preview", tabletStyles.includes(".media-live-watermark") && tabletStyles.includes("pointer-events: none !important;")],
  ["tablet media frame choices use three comfortable columns", tabletStyles.includes(".media-frame-picker > div") && tabletStyles.includes("grid-template-columns: repeat(3, minmax(0, 1fr)) !important;")],
  ["tablet capture consent spans the complete control row", tabletStyles.includes(".media-capture-controls > .media-consent-check") && tabletStyles.includes("grid-column: 1 / -1 !important;")],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log((passed ? "PASS " : "FAIL ") + label);
}
if (failed.length) {
  console.error(`Mobile layout guard failed: ${failed.length} of ${checks.length} checks.`);
  process.exit(1);
}
console.log(`Mobile layout guard passed: all ${checks.length} responsive and asset-path foundations are present.`);
