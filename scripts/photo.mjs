#!/usr/bin/env node
/**
 * Builds a post's images from real photographs instead of generating them.
 *
 *   npm run photo -- <slug> --banner <url|path> [--thumb <url|path>]
 *                           [--in <name>=<url|path> ...] [--position attention]
 *   npm run photo -- <slug>            # re-run from the sources already recorded
 *
 * `npm run banner` is for the illustrated posts: a scene, the house style, a
 * picture that did not exist before. This is for the posts about a real place,
 * where the pictures are photographs someone took — usually the place's own.
 * Same output as the banner script, so nothing downstream knows the
 * difference: public/posts/<slug>/banner.webp (1600×900) and thumb.webp
 * (480×270), plus any --in images at 1200 wide for the body.
 *
 * The sources are written to public/posts/<slug>/photos.json so the images can
 * be rebuilt from the same files later — the same reason the generated ones
 * keep their scene in the front matter. Whose photographs they are belongs in
 * the post: `imageCredit` and `imageCreditUrl` put a line under the banner.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
if (!slug) {
  console.error('usage: npm run photo -- <slug> --banner <url|path> [--thumb <url|path>] [--in name=<url|path>] [--position attention]');
  process.exit(2);
}

const outDir = path.join(ROOT, "public", "posts", slug);
const manifestFile = path.join(outDir, "photos.json");
const manifest = fs.existsSync(manifestFile)
  ? JSON.parse(fs.readFileSync(manifestFile, "utf8"))
  : { inline: {} };

if (flag("banner")) manifest.banner = flag("banner");
if (flag("thumb")) manifest.thumb = flag("thumb");
if (flag("position")) manifest.position = flag("position");
for (let i = 0; i < args.length; i += 1) {
  if (args[i] !== "--in") continue;
  const [name, ...rest] = String(args[i + 1] ?? "").split("=");
  if (!name || rest.length === 0) {
    console.error(`--in wants name=<url|path>, got "${args[i + 1]}"`);
    process.exit(2);
  }
  manifest.inline[name] = rest.join("=");
}
if (!manifest.banner) {
  console.error(`no banner source for ${slug}: pass --banner <url|path> (it is remembered afterwards).`);
  process.exit(2);
}

/** A source is a URL to fetch or a file on this machine. */
async function load(source) {
  if (!/^https?:\/\//.test(source)) {
    const file = path.isAbsolute(source) ? source : path.join(ROOT, source);
    return fs.readFileSync(file);
  }
  const response = await fetch(source, { headers: { "User-Agent": "natelewis.dev/photo" } });
  if (!response.ok) throw new Error(`${response.status} fetching ${source}`);
  return Buffer.from(await response.arrayBuffer());
}

// `attention` crops to the busiest part of the frame, which for a plate of food
// is the food; centre is the better default for anything composed already.
const position = manifest.position ?? "centre";
const sizes = [
  ["banner.webp", manifest.banner, 1600, 900, 82],
  ["thumb.webp", manifest.thumb ?? manifest.banner, 480, 270, 80],
];

fs.mkdirSync(outDir, { recursive: true });
for (const [name, source, width, height, quality] of sizes) {
  const image = await load(source);
  await sharp(image)
    .resize(width, height, { fit: "cover", position })
    .webp({ quality })
    .toFile(path.join(outDir, name));
  console.log(`wrote public/posts/${slug}/${name} ← ${source}`);
}
for (const [name, source] of Object.entries(manifest.inline ?? {})) {
  const image = await load(source);
  await sharp(image)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(outDir, `${name}.webp`));
  console.log(`wrote public/posts/${slug}/${name}.webp ← ${source}`);
}

fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
// The dev server caches every rendered size of next/image on disk and answers
// 304 against it, so a rebuilt image keeps showing the old one until that goes.
fs.rmSync(path.join(ROOT, ".next", "dev", "cache", "images"), { recursive: true, force: true });
console.log(`sources recorded in public/posts/${slug}/photos.json`);
