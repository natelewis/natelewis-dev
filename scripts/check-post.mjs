#!/usr/bin/env node
/**
 * The gate a post passes before it leaves this machine.
 *
 *   npm run check-post -- <slug> [--strict]
 *   npm run check-post              (every post)
 *
 * Two kinds of finding. An ERROR fails the run: front matter the site cannot
 * render, or anything that looks like a secret or a private detail — API
 * keys, tokens, `.env` assignments, home-directory paths, private IPs,
 * email addresses. A WARNING is printed and does not fail unless --strict:
 * a missing banner, no external links, a heading with nothing under it, a
 * post behind the current schema.
 *
 * It does not ask every post to be the same shape. The walkthrough headings
 * are one shape a post can take, and when a post is clearly using them the
 * check asks for the rest; a post with its own headings is left alone.
 *
 * It is a pattern scan, not a judgment; it catches the things that leak by
 * accident. What is confidential in substance still needs a person to read it.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS = path.join(ROOT, "content", "posts");
const SCHEMA_VERSION = 2;
/**
 * The walkthrough shape: the headings a problem-and-fix post tends to have.
 * A post that uses two or more of them is taken to be that shape and is asked
 * for the others, so a half-applied template gets caught. A post with its own
 * headings is a post with its own headings.
 */
const WALKTHROUGH = ["The problem", "What I tried", "What happened", "Where it landed", "Links"];

/** Each pattern names what it catches; the name is what the report prints. */
const SECRET_PATTERNS = [
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}/],
  ["OpenAI-style key", /\bsk-[A-Za-z0-9_-]{20,}/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["bearer token", /\bBearer\s+[A-Za-z0-9._~+/-]{24,}/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["env assignment with a value", /^\s*(?:export\s+)?[A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|PASS|CREDENTIALS?)\s*=\s*(?!\s*$|\*{3}|<|\.\.\.|"\s*"|'\s*')\S+/m],
  ["home-directory path", /(?:\/Users\/|\/home\/)[a-z][a-z0-9_-]*\//],
  ["private IPv4", /\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}(?:\.\d{1,3})?\b/],
  ["email address", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ["service-account key file", /service-account[a-z-]*\.json/i],
];
/** Emails and hosts that are public by design. */
const ALLOW = [/@example\.com$/i, /^noreply@/i];

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const only = args.find((a) => !a.startsWith("--"));
const files = only ? [`${only}.md`] : fs.readdirSync(POSTS).filter((f) => f.endsWith(".md"));

let errors = 0;
let warnings = 0;
const report = (level, slug, message) => {
  if (level === "ERROR") errors += 1;
  else warnings += 1;
  console.log(`${level.padEnd(7)} ${slug}: ${message}`);
};

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const full = path.join(POSTS, file);
  if (!fs.existsSync(full)) {
    report("ERROR", slug, "no such post");
    continue;
  }
  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);

  // Front matter the site needs.
  if (!data.title) report("ERROR", slug, "missing title");
  // Results pages cut a <title> near 60 characters (the page drops the site suffix past that).
  const searchTitle = String(data.seoTitle ?? data.title ?? "");
  if (searchTitle.length > 70) report("WARN", slug, `search title is ${searchTitle.length} chars and will be cut in results; add a shorter seoTitle (the H1 keeps title)`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date ?? "").slice(0, 10))) report("ERROR", slug, "date must be YYYY-MM-DD");
  if (!data.description) report("ERROR", slug, "missing description (shown on the list, in RSS and in <meta>)");
  else if (String(data.description).length > 160) report("WARN", slug, `description is ${String(data.description).length} chars; 160 is the useful limit for previews`);
  // A review is scored out of five instead of summarised; everything else is a post.
  const isReview = data.kind === "review";
  const wordCount = content.replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;
  if (data.kind && !["post", "review"].includes(data.kind)) report("ERROR", slug, `kind "${data.kind}" is not post or review`);

  // Schema 2: the TL;DR is what lets a reader decide in ten seconds, and what search shows.
  const tldr = Array.isArray(data.tldr) ? data.tldr.map(String).filter(Boolean) : [];
  if (Number(data.schema ?? 0) >= 2 && tldr.length === 0 && !isReview) report("ERROR", slug, "missing tldr (schema 2 requires 3–4 bullets)");
  else if (tldr.length > 0 && (tldr.length < 3 || tldr.length > 4)) report("WARN", slug, `tldr has ${tldr.length} bullets; 3–4 is the range`);
  for (const line of tldr) {
    if (line.length > 130) report("WARN", slug, `tldr bullet is ${line.length} chars; one line, under ~130: "${line.slice(0, 40)}…"`);
    if (String(data.description ?? "").trim() === line.trim()) report("WARN", slug, "a tldr bullet repeats the description; they should say different things");
  }
  // A review's scorecard stands where the TL;DR does, so it carries the same weight.
  const rating = Array.isArray(data.rating) ? data.rating : [];
  if (isReview && rating.length === 0) report("ERROR", slug, "a review needs a `rating:` list — the parts that mattered, each out of five");
  else if (isReview && rating.length < 3) report("WARN", slug, `rating has ${rating.length} aspect(s); 3–6 is the range that reads as a scorecard`);
  else if (rating.length > 6) report("WARN", slug, `rating has ${rating.length} aspects; past 6 nobody reads the rows`);
  if (!isReview && rating.length > 0) report("WARN", slug, "`rating:` only renders on a review (kind: review)");
  for (const row of rating) {
    if (!row?.aspect) report("ERROR", slug, "a rating row has no `aspect:`");
    const stars = Number(row?.stars);
    if (!Number.isFinite(stars) || stars < 0 || stars > 5) report("ERROR", slug, `rating "${row?.aspect}" is ${row?.stars}; stars run 0 to 5`);
    else if (stars * 2 !== Math.round(stars * 2)) report("WARN", slug, `rating "${row?.aspect}" is ${stars}; stars go in halves and will be rounded`);
    if (row?.note && String(row.note).length > 70) report("WARN", slug, `rating note for "${row.aspect}" is ${String(row.note).length} chars; a few words fit the row`);
  }
  if (isReview && !data.reviewOf) report("WARN", slug, "no `reviewOf:` naming the thing, so the review has no structured data for search");
  if (!Array.isArray(data.tags) || data.tags.length === 0) report("WARN", slug, "no tags");
  else for (const tag of data.tags) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(tag))) report("ERROR", slug, `tag "${tag}" is not lowercase kebab-case`);
  }
  if (Number(data.schema ?? 0) !== SCHEMA_VERSION) report("WARN", slug, `schema ${data.schema ?? "unset"}; current is ${SCHEMA_VERSION}`);
  if (data.draft) report("WARN", slug, "still a draft (unlisted; set draft: false to publish)");

  // Images: generated from a scene, or built from photographs someone took.
  const postImages = path.join(ROOT, "public", "posts", slug);
  const banner = path.join(postImages, "banner.webp");
  const photosFile = path.join(postImages, "photos.json");
  const fromPhotos = fs.existsSync(photosFile);
  // A picture off the web belongs to somebody; one from a path is the author's own.
  const borrowed = fromPhotos && /"https?:\/\//.test(fs.readFileSync(photosFile, "utf8"));
  if (!fs.existsSync(banner)) report("WARN", slug, `no banner (npm run banner -- ${slug}, or npm run photo -- ${slug} --banner <url>)`);
  else if (fs.existsSync(banner) && !fromPhotos && !data.banner) report("WARN", slug, "banner exists but front matter has no `banner:` scene, so it cannot be regenerated");
  if (borrowed && !data.imageCredit) report("WARN", slug, "images came from the web (photos.json) but there is no `imageCredit:` saying whose they are");

  // Structure: whatever headings the post chose, each with something under it.
  const headings = [...content.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  // A few hundred words needs no headings; past that, a reader wants somewhere to land.
  if (headings.length === 0 && wordCount > 600) report("WARN", slug, `no sections in ${wordCount} words; somewhere past here a reader wants \`##\` headings`);
  const walkthrough = WALKTHROUGH.filter((h) => headings.includes(h));
  if (walkthrough.length >= 2) {
    for (const section of WALKTHROUGH) {
      if (!headings.includes(section)) report("WARN", slug, `the walkthrough shape is missing "## ${section}" (drop the shape, or finish it)`);
    }
  }
  for (const section of headings) {
    const body = content.split(new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"))[1]?.split(/^## /m)[0] ?? "";
    const stripped = body.replace(/<!--[\s\S]*?-->/g, "").trim();
    if (!stripped) report("WARN", slug, `"## ${section}" is empty`);
  }
  if (/<!--[\s\S]*?-->/.test(content)) report("WARN", slug, "template comments still present");

  // A review ends the same way every time: the verdict, then where to get it.
  if (isReview) {
    for (const section of ["The verdict", "Where"]) {
      if (!headings.includes(section)) report("WARN", slug, `a review wants a "## ${section}" section`);
    }
  }

  // Links out.
  const external = [...content.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
  if (external.length === 0) report("WARN", slug, "no external links; sources and docs are encouraged");
  if (/\]\(https?:\/\/localhost/.test(content)) report("ERROR", slug, "links to localhost");

  // Secrets and private detail, in the whole file including front matter.
  for (const [name, pattern] of SECRET_PATTERNS) {
    const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    for (const match of raw.matchAll(global)) {
      if (name === "email address" && ALLOW.some((a) => a.test(match[0]))) continue;
      const line = raw.slice(0, match.index).split("\n").length;
      report("ERROR", slug, `${name} at line ${line}: ${match[0].slice(0, 12)}…`);
    }
  }
}

console.log(`\n${files.length} post(s): ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors > 0 || (strict && warnings > 0) ? 1 : 0);
