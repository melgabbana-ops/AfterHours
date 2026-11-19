import { readFile } from "node:fs/promises";

const [html, baseStyles, cinematicStyles, onboarding, heroPoster] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("src/styles.css", "utf8"),
  readFile("src/approved-cinematic.css", "utf8"),
  readFile("src/Onboarding.tsx", "utf8"),
  readFile("public/visuals/reference-home.svg", "utf8"),
]);
const styles = baseStyles + "\n" + cinematicStyles;

const checks = [
  ["viewport-fit for modern mobile safe areas", /name=["']viewport["'][^>]*viewport-fit=cover/i.test(html)],
  ["responsive mobile breakpoint", /@media\s*\(\s*max-width\s*:\s*520px\s*\)/i.test(styles)],
  ["mobile form controls avoid automatic zoom", /@media\s*\(\s*max-width\s*:\s*767px\s*\)[\s\S]*?:where\(\s*input\s*,\s*select\s*,\s*textarea\s*\)\s*\{[^}]*font-size\s*:\s*max\(\s*16px\s*,\s*1em\s*\)\s*!important/i.test(styles)],
  ["safe-area top inset", /env\(\s*safe-area-inset-top/i.test(styles)],
  ["safe-area bottom inset", /env\(\s*safe-area-inset-bottom/i.test(styles)],
  ["44px minimum touch target", /button\s*\{[^}]*min-height\s*:\s*44px/i.test(styles)],
  ["horizontal overflow protection", /(?:body|html,body,#root)\s*\{[^}]*overflow-x\s*:\s*(?:hidden|clip)/i.test(styles)],
  ["border-box sizing", /\*\s*\{\s*box-sizing\s*:\s*border-box/i.test(styles)],
  ["GitHub Pages-safe visual asset paths", !/url\(\s*["']?\/(?:visuals|assets)\//i.test(styles)],
  ["onboarding trailer poster uses the configured Pages base path", onboarding.includes('poster={`${import.meta.env.BASE_URL}visuals/reference-home.svg`}')],
  ["onboarding trailer poster points to the committed 4K black-and-gold intro artwork", /<svg\b[^>]*\bwidth="3840"[^>]*\bheight="2160"/s.test(heroPoster)],
  ["short-landscape layout breakpoint", /@media[^{}]*orientation\s*:\s*landscape[^{}]*max-height/i.test(styles)],
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
