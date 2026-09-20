#!/usr/bin/env node
/**
 * Scaffolds a post from the canonical template.
 *
 *   npm run new-post -- <slug> [--title "..."] [--date YYYY-MM-DD] [--tags a,b] [--accent "#hex"]
 *
 * The template is the one place the post structure is written down. Keep the
 * H2 headings as they are: they are what makes every post enhanceable the
 * same way later (a table of contents, a "where it landed" summary on the
 * list, a related-posts block keyed on tags) without reformatting old posts.
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

export const TEMPLATE = `---
schema: 1
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
description: ""
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
accent: "${accent}"
draft: true
banner: ""
---

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

fs.writeFileSync(file, TEMPLATE);
console.log(`wrote content/posts/${slug}.md — fill it in, then \`npm run check-post -- ${slug}\``);
