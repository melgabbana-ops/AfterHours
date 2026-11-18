import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const directory = "public/visuals";
const files = readdirSync(directory).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort();
const vectorFiles = readdirSync(directory).filter((name) => /\.svg$/i.test(name)).sort();

function jpegDimensions(buffer) {
  let offset = 2;
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset);
    if (frameMarkers.has(marker)) {
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  return null;
}

function dimensions(buffer, extension) {
  if (extension === ".jpg" || extension === ".jpeg") return jpegDimensions(buffer);
  if (extension === ".png" && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (extension === ".webp" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const kind = buffer.toString("ascii", 12, 16);
    if (kind === "VP8X") return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  return null;
}

let below4k = 0;
let unread = 0;
for (const name of files) {
  const path = join(directory, name);
  const buffer = readFileSync(path);
  const size = dimensions(buffer, name.slice(name.lastIndexOf(".")).toLowerCase());
  if (!size) {
    unread += 1;
    console.error(`UNREAD ${name}: dimensions could not be read automatically`);
    continue;
  }
  const is4k = Math.max(size.width, size.height) >= 3840 && Math.min(size.width, size.height) >= 2160;
  if (!is4k) below4k += 1;
  console.log(`${is4k ? "4K" : "BELOW_4K"} ${name}: ${size.width}x${size.height} (${(statSync(path).size / 1024).toFixed(1)} KB)`);
}
const expectedVectorAssets = ["ah-aftercare-photo.svg", "ah-cinematic-hero.svg", "ah-completion-photo.svg", "ah-experience-photo.svg", "ah-horoscope-photo.svg", "ah-profile-photo.svg", "ah-radio-photo.svg", "ah-tarot-photo.svg"];
const missingVectorAssets = expectedVectorAssets.filter((name) => !vectorFiles.includes(name));
const invalidVectorAssets = expectedVectorAssets.filter((name) => vectorFiles.includes(name) && !/<svg[^>]*width="3840"[^>]*height="2160"[^>]*viewBox="0 0 3840 2160"/.test(readFileSync(join(directory, name), "utf8")));
if (missingVectorAssets.length || invalidVectorAssets.length) {
  console.error("Vector artwork check failed. Missing: " + (missingVectorAssets.join(", ") || "none") + "; invalid 4K canvas: " + (invalidVectorAssets.join(", ") || "none"));
  process.exitCode = 1;
}
console.log("Visual resolution audit: " + files.length + " raster assets checked; " + below4k + " below UHD 4K; " + unread + " unreadable raster assets; " + vectorFiles.length + " vector assets checked (" + expectedVectorAssets.length + " required 4K-canvas artworks).");
if (below4k || unread) {
  console.error("Visual quality gate failed: every raster visual must be readable and at least 3840x2160 (or portrait-equivalent).");
  process.exitCode = 1;
}
