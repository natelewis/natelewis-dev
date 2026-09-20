---
schema: 1
title: "Hello, world"
date: "2026-09-20"
description: "What this site is, and how it's put together."
tags: ["meta"]
accent: "#0ea5e9"
---

This is the first post on natelewis.dev. The site is a small Next.js app:
posts are Markdown files in `content/posts`, compiled to HTML at build time,
and the whole thing runs as a container on Cloud Run that scales to zero when
nobody's reading.

## How a post gets here

1. Write a Markdown file with a little front matter.
2. Commit and push to `main`.
3. GitHub Actions builds the image and deploys it.

That's the entire publishing workflow. Here's what the front matter looks like:

```yaml
---
schema: 1
title: "Hello, world"
date: "2026-09-20"
description: "What this site is, and how it's put together."
tags: ["meta"]
accent: "#0ea5e9"
---
```

Code blocks are highlighted with [Shiki](https://shiki.style) at build time,
so there's no JavaScript shipped for syntax colours:

```ts
export function greet(name: string) {
  return `Hello, ${name}!`;
}
```

More soon.
