#!/usr/bin/env node
/**
 * Generates a post's banner and thumbnail with Gemini's image model.
 *
 *   npm run banner -- <slug> [--prompt "scene"] [--model gemini-3.1-flash-image] [--no-reference]
 *
 * The scene comes from the post's `banner:` front matter unless --prompt
 * overrides it. The *style* is not in the post at all: it is STYLE below, one
 * place, so every banner on the site is drawn the same way and a change to
 * the house look is one edit and a re-run. The avatar is passed as a
 * reference image so the recurring character stays the same person.
 *
 * Writes public/posts/<slug>/banner.webp (1600×900) and thumb.webp (480×270).
 * Needs GEMINI_API_KEY in .env.local (gitignored) or the environment.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_MODEL = "gemini-3.1-flash-image";

/** The house look. Change it here and re-run `npm run banner` on every post. */
const STYLE = [
  "Clean modern anime illustration, cel shading with soft gradient lighting,",
  "wide cinematic 16:9 composition, a calm muted palette with one strong accent colour,",
  "slightly stylised environments with readable detail, no text, no letters, no logos,",
  "no watermark, no UI chrome. If a person appears, it is the character from the",
  "reference image — same face, glasses and beard, drawn in this same style — and",
  "they are always wearing a hat that covers the hair completely: a bucket hat,",
  "a ball cap, a beanie, or whatever suits the scene. Never bare-headed.",
].join(" ");

const loadEnv = () => {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
};

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
if (!slug) {
  console.error("usage: npm run banner -- <slug> [--prompt \"scene\"] [--model id] [--no-reference]");
  process.exit(2);
}

loadEnv();
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set; put it in .env.local (gitignored).");
  process.exit(2);
}

const postFile = path.join(ROOT, "content", "posts", `${slug}.md`);
if (!fs.existsSync(postFile)) {
  console.error(`no such post: content/posts/${slug}.md`);
  process.exit(2);
}
const { data } = matter(fs.readFileSync(postFile, "utf8"));
const scene = flag("prompt") ?? data.banner;
if (!scene) {
  console.error("no scene: add `banner: \"...\"` to the post's front matter or pass --prompt.");
  process.exit(2);
}
const accent = data.accent ?? "#0ea5e9";
const model = flag("model") ?? DEFAULT_MODEL;
const useReference = !args.includes("--no-reference");

const parts = [{ text: `${STYLE} Accent colour ${accent}.\n\nScene: ${scene}` }];
if (useReference) {
  const avatar = path.join(ROOT, "public", "avatar.webp");
  parts.push({ inlineData: { mimeType: "image/webp", data: fs.readFileSync(avatar).toString("base64") } });
}

console.log(`banner: ${slug} via ${model}${useReference ? " (with avatar reference)" : ""}`);
console.log(`scene:  ${scene}`);

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
    }),
  },
);
if (!response.ok) {
  console.error(`Gemini ${response.status}: ${(await response.text()).slice(0, 600)}`);
  process.exit(1);
}
const body = await response.json();
const image = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
if (!image) {
  console.error("no image in the response:", JSON.stringify(body).slice(0, 600));
  process.exit(1);
}

const outDir = path.join(ROOT, "public", "posts", slug);
fs.mkdirSync(outDir, { recursive: true });
const source = Buffer.from(image.data, "base64");
await sharp(source).resize(1600, 900, { fit: "cover" }).webp({ quality: 82 }).toFile(path.join(outDir, "banner.webp"));
await sharp(source).resize(480, 270, { fit: "cover" }).webp({ quality: 80 }).toFile(path.join(outDir, "thumb.webp"));
const size = (f) => `${Math.round(fs.statSync(path.join(outDir, f)).size / 1024)} KB`;
// The dev server caches every rendered size of next/image on disk and answers
// 304 against it, so a regenerated banner keeps showing the old one until the
// cache goes. Production is a fresh container per deploy and never hits this.
fs.rmSync(path.join(ROOT, ".next", "dev", "cache", "images"), { recursive: true, force: true });

console.log(`wrote public/posts/${slug}/banner.webp (${size("banner.webp")}) and thumb.webp (${size("thumb.webp")})`);
