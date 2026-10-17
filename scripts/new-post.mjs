#!/usr/bin/env node
/**
 * Scaffolds a post.
 *
 *   npm run new-post -- <slug> [--title "..."] [--date YYYY-MM-DD] [--tags a,b]
 *                              [--accent "#hex"] [--shape free|walkthrough|review]
 *
 * The front matter is fixed; the body is not. A post is written in whatever
 * shape its story has, with its own `##` headings — that is the default
 * (`--shape free`). The other shapes are there when they fit:
 *
 *   walkthrough  the problem-and-fix sections, for a post that really is one
 *   review       somewhere I went or something I used: `kind: review`, a star
 *                rating per aspect instead of a TL;DR, then the verdict
 *
 * A short post is a post. There is no separate short form: three paragraphs
 * with a TL;DR on top is a perfectly good one.
 *
 * Nothing downstream depends on a particular heading — the contents block,
 * the lists and the feeds are built from whatever headings a post has.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("usage: npm run new-post -- <kebab-case-slug> [--title ...] [--date YYYY-MM-DD] [--tags a,b]");
  process.exit(2);
}
const file = path.join(ROOT, "content", "posts", `${slug}.md`);
if (fs.existsSync(file)) {
  console.error(`already exists: content/posts/${slug}.md`);
  process.exit(2);
}

const title = flag("title") ?? slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const date = flag("date") ?? new Date().toISOString().slice(0, 10);
const tags = (flag("tags") ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
const accent = flag("accent") ?? "#0ea5e9";
const shape = flag("shape") ?? "free";
if (!["free", "walkthrough", "review"].includes(shape)) {
  console.error(`unknown shape "${shape}": free, walkthrough or review`);
  process.exit(2);
}

/** The front matter every post carries; `images` differs by where the pictures come from. */
const frontMatter = (images) => `---
schema: 2
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
description: ""
tldr:
  # 3–4 bullets, one line each, the way you'd say it at a whiteboard, and each one
  # standing on its own for a reader who has not read the post. Written last.
  - ""
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
accent: "${accent}"
draft: true
${images}---
`;

const SCENE = 'banner: ""\n';

export const TEMPLATE = `${frontMatter(SCENE)}
<!-- Open with what happened and why anyone would care, then write it in the shape
     the story has: your own ## headings, as many as it needs. No heading here. -->
`;

export const WALKTHROUGH_TEMPLATE = `${frontMatter(SCENE)}
<!-- One or two paragraphs: what this is about, and why anyone would care. No heading. -->

## The problem

<!-- What I was trying to do, what was in the way, and what made it hard. -->

## What I tried

<!-- One H3 per approach, in the order they happened, with the code that mattered. -->

### First attempt

## What happened

<!-- The results, with the numbers. Include what did not work. -->

## Where it landed

<!-- The outcome as it stands, good or bad, and what is still open. -->

## Links

<!-- Sources, docs, tools and prior art referenced above. -->
`;

const REVIEW_FRONT_MATTER = `---
schema: 2
kind: review
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
description: ""
reviewOf: ""          # the name of the thing: "Mexica Burrito Grill"
reviewOfType: ""      # schema.org type: Restaurant, LocalBusiness, Product, Book…
reviewOfUrl: ""       # its own site, if it has one
rating:
  # The parts that mattered, in the order worth reading them. Stars are out of
  # five in halves; the overall score is their mean, so do not write one here.
  - aspect: ""
    stars: 0
    note: ""
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
accent: "${accent}"
draft: true
${SCENE}---
`;

export const REVIEW_TEMPLATE = `${REVIEW_FRONT_MATTER}
<!-- Open with the drive up, the door, the first bite — whatever the memory of the
     place starts with. The middle headings are yours; these two end every review. -->

## The verdict

<!-- Would you go back, and what would you order. -->

## Where

<!-- Address, hours, the place's own site — or where to get the thing. -->
`;

const BODY = { free: TEMPLATE, walkthrough: WALKTHROUGH_TEMPLATE, review: REVIEW_TEMPLATE };
fs.writeFileSync(file, BODY[shape]);
console.log(`wrote content/posts/${slug}.md — fill it in, then \`npm run check-post -- ${slug}\``);
