import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = "dist";
const base = "/AfterHours/";

async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewrite(path);
      continue;
    }
    if (!entry.isFile() || !path.endsWith(".js")) continue;
    const source = await readFile(path, "utf8");
    // Vite rewrites imported assets and CSS. This catches public paths stored
    // as runtime strings in React components (logo, photos, maintenance.json,
    // and service-worker registration) for GitHub Pages' repository subpath.
    const output = source.replace(/(["'`])\/(?!\/)([^"'\`]*?)\1/g, (_match, quote, target) => {
      if (target.startsWith("AfterHours/")) return quote + "/" + target + quote;
      return quote + base + target + quote;
    });
    if (output !== source) await writeFile(path, output);
  }
}

await rewrite(root);
console.log("GitHub Pages public paths rewritten for " + base);
