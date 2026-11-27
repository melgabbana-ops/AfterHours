import { access, readFile } from "node:fs/promises";

const [html, baseStyles, cinematicStyles, meditationStyles, rankStyles, worldAtmosphereStyles, worldExperienceStyles, referenceHomeStyles, referencePagesStyles, tabletStyles, coldOpenStyles, settingsStyles, mainSource, serviceWorker, onboarding, heroPoster, coldOpenSource, navigationSource] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("src/styles.css", "utf8"),
  readFile("src/approved-cinematic.css", "utf8"),
  readFile("src/AftercareMeditation.css", "utf8"),
  readFile("src/CharacterRankEvolution.css", "utf8"),
  readFile("src/cinematic-world.css", "utf8"),
  readFile("src/cinematic-experience.css", "utf8"),
  readFile("src/reference-home.css", "utf8"),
  readFile("src/reference-pages.css", "utf8"),
  readFile("src/tablet-layout.css", "utf8"),
  readFile("src/cold-open-intro.css", "utf8"),
  readFile("src/settings-screen.css", "utf8"),
  readFile("src/main.tsx", "utf8"),
  readFile("public/sw.js", "utf8"),
  readFile("src/Onboarding.tsx", "utf8"),
  readFile("public/visuals/reference-home.svg", "utf8"),
  readFile("src/ColdOpenIntro.tsx", "utf8"),
  readFile("src/navigation.ts", "utf8"),
]);
const styles = baseStyles + "\n" + cinematicStyles + "\n" + meditationStyles + "\n" + rankStyles + "\n" + worldAtmosphereStyles + "\n" + worldExperienceStyles + "\n" + referenceHomeStyles + "\n" + referencePagesStyles + "\n" + tabletStyles + "\n" + coldOpenStyles + "\n" + settingsStyles;

const localVisualPaths = [...new Set([...styles.matchAll(/url\([^)]*\/visuals\/([^)]*)/g)]
  .map((match) => "public/visuals/" + match[1].replace(/["']/g, "").split(/[?#]/)[0]))];
const missingLocalVisuals = (await Promise.all(localVisualPaths.map(async (path) => {
  try { await access(path); return null; } catch { return path; }
}))).filter(Boolean);

const coldOpenActionCss = [...coldOpenStyles.matchAll(/\.cold-open-actions[^{}]*\{([^}]*)\}/g)].map((match) => match[1]).join("\n");

const checks = [
  ["viewport-fit for modern mobile safe areas", /name=["']viewport["'][^>]*viewport-fit=cover/i.test(html)],
  ["responsive mobile breakpoint", /@media\s*\(\s*max-width\s*:\s*520px\s*\)/i.test(styles)],
  ["mobile form controls avoid automatic zoom", /@media\s*\(\s*max-width\s*:\s*767px\s*\)[\s\S]*?:where\(\s*input\s*,\s*select\s*,\s*textarea\s*\)\s*\{[^}]*font-size\s*:\s*max\(\s*16px\s*,\s*1em\s*\)\s*!important/i.test(styles)],
  ["safe-area top inset", /env\(\s*safe-area-inset-top/i.test(styles)],
  ["safe-area bottom inset", /env\(\s*safe-area-inset-bottom/i.test(styles)],
  ["44px minimum touch target", /button\s*\{[^}]*min-height\s*:\s*44px/i.test(styles)],
  ["Cinematic World tab controls keep a 44px mobile touch target", /\.cw-tabs button\s*\{[^}]*min-height\s*:\s*44px/i.test(worldExperienceStyles)],
  ["Cinematic World back control keeps a 44px square touch target", /\.cw-header button\s*\{[^}]*width\s*:\s*44px[^}]*height\s*:\s*44px/i.test(worldExperienceStyles)],
  ["private safeword reveal controls keep a 44px touch target", /\.safety-signal-visibility\s*\{[^}]*min-height\s*:\s*44px/i.test(baseStyles)],
  ["horizontal overflow protection", /(?:body|html,body,#root)\s*\{[^}]*overflow-x\s*:\s*(?:hidden|clip)/i.test(styles)],
  ["border-box sizing", /\*\s*\{\s*box-sizing\s*:\s*border-box/i.test(styles)],
  ["GitHub Pages-safe visual asset paths", !/url\(\s*["']?\/(?:visuals|assets)\//i.test(styles)],
  ["all referenced reference-screen visual assets exist", missingLocalVisuals.length === 0],
  ["profile portrait uses bundled local artwork", mainSource.includes("visuals/reference-profile.svg") && !mainSource.includes("gcdn.picsart.com/editing-temp")],
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
  ["cold-open intro has a dedicated phone layout", coldOpenStyles.includes("@media(max-width:760px)")],
  ["cold-open immediate safety controls remain outside animated content", coldOpenStyles.includes(".cold-open-actions .cold-open-stop") && !/\banimation\s*:/.test(coldOpenActionCss)],
  ["cold-open respects reduced-motion preferences", coldOpenStyles.includes("@media(prefers-reduced-motion:reduce)")],
  ["settings screen collapses to one column on phones", settingsStyles.includes("@media(max-width:700px)") && settingsStyles.includes("grid-template-columns:1fr")],
  ["settings screen uses a two-column tablet and desktop grid", settingsStyles.includes("grid-template-columns:repeat(2,minmax(0,1fr))")],
  ["cold-open keeps the age declaration and PAUSE/STOP actions", coldOpenSource.includes("ageConfirmed") && coldOpenSource.includes("cold-open-pause") && coldOpenSource.includes("cold-open-stop")],
  ["cold-open artwork and logo are included in the offline app shell", coldOpenSource.includes("visuals/ah-grand-candlelit-chamber.svg") && coldOpenSource.includes("after-hours-brand-logo-transparent.svg") && serviceWorker.includes('asset("visuals/ah-grand-candlelit-chamber.svg")') && serviceWorker.includes('asset("after-hours-brand-logo-transparent.svg")')],
  ["direct safety and STOP links bypass the cold-open", navigationSource.includes('params.has("stop")') && navigationSource.includes('params.get("screen") === "safety"')],
  ["settings is a reachable app screen", mainSource.includes('screen==="settings"')],
  ["privacy mode masks private details without masking safety controls", referencePagesStyles.includes(".app.privacy-mode .profile h2") && referencePagesStyles.includes(".app.privacy-mode .cw-decrypted p") && !referencePagesStyles.includes(".app.privacy-mode .stop-controller")],
  ["tablet media frame choices use three comfortable columns", tabletStyles.includes(".media-frame-picker > div") && tabletStyles.includes("grid-template-columns: repeat(3, minmax(0, 1fr)) !important;")],
  ["tablet capture consent spans the complete control row", tabletStyles.includes(".media-capture-controls > .media-consent-check") && tabletStyles.includes("grid-column: 1 / -1 !important;")],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log((passed ? "PASS " : "FAIL ") + label);
}
if (missingLocalVisuals.length) console.error("Missing referenced visual assets:", missingLocalVisuals.join(", "));
if (failed.length) {
  console.error(`Mobile layout guard failed: ${failed.length} of ${checks.length} checks.`);
  process.exit(1);
}
console.log(`Mobile layout guard passed: all ${checks.length} responsive and asset-path foundations are present.`);
